-- Run after supabase/challenge_results.sql, before deploying the compact UI.
BEGIN;
-- Normalize previously entered labels; leave unknown/missing difficulty empty.
UPDATE public.challenges SET difficulty = CASE lower(trim(difficulty))
 WHEN 'easy' THEN 'Easy' WHEN 'medium' THEN 'Medium' WHEN 'hard' THEN 'Hard' ELSE NULL END;
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_difficulty_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_difficulty_check
 CHECK (difficulty IS NULL OR difficulty IN ('Easy','Medium','Hard'));

-- Freeze the previous automatic result into a stored choice where calculable.
-- Existing manual choices remain unchanged; missing information stays NULL.
UPDATE public.challenges SET status_override = CASE
 WHEN private_rank BETWEEN 1 AND 3 THEN 'Top leaderboard'
 WHEN direction IS NULL THEN NULL
 WHEN private_score IS NOT NULL AND private_baseline IS NOT NULL THEN
  CASE WHEN (direction = 'asc' AND private_score < private_baseline)
         OR (direction = 'desc' AND private_score > private_baseline) THEN 'Pass' ELSE 'Fail' END
 WHEN public_score IS NOT NULL AND public_baseline IS NOT NULL THEN
  CASE WHEN (direction = 'asc' AND public_score < public_baseline)
         OR (direction = 'desc' AND public_score > public_baseline) THEN 'Pass' ELSE 'Fail' END
 ELSE NULL END
WHERE status_override IS NULL;
NOTIFY pgrst, 'reload schema';
COMMIT;
