-- Fewer, lighter photos so the free storage tier holds about twice as many listings:
-- max 12 photos per listing (was 20) and max 3 MiB per file (client sends ~150-400 KB WebP).
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
    if (select count(*) from public.listing_photos where listing_id = new.listing_id) >= 12 then
      raise exception 'a listing can have at most 12 photos' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

update storage.buckets set file_size_limit = 3145728 where id = 'listing-photos';
