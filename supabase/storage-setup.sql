-- ============================================================================
-- Supabase Storage Setup for User Photo Uploads
-- ============================================================================
-- This script creates the storage bucket and policies for user photo uploads
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create storage bucket for culture/destination photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('culture-uploads', 'culture-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to culture photos" ON storage.objects;

-- 3. Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'culture-uploads' AND
  (storage.foldername(name))[1] = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 4. Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'culture-uploads' AND
  (storage.foldername(name))[1] = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 5. Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'culture-uploads' AND
  (storage.foldername(name))[1] = 'user-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- 6. Allow public read access to all photos
CREATE POLICY "Public read access to culture photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'culture-uploads');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'culture-uploads';

-- ============================================================================
-- Storage Structure:
-- ============================================================================
-- culture-uploads/
--   user-photos/
--     {destination_id}/
--       {user_id}_{timestamp}.{ext}
-- 
-- Example: culture-uploads/user-photos/123/abc123_1698765432000.jpg
-- ============================================================================
