-- Richer result cards: exterior/interior, price history ("price drop" badge), seller type, phone flag.

-- Exterior (faces the street / open space) vs interior (faces a courtyard). NULL = not specified.
alter table public.listings add column exterior boolean;
grant insert (exterior), update (exterior) on public.listings to authenticated;

-- Price history: every change is recorded; previous_price keeps the last higher price so cards can
-- show "Price drop -€X". Owners cannot write either column directly.
alter table public.listings add column previous_price integer check (previous_price is null or previous_price > 0);

create table public.listing_price_history (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  old_price integer,
  new_price integer not null,
  changed_at timestamptz not null default now()
);
create index listing_price_history_listing_idx on public.listing_price_history (listing_id, changed_at desc);

alter table public.listing_price_history enable row level security;
create policy "owners and admins read price history" on public.listing_price_history
  for select to authenticated
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
    or (select public.is_admin())
  );
grant select on public.listing_price_history to authenticated;

create or replace function public.listings_price_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.price is distinct from old.price and old.price is not null and new.price is not null then
    -- A drop only counts once the listing has been public (drafts are still being typed).
    if new.price < old.price and old.published_at is not null then
      new.previous_price := greatest(old.price, coalesce(old.previous_price, 0));
    elsif new.price >= coalesce(old.previous_price, 0) then
      new.previous_price := null;
    end if;
    insert into public.listing_price_history (listing_id, old_price, new_price) values (new.id, old.price, new.price);
  end if;
  return new;
end;
$$;

create trigger listings_price_change before update of price on public.listings
  for each row execute function public.listings_price_change();

-- Seller type for the "Private owner" / "Agency" badge (never exposes the internal admin role).
create or replace view public.public_profiles with (security_invoker = false) as
  select id, display_name, created_at,
         case when role = 'agency' then 'agency' else 'private' end as seller_type
  from public.profiles where not is_banned;
grant select on public.public_profiles to anon, authenticated;

-- Whether "View phone" should be offered; the number itself stays private until revealed.
create or replace function public.listing_has_phone(p_listing_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.show_phone and p.contact_phone is not null
       from public.listing_private p join public.listings l on l.id = p.listing_id
      where p.listing_id = p_listing_id and l.status = 'active'),
    false);
$$;
grant execute on function public.listing_has_phone(bigint) to anon, authenticated;

-- Search results with the new card fields.
create or replace function public.search_listings(
  p_operation public.listing_operation,
  p_country char(2) default null,
  p_city_id bigint default null,
  p_neighborhood_id bigint default null,
  p_types public.property_type[] default null,
  p_price_min integer default null,
  p_price_max integer default null,
  p_bedrooms_min integer default null,
  p_bathrooms_min integer default null,
  p_area_min integer default null,
  p_area_max integer default null,
  p_features text[] default null,
  p_west double precision default null,
  p_south double precision default null,
  p_east double precision default null,
  p_north double precision default null,
  p_sort text default 'newest',
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with filtered as (
    select l.*
    from public.listings l
    where l.status = 'active'
      and l.operation = p_operation
      and (p_country is null or l.country_code = p_country)
      and (p_city_id is null or l.city_id = p_city_id)
      and (p_neighborhood_id is null or l.neighborhood_id = p_neighborhood_id)
      and (p_types is null or l.property_type = any (p_types))
      and (p_price_min is null or l.price >= p_price_min)
      and (p_price_max is null or l.price <= p_price_max)
      and (p_bedrooms_min is null or l.bedrooms >= p_bedrooms_min)
      and (p_bathrooms_min is null or l.bathrooms >= p_bathrooms_min)
      and (p_area_min is null or l.area_m2 >= p_area_min)
      and (p_area_max is null or l.area_m2 <= p_area_max)
      and (p_features is null or l.features @> p_features)
      and (p_west is null or l.location operator(extensions.&&)
           extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)::extensions.geography)
  ),
  page as (
    select f.*, count(*) over () as total_count
    from filtered f
    order by
      case when p_sort = 'price_asc' then f.price end asc,
      case when p_sort = 'price_desc' then f.price end desc,
      case when p_sort = 'area_desc' then f.area_m2 end desc,
      case when p_sort = 'price_m2_asc' then f.price::numeric / nullif(f.area_m2, 0) end asc,
      f.published_at desc, f.id desc
    limit least(greatest(p_limit, 1), 60)
    offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'total', coalesce((select total_count from page limit 1), (select count(*) from filtered)),
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'excerpt', left(regexp_replace(coalesce(p.description, ''), '\s+', ' ', 'g'), 260),
      'operation', p.operation,
      'property_type', p.property_type,
      'price', p.price,
      'previous_price', p.previous_price,
      'area_m2', p.area_m2,
      'bedrooms', p.bedrooms,
      'bathrooms', p.bathrooms,
      'floor', p.floor,
      'exterior', p.exterior,
      'features', p.features,
      'published_at', p.published_at,
      'city', c.name,
      'city_slug', c.slug,
      'country_code', p.country_code,
      'neighborhood', n.name,
      'seller_type', coalesce(pp.seller_type, 'private'),
      'has_phone', public.listing_has_phone(p.id),
      'lat', extensions.st_y(p.location::extensions.geometry),
      'lng', extensions.st_x(p.location::extensions.geometry),
      'photo_count', (select count(*) from public.listing_photos where listing_id = p.id),
      'photos', (select coalesce(jsonb_agg(ph.storage_path order by ph.position, ph.created_at), '[]'::jsonb)
                   from (select * from public.listing_photos where listing_id = p.id
                         order by position, created_at limit 20) ph)
    ) order by
      case when p_sort = 'price_asc' then p.price end asc,
      case when p_sort = 'price_desc' then p.price end desc,
      case when p_sort = 'area_desc' then p.area_m2 end desc,
      case when p_sort = 'price_m2_asc' then p.price::numeric / nullif(p.area_m2, 0) end asc,
      p.published_at desc, p.id desc), '[]'::jsonb)
  )
  from page p
  join public.cities c on c.id = p.city_id
  left join public.neighborhoods n on n.id = p.neighborhood_id
  left join public.public_profiles pp on pp.id = p.owner_id;
$$;
grant execute on function public.search_listings to anon, authenticated;
