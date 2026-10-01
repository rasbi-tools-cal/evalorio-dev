-- Security tests for RLS, grants and listing workflow. Run: pnpm db:test (needs `supabase start`).
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- Fixtures -----------------------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, instance_id, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '{"display_name":"Alice"}'),
  ('22222222-2222-4222-8222-222222222222', 'bob@test.local', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '{"display_name":"Bob"}');

insert into public.listings (id, owner_id, status, operation, property_type, price, area_m2, country_code, city_id)
overriding system value
values (900001, '11111111-1111-4111-8111-111111111111', 'draft', 'sale', 'apartment', 200000, 80, 'ES',
        (select id from public.cities where country_code = 'ES' and slug = 'madrid'));
insert into public.listing_private (listing_id, location_exact, contact_phone)
values (900001, 'SRID=4326;POINT(-3.7038 40.4168)', '+34 600 000 001');

create or replace function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.anon() returns void language sql as $$
  select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
$$;
create or replace function pg_temp.reset() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- Profiles ------------------------------------------------------------------------------------------
select pg_temp.login('11111111-1111-4111-8111-111111111111');
select throws_ok($$ update public.profiles set role = 'admin' where id = auth.uid() $$, '42501', null, 'user cannot promote themselves to admin');
select throws_ok($$ update public.profiles set is_trusted = true where id = auth.uid() $$, '42501', null, 'user cannot mark themselves trusted');
select throws_ok($$ update public.profiles set is_banned = false where id = auth.uid() $$, '42501', null, 'user cannot touch the ban flag');
select lives_ok($$ update public.profiles set display_name = 'Alice B' where id = auth.uid() $$, 'user can edit own display name');
select is((select count(*)::int from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 0, 'user cannot read another profile');

-- Listings visibility -----------------------------------------------------------------------------------
select pg_temp.anon();
select is((select count(*)::int from public.listings where id = 900001), 0, 'anon cannot see a draft');
select throws_ok($$ select * from public.listing_private $$, '42501', null, 'anon cannot read private listing data');
select throws_ok($$ select public.hit_rate_limit('x', 1, 60) $$, '42501', null, 'anon cannot call the rate limiter');

select pg_temp.login('22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.listings where id = 900001), 0, 'other users cannot see a draft');
select is((select count(*)::int from public.listing_private where listing_id = 900001), 0, 'other users cannot read private data');
select is((select count(*)::int from public.listing_public_point(900001)), 0, 'public point hidden for drafts');
update public.listings set price = 1 where id = 900001;
select pg_temp.reset();
select is((select price from public.listings where id = 900001), 200000, 'other users cannot update a listing');

-- Workflow guards -----------------------------------------------------------------------------------------
select pg_temp.login('11111111-1111-4111-8111-111111111111');
select throws_ok(
  $$ insert into public.listings (operation, property_type, status) values ('sale', 'apartment', 'active') $$,
  '42501', null, 'owners cannot insert an active listing'
);
select throws_ok($$ update public.listings set status = 'active' where id = 900001 $$, '42501', null, 'owners cannot self-publish a draft');
select throws_ok($$ update public.listings set status = 'pending' where id = 900001 $$, '23514', null, 'submitting needs at least one photo');
select throws_ok(
  $$ insert into public.listing_photos (listing_id, storage_path) values (900001, '22222222-2222-4222-8222-222222222222/900001/x.webp') $$,
  '42501', null, 'photo path must live in the owner folder'
);
select lives_ok(
  $$ insert into public.listing_photos (listing_id, storage_path) values (900001, '11111111-1111-4111-8111-111111111111/900001/a.webp') $$,
  'owner can add a photo'
);
select lives_ok($$ update public.listings set status = 'pending' where id = 900001 $$, 'owner can submit');
select is((select status::text from public.listings where id = 900001), 'pending', 'untrusted owner goes to review, not live');
select throws_ok($$ select public.moderate_listing(900001, 'approve') $$, '42501', null, 'non-admins cannot moderate');

-- Moderation + privacy of location ------------------------------------------------------------------------
select pg_temp.reset();
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';
select pg_temp.login('22222222-2222-4222-8222-222222222222');
select lives_ok($$ select public.moderate_listing(900001, 'approve') $$, 'admin can approve');
select pg_temp.anon();
select is((select status::text from public.listings where id = 900001), 'active', 'approved listing is public');
select ok(
  (select extensions.st_distance(l.location, 'SRID=4326;POINT(-3.7038 40.4168)'::extensions.geography) between 70 and 210
   from public.listings l where l.id = 900001),
  'public location is offset from the exact address'
);
select pg_temp.reset();
select is((select is_trusted from public.profiles where id = '11111111-1111-4111-8111-111111111111'), true, 'approval makes the owner trusted');

-- Price history ---------------------------------------------------------------------------------------
select pg_temp.login('11111111-1111-4111-8111-111111111111');
select throws_ok($$ update public.listings set previous_price = 999999 where id = 900001 $$, '42501', null, 'owners cannot fake a previous price');
select lives_ok($$ update public.listings set price = 180000 where id = 900001 $$, 'owner lowers the price');
select pg_temp.reset();
select is((select previous_price from public.listings where id = 900001), 200000, 'a price drop on a published listing keeps the old price');
select is((select count(*)::int from public.listing_price_history where listing_id = 900001), 1, 'price change is recorded in the history');

select * from finish();
rollback;
