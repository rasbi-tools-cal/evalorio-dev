-- Add property details fields to videos table for better analysis accuracy
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS property_type text, -- 'apartment', 'house', 'condo', 'villa', etc.
ADD COLUMN IF NOT EXISTS surface numeric(10, 2), -- surface in square meters
ADD COLUMN IF NOT EXISTS rooms integer, -- number of rooms
ADD COLUMN IF NOT EXISTS building_year integer; -- year the building was constructed

-- Add comments for documentation
COMMENT ON COLUMN videos.property_type IS 'Type of property (apartment, house, condo, villa, etc.)';
COMMENT ON COLUMN videos.surface IS 'Property surface area in square meters';
COMMENT ON COLUMN videos.rooms IS 'Number of rooms in the property';
COMMENT ON COLUMN videos.building_year IS 'Year the building/apartment was constructed';
