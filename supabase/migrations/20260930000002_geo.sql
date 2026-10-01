-- Geography used for listing locations and SEO landing pages (/spain/madrid/...).
-- Reference data: publicly readable, written only by migrations/seeds (service role).

create table public.countries (
  code char(2) primary key check (code in ('ES', 'FR', 'IT', 'PT')),
  name text not null
);

create table public.cities (
  id bigint generated always as identity primary key,
  country_code char(2) not null references public.countries (code),
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  region text,
  population integer not null default 0,
  location extensions.geography(point, 4326) not null,
  unique (country_code, slug)
);

create index cities_country_population_idx on public.cities (country_code, population desc);
create index cities_name_trgm_idx on public.cities using gin (lower(public.f_unaccent(name)) extensions.gin_trgm_ops);

create table public.neighborhoods (
  id bigint generated always as identity primary key,
  city_id bigint not null references public.cities (id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location extensions.geography(point, 4326),
  unique (city_id, slug)
);

alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.neighborhoods enable row level security;

create policy "countries are public" on public.countries for select to anon, authenticated using (true);
create policy "cities are public" on public.cities for select to anon, authenticated using (true);
create policy "neighborhoods are public" on public.neighborhoods for select to anon, authenticated using (true);

grant select on public.countries, public.cities, public.neighborhoods to anon, authenticated;

-- City autocomplete for the search bar and the post-listing flow. Accent- and case-insensitive,
-- prefix matches first, then bigger cities.
create or replace function public.search_cities(q text, country char(2) default null, max_results int default 8)
returns table (id bigint, country_code char(2), name text, slug text, region text, lat double precision, lng double precision)
language sql
stable
set search_path = ''
as $$
  select c.id, c.country_code, c.name, c.slug, c.region,
         extensions.st_y(c.location::extensions.geometry), extensions.st_x(c.location::extensions.geometry)
  from public.cities c
  where length(trim(q)) >= 2
    and (country is null or c.country_code = country)
    and lower(public.f_unaccent(c.name)) like '%' || lower(public.f_unaccent(trim(q))) || '%'
  order by (lower(public.f_unaccent(c.name)) like lower(public.f_unaccent(trim(q))) || '%') desc,
           c.population desc
  limit least(greatest(max_results, 1), 20);
$$;
grant execute on function public.search_cities(text, char, int) to anon, authenticated;
