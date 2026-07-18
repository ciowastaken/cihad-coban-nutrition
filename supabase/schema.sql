create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  age integer,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  target_weight_kg numeric,
  goal text,
  activity_level text,
  dietary_preference text,
  allergies text,
  disliked_foods text,
  meal_routine text,
  skipped_meals text[] not null default '{}',
  budget text,
  cooking_time text,
  nutrition_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  target_calories integer not null,
  meals jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_on date not null default current_date,
  meal_type text not null,
  status text not null default 'eaten' check (status in ('eaten','skipped')),
  food_name text,
  portion text,
  calories integer not null default 0,
  protein_grams numeric not null default 0,
  carbohydrate_grams numeric not null default 0,
  fat_grams numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric not null,
  recorded_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.diet_plans enable row level security;
alter table public.meal_entries enable row level security;
alter table public.weight_entries enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "profile_select" on public.profiles for select to authenticated using (auth.uid() = id or public.is_admin());
create policy "profile_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profile_update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "plans_select" on public.diet_plans for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "plans_insert" on public.diet_plans for insert to authenticated with check (auth.uid() = user_id);
create policy "plans_update" on public.diet_plans for update to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "plans_delete" on public.diet_plans for delete to authenticated using (auth.uid() = user_id or public.is_admin());

create policy "meals_all" on public.meal_entries for all to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);
create policy "weights_all" on public.weight_entries for all to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- İlk admini oluşturduktan sonra kendi kullanıcı UUID'n ile bir kez çalıştır:
-- update public.profiles set role = 'admin' where id = 'KULLANICI_UUID';

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  service_type text not null,
  appointment_date date not null,
  appointment_time time not null,
  note text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists appointments_active_slot_unique
on public.appointments (appointment_date, appointment_time)
where status in ('pending','confirmed');

alter table public.appointments enable row level security;

drop policy if exists "appointments_own_select" on public.appointments;
drop policy if exists "appointments_admin_all" on public.appointments;
create policy "appointments_own_select"
on public.appointments for select to authenticated
using (auth.uid() = user_id or public.is_admin());
create policy "appointments_admin_all"
on public.appointments for all to authenticated
using (public.is_admin())
with check (public.is_admin());
