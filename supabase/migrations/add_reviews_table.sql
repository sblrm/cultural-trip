-- ============================================================================
-- Add Reviews & Rating System
-- ============================================================================
-- This migration adds the reviews table for destination ratings and reviews

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    destination_id bigint REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure one review per user per destination
    UNIQUE(destination_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
-- Anyone can read reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
TO authenticated, anon
USING (true);

-- Users can insert their own reviews
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add updated_at trigger for reviews
DROP TRIGGER IF EXISTS handle_updated_at ON public.reviews;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reviews_destination_id_idx ON public.reviews(destination_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews(created_at DESC);

-- Create a view for destination ratings summary
CREATE OR REPLACE VIEW public.destination_ratings AS
SELECT 
    d.id as destination_id,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_count
FROM public.destinations d
LEFT JOIN public.reviews r ON d.id = r.destination_id
GROUP BY d.id;

-- Grant access to the view
GRANT SELECT ON public.destination_ratings TO authenticated, anon;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Run this in Supabase SQL Editor to add reviews functionality
