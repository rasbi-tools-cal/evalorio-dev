-- Add detailed analysis fields to analysis_results table
ALTER TABLE public.analysis_results 
ADD COLUMN IF NOT EXISTS property_type text, -- 'apartment', 'house', etc.
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS video_duration integer, -- duration in seconds
ADD COLUMN IF NOT EXISTS photo_count integer, -- number of photos for image uploads
ADD COLUMN IF NOT EXISTS lighting_score integer, -- 0-100
ADD COLUMN IF NOT EXISTS layout_flow_score integer; -- 0-100

-- Add comments for documentation
COMMENT ON COLUMN analysis_results.property_type IS 'Type of property: apartment, house, condo, etc.';
COMMENT ON COLUMN analysis_results.address IS 'Property address if provided';
COMMENT ON COLUMN analysis_results.video_duration IS 'Video duration in seconds';
COMMENT ON COLUMN analysis_results.photo_count IS 'Number of photos for image uploads';
COMMENT ON COLUMN analysis_results.lighting_score IS 'AI-analyzed lighting quality score (0-100)';
COMMENT ON COLUMN analysis_results.layout_flow_score IS 'AI-analyzed layout flow score (0-100)';
