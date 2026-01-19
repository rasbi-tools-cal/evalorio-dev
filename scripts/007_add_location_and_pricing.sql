-- Add location fields and estimated price to videos and analysis_results tables

-- Add location fields to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS address text;

-- Add estimated price to analysis_results
ALTER TABLE public.analysis_results 
ADD COLUMN IF NOT EXISTS estimated_price numeric(12, 2), -- estimated property price
ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'EUR';

-- Add comments for documentation
COMMENT ON COLUMN videos.country IS 'Property country location';
COMMENT ON COLUMN videos.city IS 'Property city location';
COMMENT ON COLUMN videos.address IS 'Property address (optional)';
COMMENT ON COLUMN analysis_results.estimated_price IS 'AI-estimated property price based on location and features';
COMMENT ON COLUMN analysis_results.price_currency IS 'Currency for estimated price (EUR, USD, etc.)';
