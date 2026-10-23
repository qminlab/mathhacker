-- Math Hacker · Supabase 스키마
--
-- Supabase 대시보드 > SQL Editor에 전체를 붙여넣고 Run 하면 된다.
-- 처음 설치와 업그레이드 모두 이 파일 하나로 한다. 여러 번 실행해도 안전하다
-- (테이블은 if not exists, 새 컬럼은 add column if not exists, 함수·정책은 다시 만든다).

-- ═════════════════════════════════════════════
-- 1. 사용자
-- ═════════════════════════════════════════════

-- profiles: auth.users 1:1, 닉네임과 역할(user | admin)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nickname   text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- user_settings: 풀이 설정
create table if not exists public.user_settings (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  daily_count          int  not null default 10 check (daily_count between 1 and 100),
  time_per_problem_sec int  not null default 300 check (time_per_problem_sec between 60 and 3600),
  grading_mode         text not null default 'instant' check (grading_mode in ('instant', 'batch')),
  stylus_only          boolean not null default false,
  updated_at           timestamptz not null default now()
);

-- 회원가입 시 profiles·user_settings row 자동 생성 (닉네임은 signUp의 user metadata에서)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, new.raw_user_meta_data ->> 'nickname')
  on conflict (id) do nothing;
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 스키마보다 먼저 가입한 사용자도 profile·settings를 갖게 한다
insert into public.profiles (id, nickname)
select id, raw_user_meta_data ->> 'nickname' from auth.users
on conflict (id) do nothing;
insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- 사용자가 자기 role을 admin으로 바꾸지 못하게 막는다 (SQL Editor에서는 바꿀 수 있음)
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role은 변경할 수 없습니다';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_change();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ═════════════════════════════════════════════
-- 2. 문제집·문제
-- ═════════════════════════════════════════════

create table if not exists public.workbooks (
  id             bigint generated always as identity primary key,
  title          text not null,
  unit           text,
  chapter        text,
  source_type    text not null default 'pdf',
  owner_id       uuid references auth.users (id) on delete set null,
  total_problems int,
  total_pages    int,
  created_at     timestamptz not null default now()
);

create table if not exists public.problems (
  id              uuid primary key default gen_random_uuid(),
  workbook_id     bigint references public.workbooks (id) on delete cascade,
  source          text,
  workbook_number int,
  page            int,
  source_page     int,
  source_column   int,
  header_text     text,
  raw_text        text,
  body_text       text,
  latex_body      text,
  score           int,
  unit            text,
  chapter_title   text,
  source_unit     text,
  page_width      int,
  page_height     int,
  col_x_min       int,
  col_x_max       int,
  y_min           int,
  y_max           int,
  full_image_url  text,
  has_diagram     boolean,
  answer          text,
  difficulty_tag  text,
  ability_tag     text,
  meta_tags       jsonb,
  ocr_json        jsonb,
  extra           jsonb,
  created_at      timestamptz not null default now()
);

-- 주인 계정이 지워지면 문제집도 지운다 (owner_id가 비면 '공용'이 되므로 set null이면 안 된다)
do $$
declare c text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = 'public.workbooks'::regclass and con.contype = 'f' and att.attname = 'owner_id'
  loop
    execute format('alter table public.workbooks drop constraint %I', c);
  end loop;
end $$;
alter table public.workbooks
  add constraint workbooks_owner_id_fkey foreign key (owner_id) references auth.users (id) on delete cascade;

-- v0.2: 비공개 이미지 경로, 정답 출처, 힌트
alter table public.problems add column if not exists image_path    text;
alter table public.problems add column if not exists answer_source text
  check (answer_source in ('ocr', 'manual'));
alter table public.problems add column if not exists hint          text;

-- v0.4: 코드로 만든 공용 문제 (학년별 문제집)
alter table public.workbooks add column if not exists grade text;
alter table public.workbooks drop constraint if exists workbooks_grade_check;
alter table public.workbooks add constraint workbooks_grade_check
  check (grade is null or grade in ('k','e1','e2','e3','e4','e5','e6','m1','m2','m3','h1','h2','h3'));
create index if not exists workbooks_public_grade_idx on public.workbooks (grade) where owner_id is null;
alter table public.problems drop constraint if exists problems_answer_source_check;
alter table public.problems add constraint problems_answer_source_check
  check (answer_source in ('ocr', 'manual', 'generated'));
alter table public.user_settings add column if not exists grade text;
alter table public.user_settings drop constraint if exists user_settings_grade_check;
alter table public.user_settings add constraint user_settings_grade_check
  check (grade is null or grade in ('k','e1','e2','e3','e4','e5','e6','m1','m2','m3','h1','h2','h3'));

create index if not exists problems_workbook_idx
  on public.problems (workbook_id, workbook_number);
create index if not exists problems_reading_order_idx
  on public.problems (workbook_id, page, source_column, y_min);

-- ═════════════════════════════════════════════
-- 3. 풀이
-- ═════════════════════════════════════════════

-- practice_sessions: 한 번에 푸는 문제 묶음 (데일리 / 순서대로 / 오답노트)
create table if not exists public.practice_sessions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  mode        text not null check (mode in ('daily', 'sequence', 'wrong')),
  workbook_id bigint references public.workbooks (id) on delete cascade,
  problem_ids uuid[] not null default '{}',
  day         date not null default (now() at time zone 'Asia/Seoul')::date,
  finished_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists practice_sessions_user_day_idx
  on public.practice_sessions (user_id, mode, day);

-- 동시에 두 번 만들어지지 않게 데일리 세트는 사용자·날짜마다 하나 (예전 중복은 최신 것만 남긴다)
delete from public.practice_sessions a
using public.practice_sessions b
where a.mode = 'daily' and b.mode = 'daily'
  and a.user_id = b.user_id and a.day = b.day and a.id < b.id;
create unique index if not exists practice_sessions_one_daily
  on public.practice_sessions (user_id, day) where mode = 'daily';

create table if not exists public.attempts (
  id             bigint generated always as identity primary key,
  problem_id     uuid not null references public.problems (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  user_answer    text not null,
  result         text not null default 'pending'
                 check (result in ('pending', 'correct', 'wrong', 'gave_up')),
  time_spent_sec int not null default 0,
  created_at     timestamptz not null default now()
);

-- v0.2: 힌트 사용, 필기, 세션
alter table public.attempts add column if not exists hint_used  boolean not null default false;
alter table public.attempts add column if not exists strokes    jsonb;
alter table public.attempts add column if not exists session_id bigint
  references public.practice_sessions (id) on delete set null;
alter table public.attempts alter column user_answer set default '';

create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);
create index if not exists attempts_user_problem_idx on public.attempts (user_id, problem_id, created_at desc);

-- ═════════════════════════════════════════════
-- 4. 업로드 처리 (문제지·답지 PDF)
-- ═════════════════════════════════════════════

create table if not exists public.ingest_sessions (
  id                 bigint generated always as identity primary key,
  user_id            uuid references auth.users (id) on delete set null,
  workbook_id        bigint references public.workbooks (id) on delete set null,
  source_type        text not null default 'pdf',
  title              text,
  unit               text,
  chapter            text,
  original_file_path text,
  file_count         int not null default 1,
  page_count         int not null default 0,
  status             text not null default 'uploaded'
                     check (status in ('uploaded', 'processing', 'done', 'failed')),
  created_at         timestamptz not null default now()
);

-- v0.2: 문제지/답지 구분, 진행률, 결과
alter table public.ingest_sessions add column if not exists kind text not null default 'problems'
  check (kind in ('problems', 'answers'));
alter table public.ingest_sessions add column if not exists processed_pages int not null default 0;
alter table public.ingest_sessions add column if not exists problem_count   int not null default 0;
alter table public.ingest_sessions add column if not exists error           text;
alter table public.ingest_sessions add column if not exists result          jsonb;
alter table public.ingest_sessions add column if not exists updated_at      timestamptz not null default now();
-- 답지는 페이지별 OCR 텍스트를 모아 두고 마지막에 한꺼번에 정답을 뽑는다 (중간에 끊겨도 이어서)
alter table public.ingest_sessions add column if not exists page_texts      jsonb not null default '[]'::jsonb;

-- ═════════════════════════════════════════════
-- 5. RLS
-- 서버 API(service role)는 RLS를 건너뛴다. 앱은 사용자 토큰으로 읽는다.
-- ═════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.user_settings     enable row level security;
alter table public.workbooks         enable row level security;
alter table public.problems          enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.attempts          enable row level security;
alter table public.ingest_sessions   enable row level security;

-- 문제집을 볼 수 있는가: 내 것, 공용(owner 없음), 또는 관리자
create or replace function public.can_view_workbook(p_workbook_id bigint)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workbooks w
    where w.id = p_workbook_id
      and (w.owner_id is null or w.owner_id = auth.uid() or public.is_admin())
  );
$$;

-- 오늘의 세트에 들어갈 수 있는 문제집: 내 것, 학년 없는 공용, 내가 고른 학년의 공용
create or replace function public.in_my_pool(p_workbook_id bigint)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workbooks w
    where w.id = p_workbook_id
      and (
        w.owner_id = auth.uid()
        or (w.owner_id is null and (
          w.grade is null
          or w.grade = (select s.grade from public.user_settings s where s.user_id = auth.uid())
        ))
      )
  );
$$;

create or replace function public.owns_workbook(p_workbook_id bigint)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workbooks w
    where w.id = p_workbook_id and (w.owner_id = auth.uid() or public.is_admin())
  );
$$;

-- profiles
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (id = auth.uid() and role = 'user');

-- user_settings
drop policy if exists "settings own" on public.user_settings;
create policy "settings own" on public.user_settings
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workbooks: 읽기는 볼 수 있는 것, 이름 수정·삭제는 내 것만 (생성은 서버가)
drop policy if exists "workbooks read" on public.workbooks;
create policy "workbooks read" on public.workbooks
  for select to authenticated
  using (owner_id is null or owner_id = auth.uid() or public.is_admin());

drop policy if exists "workbooks owner update" on public.workbooks;
create policy "workbooks owner update" on public.workbooks
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "workbooks owner delete" on public.workbooks;
create policy "workbooks owner delete" on public.workbooks
  for delete to authenticated
  using (owner_id = auth.uid());

-- problems: 읽기는 볼 수 있는 문제집, 수정(정답·힌트)은 내 문제집만
drop policy if exists "problems read" on public.problems;
create policy "problems read" on public.problems
  for select to authenticated
  using (public.can_view_workbook(workbook_id));

drop policy if exists "problems owner update" on public.problems;
create policy "problems owner update" on public.problems
  for update to authenticated
  using (public.owns_workbook(workbook_id)) with check (public.owns_workbook(workbook_id));

-- practice_sessions / attempts: 본인 것만
drop policy if exists "sessions own" on public.practice_sessions;
create policy "sessions own" on public.practice_sessions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 채점 결과를 사용자가 직접 쓰지 못하게, attempts 쓰기는 서버 API만 한다
drop policy if exists "attempts own" on public.attempts;
drop policy if exists "attempts own read" on public.attempts;
create policy "attempts own read" on public.attempts
  for select to authenticated
  using (user_id = auth.uid());

-- ingest_sessions: 본인 세션 읽기 (쓰기는 서버)
drop policy if exists "ingest own read" on public.ingest_sessions;
create policy "ingest own read" on public.ingest_sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ═════════════════════════════════════════════
-- 6. 출제·통계 함수 (호출한 사용자 권한으로 실행)
-- ═════════════════════════════════════════════

-- 내가 마지막으로 푼 결과 (문제별 최신 시도)
create or replace view public.my_latest_attempts
with (security_invoker = true) as
select distinct on (a.problem_id)
  a.problem_id, a.result, a.user_answer, a.created_at
from public.attempts a
where a.user_id = auth.uid()
order by a.problem_id, a.created_at desc;

-- 오늘의 데일리 세트: 오늘 세션이 있으면 그대로, 없으면 안 푼 문제 중 설정 개수만큼 뽑아 만든다
create or replace function public.start_daily()
returns public.practice_sessions
language plpgsql
security invoker set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_count int;
  v_ids uuid[];
  v_exists boolean;
  v_session public.practice_sessions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_session from practice_sessions
  where user_id = auth.uid() and mode = 'daily' and day = v_today;
  v_exists := found;
  if v_exists and cardinality(v_session.problem_ids) > 0 then
    return v_session;
  end if;

  select coalesce((select daily_count from user_settings where user_id = auth.uid()), 10)
  into v_count;

  select coalesce(array_agg(id), '{}') into v_ids
  from (
    select p.id
    from problems p
    where public.in_my_pool(p.workbook_id)
      and p.image_path is not null
      and not exists (
        select 1 from attempts a where a.problem_id = p.id and a.user_id = auth.uid()
      )
    order by random()
    limit v_count
  ) picked;

  if v_exists then
    -- 오늘 세트가 비어 있었으면(그때는 문제가 없었으면) 새로 뽑은 문제로 채운다
    update practice_sessions set problem_ids = v_ids
    where id = v_session.id and cardinality(problem_ids) = 0
    returning * into v_session;
    if not found then
      select * into v_session from practice_sessions where id = v_session.id;
    end if;
    return v_session;
  end if;

  insert into practice_sessions (user_id, mode, problem_ids, day)
  values (auth.uid(), 'daily', v_ids, v_today)
  on conflict (user_id, day) where mode = 'daily' do nothing
  returning * into v_session;

  -- 같은 순간에 다른 요청이 먼저 만들었으면 그것을 쓴다
  if not found then
    select * into v_session from practice_sessions
    where user_id = auth.uid() and mode = 'daily' and day = v_today;
  end if;
  return v_session;
end;
$$;

-- 순서대로 / 오답노트 문제 목록
create or replace function public.practice_problems(
  p_mode text,
  p_workbook_id bigint default null,
  p_limit int default 20
)
returns setof public.problems
language sql
stable
security invoker set search_path = public
as $$
  select p.*
  from problems p
  left join my_latest_attempts la on la.problem_id = p.id
  where public.can_view_workbook(p.workbook_id)
    and p.image_path is not null
    and (p_workbook_id is null or p.workbook_id = p_workbook_id)
    and case p_mode
      when 'sequence' then la.problem_id is null
      when 'wrong'    then la.result in ('wrong', 'gave_up')
      else false
    end
  order by
    case when p_mode = 'wrong' then la.created_at end desc nulls last,
    p.workbook_id, p.page, p.source_column, p.y_min, p.workbook_number
  limit greatest(1, least(p_limit, 100));
$$;

-- 게임 요소: 연속 학습, XP, 뱃지 계산에 쓰는 숫자들
-- XP 규칙 (앱 src/lib/progress.ts와 같게): 맞힘 10 + 힌트 없이 맞히면 5, 틀림 2, 포기 0
create or replace function public.my_progress()
returns jsonb
language sql
stable
security invoker set search_path = public
as $$
  with mine as (
    select a.*, (a.created_at at time zone 'Asia/Seoul')::date as day
    from attempts a
    where a.user_id = auth.uid() and a.result <> 'pending'
  ),
  days as (select distinct day from mine),
  today as (select (now() at time zone 'Asia/Seoul')::date as d),
  -- 연속 일수: 날짜에서 순번을 빼면 이어진 날들은 같은 값이 된다
  runs as (
    select day, day - (row_number() over (order by day))::int as grp from days
  ),
  streaks as (
    select grp, min(day) as first_day, max(day) as last_day, count(*)::int as len from runs group by grp
  ),
  per_session as (
    select session_id, count(*) as n, count(*) filter (where result = 'correct') as c
    from mine where session_id is not null group by session_id
  ),
  comebacks as (
    -- 틀렸던 문제를 나중에 맞힌 횟수
    select count(distinct w.problem_id)::int as n
    from mine w
    join mine r on r.problem_id = w.problem_id and r.result = 'correct' and r.created_at > w.created_at
    where w.result in ('wrong', 'gave_up')
  )
  select jsonb_build_object(
    'xp', coalesce((select sum(case result
                         when 'correct' then 10 + case when hint_used then 0 else 5 end
                         when 'wrong' then 2 else 0 end) from mine), 0),
    'solved', (select count(*) from mine),
    'correct', (select count(*) from mine where result = 'correct'),
    'streak', coalesce((
      select len from streaks, today
      where last_day >= today.d - 1 order by last_day desc limit 1
    ), 0),
    'best_streak', coalesce((select max(len) from streaks), 0),
    'active_today', exists (select 1 from days, today where day = today.d),
    'today_solved', (select count(*) from mine, today where day = today.d),
    'week', (
      select jsonb_agg(jsonb_build_object('day', g.dd::date, 'active', exists (select 1 from days where day = g.dd::date)) order by g.dd)
      from today, generate_series(today.d - 6, today.d, interval '1 day') as g(dd)
    ),
    'perfect_sets', (select count(*) from per_session where n >= 3 and n = c),
    'comebacks', (select n from comebacks),
    'no_hint_correct', (select count(*) from mine where result = 'correct' and not hint_used),
    'days_active', (select count(*) from days)
  );
$$;

-- 문제집 목록 + 내 진행 상황
drop function if exists public.my_workbooks();
create or replace function public.my_workbooks()
returns table (
  id bigint, title text, unit text, chapter text, is_mine boolean, created_at timestamptz,
  total int, with_answer int, solved int, correct int, wrong int, grade text
)
language sql
stable
security invoker set search_path = public
as $$
  select w.id, w.title, w.unit, w.chapter, coalesce(w.owner_id = auth.uid(), false) as is_mine, w.created_at,
         count(p.id)::int,
         count(p.id) filter (where p.answer is not null)::int,
         count(la.problem_id)::int,
         count(la.problem_id) filter (where la.result = 'correct')::int,
         count(la.problem_id) filter (where la.result in ('wrong', 'gave_up'))::int,
         w.grade
  from workbooks w
  left join problems p on p.workbook_id = w.id
  left join my_latest_attempts la on la.problem_id = p.id
  where w.owner_id is null or w.owner_id = auth.uid() or public.is_admin()
  group by w.id
  order by coalesce(w.owner_id = auth.uid(), false) desc, w.created_at desc, w.id;
$$;

-- 문제집 안 문제 + 내 마지막 결과 (읽는 순서대로)
create or replace function public.workbook_problems(p_workbook_id bigint)
returns table (
  id uuid, workbook_id bigint, workbook_number int, page int, score int, unit text,
  raw_text text, image_path text, answer text, answer_source text, hint text, last_result text
)
language sql
stable
security invoker set search_path = public
as $$
  select p.id, p.workbook_id, p.workbook_number, p.page, p.score, p.unit,
         p.raw_text, p.image_path, p.answer, p.answer_source, p.hint, la.result
  from problems p
  left join my_latest_attempts la on la.problem_id = p.id
  where p.workbook_id = p_workbook_id and public.can_view_workbook(p_workbook_id)
  order by p.page, p.source_column, p.y_min, p.workbook_number;
$$;

-- 통계: 최근 p_days일 일별 정답률, 단원별 정답률, 합계
create or replace function public.my_stats(p_days int default 14)
returns jsonb
language sql
stable
security invoker set search_path = public
as $$
  with mine as (
    select a.*, (a.created_at at time zone 'Asia/Seoul')::date as day,
           coalesce(nullif(p.unit, ''), w.unit, '미분류') as unit_name
    from attempts a
    join problems p on p.id = a.problem_id
    left join workbooks w on w.id = p.workbook_id
    where a.user_id = auth.uid() and a.result <> 'pending'
  ),
  days as (
    select generate_series(
      (now() at time zone 'Asia/Seoul')::date - (greatest(p_days, 1) - 1),
      (now() at time zone 'Asia/Seoul')::date,
      interval '1 day'
    )::date as day
  )
  select jsonb_build_object(
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d.day,
        'total', coalesce(s.total, 0),
        'correct', coalesce(s.correct, 0)
      ) order by d.day), '[]'::jsonb)
      from days d
      left join (
        select day, count(*) as total, count(*) filter (where result = 'correct') as correct
        from mine group by day
      ) s on s.day = d.day
    ),
    'by_unit', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'unit', unit_name, 'total', total, 'correct', correct
      ) order by (correct::float / nullif(total, 0)) asc nulls last, total desc), '[]'::jsonb)
      from (
        select unit_name, count(*) as total, count(*) filter (where result = 'correct') as correct
        from mine group by unit_name
      ) u
    ),
    'totals', (
      select jsonb_build_object(
        'total', count(*),
        'correct', count(*) filter (where result = 'correct'),
        'wrong', count(*) filter (where result in ('wrong', 'gave_up')),
        'time_sec', coalesce(sum(time_spent_sec), 0)
      ) from mine
    )
  );
$$;

-- ═════════════════════════════════════════════
-- 7. Storage
--   uploads  : 원본 PDF (비공개, 서버만 접근)
--   problems : 잘라낸 문제 이미지 (비공개, 경로 첫 폴더 = 주인 id 또는 shared)
-- ═════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uploads', 'uploads', false, 52428800, array['application/pdf']),
  ('problems', 'problems', false, 5242880, array['image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "problem images read" on storage.objects;
create policy "problem images read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'problems'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = 'shared'
      or public.is_admin()
    )
  );

-- 첫 관리자 지정은 README의 "관리자 지정"을 참고 (가입 후 별도 쿼리로 실행)
