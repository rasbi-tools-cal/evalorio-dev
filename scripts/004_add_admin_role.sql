-- Add is_admin column to users table
alter table public.users add column if not exists is_admin boolean default false;

-- Add RLS policies for admin users to access all data

-- Admin users can view all user profiles
create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Admin users can update all user profiles
create policy "Admins can update all users"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Admin users can view all videos
create policy "Admins can view all videos"
  on public.videos for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Admin users can update all videos
create policy "Admins can update all videos"
  on public.videos for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Admin users can delete all videos
create policy "Admins can delete all videos"
  on public.videos for delete
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Admin users can view all analysis results
create policy "Admins can view all analysis results"
  on public.analysis_results for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Create a function to grant admin access (can be called manually)
create or replace function public.make_user_admin(user_email text)
returns void
language plpgsql
security definer
as $$
begin
  update public.users
  set is_admin = true
  where email = user_email;
end;
$$;

-- Example: To make a user admin, run in Supabase SQL Editor:
-- SELECT public.make_user_admin('admin@example.com');
