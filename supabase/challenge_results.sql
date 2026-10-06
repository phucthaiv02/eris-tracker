-- Run ONCE in Supabase SQL Editor AFTER 202610060001_initial.sql.
-- Deploy the matching UI only after this transaction completes.
-- The old submission table and import function are permanently removed.
-- Existing best scores and review outcomes are copied onto challenges first.
BEGIN;
LOCK TABLE public.challenges, public.submissions IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.challenges
 ADD COLUMN difficulty text CHECK (difficulty IS NULL OR length(difficulty) <= 80),
 ADD COLUMN public_score double precision,
 ADD COLUMN private_score double precision,
 ADD COLUMN private_baseline double precision;
ALTER TABLE public.challenges RENAME COLUMN baseline TO public_baseline;
ALTER TABLE public.challenges ALTER COLUMN direction DROP NOT NULL;
ALTER TABLE public.challenges DROP CONSTRAINT challenges_status_override_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_status_override_check
 CHECK (status_override IS NULL OR status_override IN ('Top leaderboard','Pass','Fail'));

-- Preserve the exact old Best Score calculation (including rejected scores).
-- Private results and difficulty remain NULL because the source did not contain them.
WITH previous_results AS (
 SELECT c.id,
  CASE WHEN c.direction = 'asc' THEN min(s.score) ELSE max(s.score) END AS score,
  CASE WHEN c.status_override = 'Top leaderboard' OR c.private_rank BETWEEN 1 AND 3 THEN 'Top leaderboard'
       WHEN count(s.id) = 0 THEN NULL
       WHEN bool_and(s.status = 'Rejected') THEN 'Fail' ELSE 'Pass' END AS status
 FROM public.challenges c LEFT JOIN public.submissions s ON s.challenge_id = c.id
 GROUP BY c.id
)
UPDATE public.challenges c SET public_score = p.score,
 status_override = coalesce(c.status_override, p.status)
FROM previous_results p WHERE p.id = c.id;

DROP FUNCTION public.import_legacy_tracker(jsonb);
DROP TABLE public.submissions;

-- Account-scoped import for challenge-only JSON exports.
CREATE FUNCTION public.import_tracker(payload jsonb) RETURNS integer
 LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c jsonb; legacy text; imported integer := 0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF jsonb_typeof(payload->'challenges') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Invalid challenges array';
 END IF;
 FOR c IN SELECT value FROM jsonb_array_elements(payload->'challenges') LOOP
  IF c ? 'submissions' THEN
   RAISE EXCEPTION 'This import accepts challenge-only backups. Use the schema conversion SQL for old submission data.';
  END IF;
  legacy := coalesce(nullif(c->>'legacy_id',''),nullif(c->>'id',''),md5(c->>'name'));
  INSERT INTO public.challenges
   (user_id,name,type,tags,metric,direction,difficulty,public_baseline,private_baseline,
    public_score,private_score,est_earn,actual_earn,public_rank,private_rank,status_override,legacy_id,created_at)
  VALUES
   (auth.uid(),trim(c->>'name'),coalesce(c->>'type',''),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(c->'tags','[]'::jsonb))),
    coalesce(c->>'metric',''),nullif(c->>'direction',''),nullif(trim(c->>'difficulty'),''),
    nullif(c->>'public_baseline','')::double precision,nullif(c->>'private_baseline','')::double precision,
    nullif(c->>'public_score','')::double precision,nullif(c->>'private_score','')::double precision,
    nullif(c->>'est_earn','')::numeric,nullif(c->>'actual_earn','')::numeric,
    nullif(c->>'public_rank','')::integer,nullif(c->>'private_rank','')::integer,
    nullif(c->>'status_override',''),legacy,
    coalesce(nullif(c->>'created_at','')::timestamptz,now()))
  ON CONFLICT (user_id,legacy_id) DO NOTHING;
  imported := imported + 1;
 END LOOP;
 RETURN imported;
END;
$$;
REVOKE ALL ON FUNCTION public.import_tracker(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.import_tracker(jsonb) TO authenticated;
-- Existing challenges RLS ownership policy, grants and indexes remain in place.
NOTIFY pgrst, 'reload schema';
COMMIT;
