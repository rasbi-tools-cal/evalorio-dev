-- Search RPCs, storage policies for listing photos, scheduled maintenance.

---------------------------------------------------------------------------------------------------
-- Search. SECURITY INVOKER: RLS still applies, and we only ever return active listings.
---------------------------------------------------------------------------------------------------
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
      'operation', p.operation,
      'property_type', p.property_type,
      'price', p.price,
      'area_m2', p.area_m2,
      'bedrooms', p.bedrooms,
      'bathrooms', p.bathrooms,
      'features', p.features,
      'published_at', p.published_at,
      'city', c.name,
      'city_slug', c.slug,
      'country_code', p.country_code,
      'neighborhood', n.name,
      'lat', extensions.st_y(p.location::extensions.geometry),
      'lng', extensions.st_x(p.location::extensions.geometry),
      'photos', (select coalesce(jsonb_agg(ph.storage_path order by ph.position, ph.created_at), '[]'::jsonb)
                   from (select * from public.listing_photos where listing_id = p.id
                         order by position, created_at limit 5) ph)
    ) order by
      case when p_sort = 'price_asc' then p.price end asc,
      case when p_sort = 'price_desc' then p.price end desc,
      case when p_sort = 'area_desc' then p.area_m2 end desc,
      case when p_sort = 'price_m2_asc' then p.price::numeric / nullif(p.area_m2, 0) end asc,
      p.published_at desc, p.id desc), '[]'::jsonb)
  )
  from page p
  join public.cities c on c.id = p.city_id
  left join public.neighborhoods n on n.id = p.neighborhood_id;
$$;

-- Lightweight points for the map (price bubbles), capped.
create or replace function public.search_listing_markers(
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
  p_north double precision default null
)
returns table (id bigint, price integer, lat double precision, lng double precision)
language sql
stable
set search_path = ''
as $$
  select l.id, l.price, extensions.st_y(l.location::extensions.geometry), extensions.st_x(l.location::extensions.geometry)
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
  order by l.published_at desc
  limit 500;
$$;

grant execute on function public.search_listings to anon, authenticated;
grant execute on function public.search_listing_markers to anon, authenticated;

-- View counter, called by the server only (bots filtered there).
create or replace function public.increment_listing_views(p_listing_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.listings set views_count = views_count + 1 where id = p_listing_id and status = 'active';
$$;
revoke execute on function public.increment_listing_views(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_views(bigint) to service_role;

---------------------------------------------------------------------------------------------------
-- Storage: bucket "listing-photos" (public read via CDN URL, 10 MiB, jpeg/png/webp — see
-- config.toml / dashboard). Writes only into "<own uid>/<own listing id>/".
---------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "owners upload listing photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2] and l.owner_id = (select auth.uid())
    )
    and not (select public.is_banned())
  );

create policy "owners read own listing photo objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "owners delete listing photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

---------------------------------------------------------------------------------------------------
-- Scheduled jobs
---------------------------------------------------------------------------------------------------
create or replace function public.expire_listings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  perform set_config('evalorio.bypass_guard', 'on', true);
  update public.listings set status = 'expired' where status in ('active', 'paused') and expires_at < now();
  get diagnostics n = row_count;
  perform set_config('evalorio.bypass_guard', '', true);
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return n;
end;
$$;
revoke execute on function public.expire_listings() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('evalorio-expire-listings', '17 * * * *', $$select public.expire_listings()$$);
