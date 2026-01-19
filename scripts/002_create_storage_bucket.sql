-- Storage Bucket Setup Instructions:
-- 
-- Updated to create PUBLIC buckets for easier access
-- Since creating storage buckets requires admin permissions, you need to create the bucket manually:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to Storage in the left sidebar
-- 3. Click "Create a new bucket"
-- 4. Create TWO buckets:
--    a) Name: "videos" - Set as PUBLIC
--    b) Name: "images" - Set as PUBLIC
-- 5. Set file size limit: 500 MB for videos, 10 MB for images
-- 6. Set allowed MIME types: 
--    - videos: video/mp4, video/quicktime
--    - images: image/jpeg, image/jpg, image/png
-- 
-- After creating the PUBLIC buckets manually, you don't need to run this script.
-- Public buckets don't require RLS policies since they're accessible to everyone.

-- If you prefer PRIVATE buckets with RLS policies, keep them private and run the policies below:

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Allow authenticated uploads to videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;

-- Simplified policies that work with service role uploads
-- Policy: Allow authenticated users to upload videos (service role bypasses this)
CREATE POLICY "Allow authenticated uploads to videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Policy: Allow authenticated users to upload images (service role bypasses this)
CREATE POLICY "Allow authenticated uploads to images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Policy: Allow anyone to read videos
CREATE POLICY "Allow public read access to videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Policy: Allow anyone to read images
CREATE POLICY "Allow public read access to images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');
