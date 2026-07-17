-- Life app database schema
-- Run this in the Supabase SQL editor (or via supabase db push) once per project.

-- ============================================================
-- To-dos module
-- ============================================================
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 500),
  completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_id_idx on public.todos (user_id);

alter table public.todos enable row level security;

create policy "Users can view their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Future modules (medications, goals, ...) get their own tables
-- here, always with the same RLS pattern: rows owned by user_id,
-- policies scoped to auth.uid().
-- ============================================================
