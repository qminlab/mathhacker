-- Math Hacker · Supabase 스키마
-- Supabase 대시보드 > SQL Editor에 붙여넣어 한 번 실행하면 된다.
-- 앱 코드(src/)와 파이프라인(scripts/)이 쓰는 테이블·버킷·RLS 정책을 모두 만든다.

-- ─────────────────────────────────────────────
-- profiles: auth.users 1:1, 닉네임과 역할(user | admin)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nickname   text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- 회원가입 시 profiles row 자동 생성 (닉네임은 signUp의 user metadata에서)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, new.raw_user_meta_data ->> 'nickname');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 사용자가 자기 role을 admin으로 바꾸지 못하게 막는다
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

-- ─────────────────────────────────────────────
-- workbooks: 문제집(세트) 단위
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- problems: 문제 1개 = 1 row (OCR 텍스트, 잘라낸 이미지, 좌표)
-- ─────────────────────────────────────────────
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

create index if not exists problems_workbook_idx
  on public.problems (workbook_id, workbook_number);

-- ─────────────────────────────────────────────
-- attempts: 풀이 기록
-- ─────────────────────────────────────────────
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

create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);

-- ─────────────────────────────────────────────
-- ingest_sessions: 업로드된 PDF 1건 = 1 세션 (파이프라인 입력)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- RLS
-- service role(서버 API·파이프라인)은 RLS를 건너뛴다.
-- ─────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.workbooks       enable row level security;
alter table public.problems        enable row level security;
alter table public.attempts        enable row level security;
alter table public.ingest_sessions enable row level security;

-- profiles: 본인 것만 읽기·수정, admin은 전체 읽기
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (id = auth.uid() and role = 'user');

-- workbooks / problems: 로그인 사용자는 자기 문제집과 공용(owner 없음) 문제집을 읽기, admin은 전체
drop policy if exists "workbooks read" on public.workbooks;
create policy "workbooks read" on public.workbooks
  for select to authenticated
  using (owner_id is null or owner_id = auth.uid() or public.is_admin());

drop policy if exists "problems read" on public.problems;
create policy "problems read" on public.problems
  for select to authenticated
  using (
    exists (
      select 1 from public.workbooks w
      where w.id = problems.workbook_id
        and (w.owner_id is null or w.owner_id = auth.uid() or public.is_admin())
    )
  );

-- attempts: 본인 기록만
drop policy if exists "attempts own" on public.attempts;
create policy "attempts own" on public.attempts
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ingest_sessions: 본인 세션 읽기 (쓰기는 서버 API가 service role로)
drop policy if exists "ingest own read" on public.ingest_sessions;
create policy "ingest own read" on public.ingest_sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────
-- Storage 버킷
--   uploads  : 원본 PDF (비공개, 서버만 접근)
--   problems : 잘라낸 문제 이미지 (공개 읽기)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false), ('problems', 'problems', true)
on conflict (id) do nothing;

-- 첫 관리자 지정은 README의 "Supabase 준비" 3번을 참고 (가입 후 별도 쿼리로 실행)
