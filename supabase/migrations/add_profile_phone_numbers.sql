-- Add phone numbers support to profiles
-- Allows users to save up to 3 phone numbers

-- Add phone numbers array column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_numbers TEXT[] DEFAULT '{}';

-- Add primary phone number column (for backwards compatibility)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS primary_phone TEXT;

-- Add constraint to limit phone numbers to max 3
ALTER TABLE public.profiles 
  ADD CONSTRAINT phone_numbers_max_3 
  CHECK (array_length(phone_numbers, 1) IS NULL OR array_length(phone_numbers, 1) <= 3);

-- Create index for phone number searches
CREATE INDEX IF NOT EXISTS idx_profiles_phone_numbers ON public.profiles USING GIN (phone_numbers);

-- Function to add phone number to profile
CREATE OR REPLACE FUNCTION add_phone_number(p_user_id UUID, p_phone_number TEXT)
RETURNS JSONB AS $$
DECLARE
  current_phones TEXT[];
  result JSONB;
BEGIN
  -- Get current phone numbers
  SELECT phone_numbers INTO current_phones
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if already exists
  IF p_phone_number = ANY(current_phones) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Phone number already exists'
    );
  END IF;
  
  -- Check if limit reached
  IF array_length(current_phones, 1) >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Maximum 3 phone numbers allowed'
    );
  END IF;
  
  -- Add phone number
  UPDATE public.profiles
  SET phone_numbers = array_append(COALESCE(phone_numbers, '{}'), p_phone_number),
      primary_phone = COALESCE(primary_phone, p_phone_number)
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Phone number added successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove phone number from profile
CREATE OR REPLACE FUNCTION remove_phone_number(p_user_id UUID, p_phone_number TEXT)
RETURNS JSONB AS $$
DECLARE
  current_phones TEXT[];
  new_phones TEXT[];
BEGIN
  -- Get current phone numbers
  SELECT phone_numbers INTO current_phones
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if exists
  IF NOT (p_phone_number = ANY(current_phones)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Phone number not found'
    );
  END IF;
  
  -- Remove phone number
  SELECT array_agg(phone) INTO new_phones
  FROM unnest(current_phones) AS phone
  WHERE phone != p_phone_number;
  
  UPDATE public.profiles
  SET phone_numbers = COALESCE(new_phones, '{}')
  WHERE id = p_user_id;
  
  -- Update primary phone if removed
  UPDATE public.profiles
  SET primary_phone = (
    CASE 
      WHEN primary_phone = p_phone_number THEN new_phones[1]
      ELSE primary_phone
    END
  )
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Phone number removed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set primary phone number
CREATE OR REPLACE FUNCTION set_primary_phone(p_user_id UUID, p_phone_number TEXT)
RETURNS JSONB AS $$
DECLARE
  current_phones TEXT[];
BEGIN
  -- Get current phone numbers
  SELECT phone_numbers INTO current_phones
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if exists
  IF NOT (p_phone_number = ANY(current_phones)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Phone number not in your list'
    );
  END IF;
  
  -- Set as primary
  UPDATE public.profiles
  SET primary_phone = p_phone_number
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Primary phone number updated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN public.profiles.phone_numbers IS 'Array of phone numbers (max 3)';
COMMENT ON COLUMN public.profiles.primary_phone IS 'Primary phone number for notifications';
COMMENT ON FUNCTION add_phone_number IS 'Add a phone number to user profile (max 3)';
COMMENT ON FUNCTION remove_phone_number IS 'Remove a phone number from user profile';
COMMENT ON FUNCTION set_primary_phone IS 'Set primary phone number for notifications';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_phone_number TO authenticated;
GRANT EXECUTE ON FUNCTION remove_phone_number TO authenticated;
GRANT EXECUTE ON FUNCTION set_primary_phone TO authenticated;

