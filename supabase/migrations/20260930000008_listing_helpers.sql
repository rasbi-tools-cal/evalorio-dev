-- Public point of a listing (lat/lng) + whether it is the exact location. Visibility mirrors the
-- listings SELECT policies; the private exact coordinates are never returned.
create or replace function public.listing_public_point(p_listing_id bigint)
returns table (lat double precision, lng double precision, exact boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select extensions.st_y(l.location::extensions.geometry),
         extensions.st_x(l.location::extensions.geometry),
         coalesce(p.show_exact_location, false)
  from public.listings l
  left join public.listing_private p on p.listing_id = l.id
  where l.id = p_listing_id
    and l.location is not null
    and (l.status = 'active' or l.owner_id = (select auth.uid()) or (select public.is_admin()));
$$;
grant execute on function public.listing_public_point(bigint) to anon, authenticated;

-- Owner-side view of their own listing's private data as plain lat/lng (for the edit form).
create or replace function public.listing_private_point(p_listing_id bigint)
returns table (lat double precision, lng double precision)
language sql
stable
set search_path = ''
as $$
  select extensions.st_y(p.location_exact::extensions.geometry), extensions.st_x(p.location_exact::extensions.geometry)
  from public.listing_private p
  where p.listing_id = p_listing_id;
$$;
grant execute on function public.listing_private_point(bigint) to authenticated;

-- Dashboard stats for the owner's listings in one round-trip.
create or replace function public.my_listing_stats()
returns table (listing_id bigint, reveals bigint, messages bigint, favorites bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id,
         (select count(*) from public.phone_reveals r where r.listing_id = l.id),
         (select count(*) from public.messages m where m.listing_id = l.id),
         (select count(*) from public.favorites f where f.listing_id = l.id)
  from public.listings l
  where l.owner_id = (select auth.uid());
$$;
grant execute on function public.my_listing_stats() to authenticated;
