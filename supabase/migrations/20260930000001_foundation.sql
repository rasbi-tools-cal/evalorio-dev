-- Evalorio marketplace: extensions, enums, shared helpers.
-- Security baseline: nothing in `public` is reachable by `anon`/`authenticated` unless a later
-- migration grants it explicitly. RLS is enabled on every table.

create extension if not exists postgis with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Stop Supabase's default "grant everything to anon/authenticated" on objects created later in
-- this schema by postgres. Every grant below is deliberate.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

create type public.user_role as enum ('user', 'agency', 'admin');

create type public.listing_status as enum (
  'draft',     -- being written by the owner, never public
  'pending',   -- submitted, waiting for moderation
  'active',    -- public
  'paused',    -- hidden by the owner, can be re-activated
  'closed',    -- sold / rented, hidden
  'rejected',  -- refused by moderation, owner can edit and resubmit
  'expired',   -- past expires_at, owner can renew
  'removed'    -- taken down by an admin (e.g. banned owner), final
);

create type public.listing_operation as enum ('sale', 'rent');

create type public.property_type as enum (
  'apartment', 'penthouse', 'duplex', 'studio',
  'house', 'villa', 'country_house',
  'room', 'land', 'commercial', 'office', 'garage'
);

create type public.report_reason as enum (
  'scam', 'wrong_info', 'already_sold', 'duplicate', 'offensive', 'agency_posing_as_owner', 'other'
);

create type public.report_status as enum ('open', 'resolved', 'dismissed');

create type public.alert_frequency as enum ('instant', 'daily', 'weekly');

-- Shared trigger: keep updated_at honest.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- unaccent() is only STABLE; this wrapper pins the dictionary so it can be used in indexes.
create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value);
$$;
grant execute on function public.f_unaccent(text) to anon, authenticated;

-- URL slug: lowercase ascii, words joined by "-".
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(public.f_unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;
grant execute on function public.slugify(text) to anon, authenticated;
