-- Add upload_type column to videos table to support both video and image uploads
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS upload_type text NOT NULL DEFAULT 'video'; -- 'video' or 'images'

-- Add column to store multiple image URLs for image uploads
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS image_urls jsonb; -- array of image URLs for image uploads

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_video_id ON public.analysis_results(video_id);
