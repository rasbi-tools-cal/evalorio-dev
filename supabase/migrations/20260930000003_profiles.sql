-- Profiles: one row per auth user. Users may edit only harmless columns; role / ban / trust
-- are changed exclusively by security-definer admin functions.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 60),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  locale text not null default 'en' check (locale in ('en', 'es', 'fr', 'it', 'pt')),
  role public.user_role not null default 'user',
  is_banned boolean not null default false,
  -- Set when moderation approves this user's first listing; trusted users publish instantly.
  is_trusted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Role helpers. SECURITY DEFINER so policies can call them without recursing into profiles RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and not is_banned);
$$;

create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_banned from public.profiles where id = (select auth.uid())), false);
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_banned() to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));

create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.profiles to authenticated;
-- Column-level: role, is_banned, is_trusted are NOT updatable by users.
grant update (display_name, phone, locale) on public.profiles to authenticated;

-- Safe public projection (owner name on listing pages). Runs with the view owner's rights on
-- purpose and exposes only these three columns.
create view public.public_profiles with (security_invoker = false) as
  select id, display_name, created_at from public.profiles where not is_banned;
grant select on public.public_profiles to anon, authenticated;

-- Create the profile when an auth user is created (email sign-up or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '');
  raw_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    case when char_length(raw_name) >= 2 then left(raw_name, 60) end,
    case when raw_locale in ('en', 'es', 'fr', 'it', 'pt') then raw_locale else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
