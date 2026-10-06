-- Apply once in Supabase SQL Editor or with supabase db push.
create table public.challenges (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 160),
 type text not null default 'Classification',
 tags text[] not null default '{}',
 metric text not null default 'AUC',
 direction text not null default 'desc' check (direction in ('asc','desc')),
 baseline double precision,
 est_earn numeric check (est_earn >= 0),
 actual_earn numeric check (actual_earn >= 0),
 public_rank integer check (public_rank > 0),
 private_rank integer check (private_rank > 0),
 status_override text check (status_override is null or status_override = 'Top leaderboard'),
 legacy_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id, legacy_id)
);
create unique index challenges_user_name on public.challenges(user_id, lower(name));
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 challenge_id uuid not null references public.challenges(id) on delete cascade,
 version text not null check (length(trim(version)) between 1 and 160),
 score double precision not null,
 status text not null default 'Pending review' check (status in ('Approved','Pending review','Rejected')),
 legacy_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(challenge_id, legacy_id)
);
create unique index submissions_challenge_version on public.submissions(challenge_id, lower(version));
create index challenges_owner on public.challenges(user_id);
create index submissions_parent on public.submissions(challenge_id);
create function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger challenges_updated before update on public.challenges for each row execute function public.set_updated_at();
create trigger submissions_updated before update on public.submissions for each row execute function public.set_updated_at();
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
create policy own_challenges on public.challenges for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_submissions on public.submissions for all to authenticated
 using (exists(select 1 from public.challenges c where c.id = challenge_id and c.user_id = (select auth.uid())))
 with check (exists(select 1 from public.challenges c where c.id = challenge_id and c.user_id = (select auth.uid())));
revoke all on public.challenges, public.submissions from anon;
grant select, insert, update, delete on public.challenges, public.submissions to authenticated;

-- Transactional, retry-safe import of the previous browser JSON shape.
-- Security invoker: all writes are checked by the same RLS policies.
create function public.import_legacy_tracker(payload jsonb) returns integer
 language plpgsql security invoker set search_path = public as $$
declare c jsonb; s jsonb; cid uuid; legacy text; imported integer := 0;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(payload->'challenges') is distinct from 'array' then raise exception 'Invalid challenges array'; end if;
 for c in select value from jsonb_array_elements(payload->'challenges') loop
  legacy := coalesce(nullif(c->>'legacy_id',''), nullif(c->>'id',''), md5(c->>'name'));
  select id into cid from public.challenges where user_id = auth.uid() and legacy_id = legacy;
  if cid is null then
   insert into public.challenges(user_id,name,type,tags,metric,direction,baseline,est_earn,actual_earn,public_rank,private_rank,status_override,legacy_id)
   values(auth.uid(),trim(c->>'name'),coalesce(c->>'type','Classification'),
    array(select jsonb_array_elements_text(coalesce(c->'tags','[]'::jsonb))),
    coalesce(c->>'metric','AUC'),coalesce(c->>'direction','desc'),nullif(c->>'baseline','')::double precision,
    nullif(coalesce(c->>'estEarn',c->>'est_earn'),'')::numeric,nullif(coalesce(c->>'actualEarn',c->>'actual_earn'),'')::numeric,
    nullif(coalesce(c->>'publicRank',c->>'public_rank'),'')::integer,nullif(coalesce(c->>'privateRank',c->>'private_rank'),'')::integer,
    case when coalesce(c->>'statusOverride',c->>'status_override')='Top leaderboard' then 'Top leaderboard' end,legacy)
   returning id into cid;
  end if;
  for s in select value from jsonb_array_elements(coalesce(c->'submissions','[]'::jsonb)) loop
   insert into public.submissions(challenge_id,version,score,status,legacy_id)
   values(cid,trim(s->>'version'),(s->>'score')::double precision,
    case when s->>'status' in ('Approved','Pending review','Rejected') then s->>'status' else 'Pending review' end,
    coalesce(nullif(s->>'legacy_id',''),nullif(s->>'id',''),md5(s->>'version')))
   on conflict(challenge_id,legacy_id) do nothing;
  end loop;
  imported := imported + 1;
 end loop;
 return imported;
end;
$$;
revoke all on function public.import_legacy_tracker(jsonb) from public, anon;
grant execute on function public.import_legacy_tracker(jsonb) to authenticated;
