alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('user', 'yetkili', 'admin'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'yetkili')
  )
$$;
