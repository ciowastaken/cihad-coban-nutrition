create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  href text,
  kind text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_new_diet_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, href, kind)
  values (
    new.user_id,
    'Yeni beslenme programın hazır',
    coalesce(new.title, 'Diyetisyenin tarafından yeni bir program hesabına eklendi.'),
    '/plans',
    'plan'
  );
  return new;
end;
$$;

drop trigger if exists diet_plan_notification_trigger on public.diet_plans;
create trigger diet_plan_notification_trigger
after insert on public.diet_plans
for each row execute function public.notify_new_diet_plan();
