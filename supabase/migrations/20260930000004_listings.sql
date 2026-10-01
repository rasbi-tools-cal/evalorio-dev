-- Listings, their private data (exact address / phone) and photos.

create table public.listings (
  id bigint generated always as identity (start with 100001) primary key,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.listing_status not null default 'draft',
  operation public.listing_operation not null,
  property_type public.property_type not null,
  title text check (title is null or char_length(title) between 5 and 120),
  description text check (description is null or char_length(description) <= 5000),
  price integer check (price is null or price between 1 and 100000000),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  area_m2 integer check (area_m2 is null or area_m2 between 1 and 100000),
  bedrooms smallint check (bedrooms is null or bedrooms between 0 and 50),
  bathrooms smallint check (bathrooms is null or bathrooms between 0 and 50),
  floor smallint check (floor is null or floor between -5 and 200),
  year_built smallint check (year_built is null or year_built between 1500 and 2100),
  energy_rating text check (energy_rating is null or energy_rating in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'exempt', 'pending')),
  features text[] not null default '{}' check (
    features <@ array['elevator', 'parking', 'terrace', 'balcony', 'garden', 'pool', 'air_conditioning',
                      'heating', 'furnished', 'storage_room', 'built_in_wardrobes', 'accessible',
                      'pets_allowed', 'sea_view', 'doorman']::text[]
  ),
  country_code char(2) references public.countries (code),
  city_id bigint references public.cities (id),
  neighborhood_id bigint references public.neighborhoods (id),
  -- Public, approximate position (≈80–200 m from the real one unless the owner opts in).
  -- Written only by the listing_private trigger.
  location extensions.geography(point, 4326),
  rejection_reason text,
  published_at timestamptz,
  expires_at timestamptz,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  -- Anything outside draft must be complete.
  constraint listings_complete check (
    status = 'draft'
    or (price is not null and area_m2 is not null and country_code is not null
        and city_id is not null and location is not null)
  )
);

create index listings_owner_idx on public.listings (owner_id, created_at desc);
create index listings_search_idx on public.listings (country_code, city_id, operation, status, price);
create index listings_active_published_idx on public.listings (published_at desc) where status = 'active';
create index listings_location_idx on public.listings using gist (location);
create index listings_search_vector_idx on public.listings using gin (search_vector);
create index listings_features_idx on public.listings using gin (features);

create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create table public.listing_private (
  listing_id bigint primary key references public.listings (id) on delete cascade,
  address text check (address is null or char_length(address) <= 200),
  location_exact extensions.geography(point, 4326) not null,
  show_exact_location boolean not null default false,
  contact_name text check (contact_name is null or char_length(contact_name) between 2 and 60),
  contact_phone text check (contact_phone is null or contact_phone ~ '^\+?[0-9 ()-]{6,20}$'),
  show_phone boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger listing_private_updated_at before update on public.listing_private
  for each row execute function public.set_updated_at();

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id bigint not null references public.listings (id) on delete cascade,
  storage_path text not null unique,
  position smallint not null default 0 check (position between 0 and 19),
  width integer check (width is null or width between 1 and 10000),
  height integer check (height is null or height between 1 and 10000),
  created_at timestamptz not null default now()
);

create index listing_photos_listing_idx on public.listing_photos (listing_id, position);

---------------------------------------------------------------------------------------------------
-- Integrity / anti-abuse triggers
---------------------------------------------------------------------------------------------------

-- Deterministic offset so the public pin never reveals the exact door, and does not jitter
-- between saves.
create or replace function public.fuzz_location(exact extensions.geography, seed text)
returns extensions.geography
language sql
immutable
set search_path = ''
as $$
  select extensions.st_project(
    exact,
    80 + (('x' || substr(md5(seed), 1, 6))::bit(24)::int % 121),
    radians((('x' || substr(md5(seed), 7, 6))::bit(24)::int % 360))
  )::extensions.geography;
$$;

-- True when the current request comes from a privileged context (SQL editor, service role,
-- or one of our admin functions which set evalorio.bypass_guard for the transaction).
create or replace function public.is_privileged_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.role(), '') not in ('anon', 'authenticated')
      or coalesce(current_setting('evalorio.bypass_guard', true), '') = 'on';
$$;

create or replace function public.listings_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_trusted boolean;
  photo_count int;
begin
  if public.is_privileged_context() then
    if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
      new.published_at := coalesce(new.published_at, now());
      new.expires_at := now() + interval '90 days';
      new.rejection_reason := null;
    end if;
    return new;
  end if;

  if public.is_banned() then
    raise exception 'account suspended' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'new listings start as draft' using errcode = '42501';
    end if;
    new.published_at := null;
    new.expires_at := null;
    new.views_count := 0;
    new.rejection_reason := null;
    new.location := null;
    return new;
  end if;

  -- UPDATE by the owner.
  if new.status is distinct from old.status then
    if not (
      (old.status in ('draft', 'rejected', 'expired', 'closed') and new.status = 'pending')
      or (old.status = 'pending' and new.status = 'draft')
      or (old.status = 'active' and new.status in ('paused', 'closed'))
      or (old.status = 'paused' and new.status in ('active', 'closed'))
    ) then
      raise exception 'status change % -> % not allowed', old.status, new.status using errcode = '42501';
    end if;

    if old.status = 'paused' and new.status = 'active' and old.expires_at is not null and old.expires_at < now() then
      raise exception 'listing expired, renew it instead' using errcode = '42501';
    end if;
  end if;

  select is_trusted into owner_trusted from public.profiles where id = old.owner_id;

  -- Submitting: needs at least one photo; trusted owners skip the queue.
  if new.status = 'pending' and old.status <> 'pending' then
    select count(*) into photo_count from public.listing_photos where listing_id = new.id;
    if photo_count = 0 then
      raise exception 'add at least one photo before publishing' using errcode = '23514';
    end if;
    if owner_trusted then
      new.status := 'active';
      new.published_at := coalesce(old.published_at, now());
      new.expires_at := now() + interval '90 days';
    end if;
    new.rejection_reason := null;
  end if;

  -- Untrusted owners rewriting the text of a live listing go back through moderation
  -- (stops "approve something innocent, then swap in a scam").
  if old.status = 'active' and new.status = 'active' and not owner_trusted
     and (new.title is distinct from old.title or new.description is distinct from old.description) then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

create trigger listings_guard before insert or update on public.listings
  for each row execute function public.listings_guard();

-- Private data drives the public (fuzzed) location and must sit near the chosen city.
create or replace function public.listing_private_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_city bigint;
  city_location extensions.geography;
begin
  select city_id into listing_city from public.listings where id = new.listing_id;
  if listing_city is null then
    raise exception 'choose a city first' using errcode = '23514';
  end if;
  select location into city_location from public.cities where id = listing_city;
  if extensions.st_distance(city_location, new.location_exact) > 60000 then
    raise exception 'location is too far from the selected city' using errcode = '23514';
  end if;

  perform set_config('evalorio.bypass_guard', 'on', true);
  update public.listings
     set location = case when new.show_exact_location then new.location_exact
                         else public.fuzz_location(new.location_exact, new.listing_id::text) end
   where id = new.listing_id;
  perform set_config('evalorio.bypass_guard', '', true);
  return new;
end;
$$;

create trigger listing_private_sync after insert or update on public.listing_private
  for each row execute function public.listing_private_sync();

-- Photos: max 20 per listing, stored under "<owner id>/<listing id>/".
create or replace function public.listing_photos_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_owner uuid;
begin
  select owner_id into listing_owner from public.listings where id = new.listing_id;
  if new.storage_path not like listing_owner::text || '/' || new.listing_id::text || '/%' then
    raise exception 'invalid photo path' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    perform 1 from public.listings where id = new.listing_id for update;
    if (select count(*) from public.listing_photos where listing_id = new.listing_id) >= 20 then
      raise exception 'a listing can have at most 20 photos' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger listing_photos_guard before insert or update on public.listing_photos
  for each row execute function public.listing_photos_guard();

---------------------------------------------------------------------------------------------------
-- RLS + grants
---------------------------------------------------------------------------------------------------

alter table public.listings enable row level security;
alter table public.listing_private enable row level security;
alter table public.listing_photos enable row level security;

create policy "active listings are public" on public.listings
  for select to anon, authenticated using (status = 'active');
create policy "owners see their listings" on public.listings
  for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "owners create listings" on public.listings
  for insert to authenticated with check (owner_id = (select auth.uid()) and not (select public.is_banned()));
create policy "owners update listings" on public.listings
  for update to authenticated
  using (owner_id = (select auth.uid()) and status <> 'removed')
  with check (owner_id = (select auth.uid()));
create policy "owners delete listings" on public.listings
  for delete to authenticated using (owner_id = (select auth.uid()));

grant select on public.listings to anon, authenticated;
grant insert (operation, property_type, title, description, price, area_m2, bedrooms, bathrooms, floor,
              year_built, energy_rating, features, country_code, city_id, neighborhood_id)
  on public.listings to authenticated;
grant update (status, operation, property_type, title, description, price, area_m2, bedrooms, bathrooms,
              floor, year_built, energy_rating, features, country_code, city_id, neighborhood_id)
  on public.listings to authenticated;
grant delete on public.listings to authenticated;

create policy "owners manage private data" on public.listing_private
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "admins read private data" on public.listing_private
  for select to authenticated using ((select public.is_admin()));

grant select, delete on public.listing_private to authenticated;
grant insert (listing_id, address, location_exact, show_exact_location, contact_name, contact_phone, show_phone),
      update (address, location_exact, show_exact_location, contact_name, contact_phone, show_phone)
  on public.listing_private to authenticated;

create policy "photos follow listing visibility" on public.listing_photos
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "owners add photos" on public.listing_photos
  for insert to authenticated
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
              and not (select public.is_banned()));
create policy "owners reorder photos" on public.listing_photos
  for update to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
create policy "owners delete photos" on public.listing_photos
  for delete to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

grant select on public.listing_photos to anon, authenticated;
grant insert (listing_id, storage_path, position, width, height) on public.listing_photos to authenticated;
grant update (position) on public.listing_photos to authenticated;
grant delete on public.listing_photos to authenticated;
