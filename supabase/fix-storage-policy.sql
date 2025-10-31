-- ============================================================================
-- Fix Storage Policy for User Photo Uploads
-- ============================================================================
-- This fixes the RLS policy to match the actual upload path structure
-- Path structure: user-photos/{destination_id}/{user_id}_{timestamp}.ext

-- Drop old policy (wrong path check)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;

-- Create corrected policy
-- Allow authenticated users to upload photos where filename starts with their user_id
CREATE POLICY "Users can upload their own photos"
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'culture-uploads' 
  AND (storage.foldername(name))[1] = 'user-photos'
  AND (storage.filename(name)) LIKE (auth.uid()::text || '_%')
);

-- Verify policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname = 'Users can upload their own photos';

-- Test path matching (example)
-- Path: user-photos/123/abc-def-123_1698765432000.jpg
-- (storage.foldername(name))[1] = 'user-photos' ✓
-- (storage.filename(name)) = 'abc-def-123_1698765432000.jpg' ✓
-- Starts with user_id 'abc-def-123_' ✓
