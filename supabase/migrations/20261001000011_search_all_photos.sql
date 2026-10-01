-- Result cards show a photo carousel: return every photo (max 20 per listing) and the count.
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
  left join public.neighborhoods n on n.id = p.neighborhood_id;
$$;

grant execute on function public.search_listings to anon, authenticated;
