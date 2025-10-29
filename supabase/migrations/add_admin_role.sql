-- ============================================================================
-- Add Admin Role System
-- ============================================================================
-- This migration adds role-based access control for admin users

-- Add role column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add check constraint for valid roles
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ============================================================================
-- Admin Check Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Update Destinations Policies for Admin
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Destinations are viewable by everyone" ON public.destinations;
DROP POLICY IF EXISTS "Admin can insert destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admin can update destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admin can delete destinations" ON public.destinations;

-- Everyone can view destinations
CREATE POLICY "Destinations are viewable by everyone"
ON public.destinations FOR SELECT
TO authenticated, anon
USING (true);

-- Only admins can insert destinations
CREATE POLICY "Admin can insert destinations"
ON public.destinations FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update destinations
CREATE POLICY "Admin can update destinations"
ON public.destinations FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete destinations
CREATE POLICY "Admin can delete destinations"
ON public.destinations FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- Set Initial Admin (CHANGE THIS EMAIL!)
-- ============================================================================
-- Run this after creating your account, replace with your email

-- UPDATE public.profiles 
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
-- );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN public.profiles.role IS 'User role: user, admin, or superadmin';
COMMENT ON FUNCTION public.is_admin IS 'Check if current user has admin or superadmin role';
