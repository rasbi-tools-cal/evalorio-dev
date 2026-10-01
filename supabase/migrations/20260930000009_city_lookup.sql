-- One city with coordinates (edit forms, search context).
create or replace function public.get_city(p_id bigint)
returns table (id bigint, country_code char(2), name text, slug text, region text, lat double precision, lng double precision)
language sql
stable
set search_path = ''
as $$
  select c.id, c.country_code, c.name, c.slug, c.region,
         extensions.st_y(c.location::extensions.geometry), extensions.st_x(c.location::extensions.geometry)
  from public.cities c
  where c.id = p_id;
$$;
grant execute on function public.get_city(bigint) to anon, authenticated;
