-- =====================================================
-- Storage Policies for destination-images bucket
-- =====================================================
-- Run this migration after creating the bucket
-- This allows authenticated users to upload images

-- 1. Allow public to view/download images (SELECT)
CREATE POLICY "Public can view destination images"
ON storage.objects FOR SELECT
USING (bucket_id = 'destination-images');

-- 2. Allow authenticated users to upload images (INSERT)
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'destination-images'
);

-- 3. Allow authenticated users to update their uploads (UPDATE)
CREATE POLICY "Authenticated users can update destination images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'destination-images')
WITH CHECK (bucket_id = 'destination-images');

-- 4. Allow authenticated users to delete their uploads (DELETE)
CREATE POLICY "Authenticated users can delete destination images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'destination-images');

-- =====================================================
-- OPTIONAL: Admin-only upload (stricter security)
-- =====================================================
-- Uncomment below to restrict upload to admin only
-- First, drop the authenticated upload policy:
-- DROP POLICY IF EXISTS "Authenticated users can upload destination images" ON storage.objects;

-- Then create admin-only policy:
-- CREATE POLICY "Only admins can upload destination images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'destination-images' 
--   AND EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.role IN ('admin', 'superadmin')
--   )
-- );

-- =====================================================
-- Verify Policies
-- =====================================================
-- Run this to check if policies are created:
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND policyname LIKE '%destination%';
