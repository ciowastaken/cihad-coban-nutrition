alter table public.profiles
add column if not exists membership_tier text not null default 'standard';

alter table public.profiles
drop constraint if exists profiles_membership_tier_check;

alter table public.profiles
add constraint profiles_membership_tier_check
check (membership_tier in ('standard', 'pro', 'clinic'));

create index if not exists profiles_membership_tier_idx
on public.profiles (membership_tier);
