-- Least privilege for SECURITY DEFINER functions (Supabase advisor 0028/0029).
-- Postgres grants EXECUTE to PUBLIC by default, so every function was callable by anon via /rpc.

-- Trigger functions: never called directly (triggers fire without an EXECUTE check).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.listings_guard() from public, anon, authenticated;
revoke execute on function public.listing_private_sync() from public, anon, authenticated;
revoke execute on function public.listing_photos_guard() from public, anon, authenticated;
revoke execute on function public.saved_searches_limit() from public, anon, authenticated;
revoke execute on function public.listings_price_change() from public, anon, authenticated;

-- Signed-in users only (each one also checks the caller's rights inside).
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_banned() from public, anon;
revoke execute on function public.my_listing_stats() from public, anon;
revoke execute on function public.renew_listing(bigint) from public, anon;
revoke execute on function public.moderate_listing(bigint, text, text) from public, anon;
revoke execute on function public.set_user_banned(uuid, boolean, text) from public, anon;
revoke execute on function public.resolve_report(uuid, public.report_status) from public, anon;
revoke execute on function public.admin_users(text, integer) from public, anon;
revoke execute on function public.admin_user_email(uuid) from public, anon;
revoke execute on function public.update_privacy_request(uuid, public.privacy_request_status, text) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_banned() to authenticated;
grant execute on function public.my_listing_stats() to authenticated;
grant execute on function public.renew_listing(bigint) to authenticated;
grant execute on function public.moderate_listing(bigint, text, text) to authenticated;
grant execute on function public.set_user_banned(uuid, boolean, text) to authenticated;
grant execute on function public.resolve_report(uuid, public.report_status) to authenticated;
grant execute on function public.admin_users(text, integer) to authenticated;
grant execute on function public.admin_user_email(uuid) to authenticated;
grant execute on function public.update_privacy_request(uuid, public.privacy_request_status, text) to authenticated;

-- Intentionally public (listing pages and search, which run as anon):
-- listing_has_phone, listing_public_point, public_profile, seller_type.
