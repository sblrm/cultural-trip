-- ============================================================================
-- Add Photos Column to Reviews Table
-- ============================================================================
-- This migration adds support for photo attachments in reviews

-- Add photos column (array of URLs)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN public.reviews.photos IS 'Array of photo URLs uploaded by users (max 5 photos per review)';

-- Create index for reviews with photos (for filtering/searching)
CREATE INDEX IF NOT EXISTS reviews_has_photos_idx 
ON public.reviews ((array_length(photos, 1) > 0));

-- Update the destination_ratings view to include photo count
CREATE OR REPLACE VIEW public.destination_ratings AS
SELECT 
    d.id as destination_id,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_count,
    COUNT(CASE WHEN array_length(r.photos, 1) > 0 THEN 1 END) as reviews_with_photos
FROM public.destinations d
LEFT JOIN public.reviews r ON d.id = r.destination_id
GROUP BY d.id;

-- Grant access to the view
GRANT SELECT ON public.destination_ratings TO authenticated, anon;

-- Verify column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews' 
  AND column_name = 'photos';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Now reviews table supports photo uploads
-- Example usage:
-- INSERT INTO reviews (user_id, destination_id, rating, comment, photos)
-- VALUES ('user-id', 123, 5, 'Great place!', ARRAY['url1.jpg', 'url2.jpg']);
