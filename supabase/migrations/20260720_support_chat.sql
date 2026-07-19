create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'open' check (status in ('open','closed')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user','admin')),
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_threads_updated_idx on public.support_threads(updated_at desc);
create index if not exists support_messages_thread_idx on public.support_messages(thread_id, created_at);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

create policy "users see own support thread" on public.support_threads
for select using (auth.uid() = user_id);

create policy "users see own support messages" on public.support_messages
for select using (exists (select 1 from public.support_threads t where t.id = thread_id and t.user_id = auth.uid()));

alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.support_threads;