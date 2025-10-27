-- ============================================================================
-- Fix Reviews Foreign Key to Reference Profiles
-- ============================================================================
-- This migration fixes the reviews.user_id foreign key to reference profiles
-- instead of auth.users, enabling proper joins

-- Drop existing foreign key constraint
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Add new foreign key constraint referencing profiles
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Verify the constraint exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'reviews'
    AND kcu.column_name = 'user_id';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Run this in Supabase SQL Editor
