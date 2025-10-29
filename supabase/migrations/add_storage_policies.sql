-- =====================================================
-- Storage Policies for destination-images bucket
-- =====================================================
-- Run this migration after creating the bucket
-- This allows authenticated users to upload images

-- Drop existing policies if any (for re-running migration)
DROP POLICY IF EXISTS "Public can view destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete destination images" ON storage.objects;

-- 1. Allow anyone to view/download images (SELECT)
-- This is necessary for public access to destination images
CREATE POLICY "Public can view destination images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'destination-images');

-- 2. Allow authenticated users to upload images (INSERT)
-- More permissive: checks if user is authenticated OR has valid session
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'destination-images'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
);

-- 3. Allow authenticated users to update their uploads (UPDATE)
CREATE POLICY "Authenticated users can update destination images"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'destination-images'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
)
WITH CHECK (
  bucket_id = 'destination-images'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
);

-- 4. Allow authenticated users to delete their uploads (DELETE)
CREATE POLICY "Authenticated users can delete destination images"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'destination-images'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
);

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
