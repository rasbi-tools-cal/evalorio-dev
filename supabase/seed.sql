-- LOCAL DEVELOPMENT ONLY (runs on `supabase db reset`). Never run against production.
-- Demo accounts (password for all: Evalorio2026):
--   admin@evalorio.test  -> moderator
--   owner@evalorio.test  -> trusted private owner (publishes instantly)
--   new@evalorio.test    -> new owner (first listing goes to review)

do $$
declare
  accounts jsonb := '[
    {"id":"a0000000-0000-4000-8000-000000000001","email":"admin@evalorio.test","name":"Ana Moderator"},
    {"id":"a0000000-0000-4000-8000-000000000002","email":"owner@evalorio.test","name":"Carlos García"},
    {"id":"a0000000-0000-4000-8000-000000000003","email":"new@evalorio.test","name":"Marie Dubois"}
  ]';
  acc jsonb;
begin
  for acc in select * from jsonb_array_elements(accounts) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', (acc->>'id')::uuid, 'authenticated', 'authenticated', acc->>'email',
      extensions.crypt('Evalorio2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', acc->>'name', 'locale', 'en'),
      now(), now(), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), (acc->>'id')::uuid, acc->>'id',
      jsonb_build_object('sub', acc->>'id', 'email', acc->>'email', 'email_verified', true),
      'email', now(), now(), now()
    ) on conflict do nothing;
  end loop;

  update public.profiles set role = 'admin', is_trusted = true where id = 'a0000000-0000-4000-8000-000000000001';
  update public.profiles set is_trusted = true, phone = '+34 600 123 456' where id = 'a0000000-0000-4000-8000-000000000002';
end $$;
