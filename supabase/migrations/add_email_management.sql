-- Add email_addresses and primary_email columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_addresses TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_email TEXT;

-- Add constraint: Max 3 email addresses
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS email_addresses_limit;

ALTER TABLE public.profiles 
  ADD CONSTRAINT email_addresses_limit 
  CHECK (array_length(email_addresses, 1) IS NULL OR array_length(email_addresses, 1) <= 3);

-- Function to add email address
CREATE OR REPLACE FUNCTION add_email_address(
  p_user_id UUID,
  p_email_address TEXT
)
RETURNS JSON AS $$
DECLARE
  current_emails TEXT[];
  email_count INTEGER;
BEGIN
  -- Get current email addresses
  SELECT email_addresses INTO current_emails
  FROM public.profiles
  WHERE id = p_user_id;

  -- Initialize if NULL
  IF current_emails IS NULL THEN
    current_emails := ARRAY[]::TEXT[];
  END IF;

  email_count := array_length(current_emails, 1);
  IF email_count IS NULL THEN
    email_count := 0;
  END IF;

  -- Check if already at limit
  IF email_count >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Maksimal 3 email telah tercapai'
    );
  END IF;

  -- Check if email already exists
  IF p_email_address = ANY(current_emails) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email sudah terdaftar'
    );
  END IF;

  -- Add new email
  UPDATE public.profiles
  SET email_addresses = array_append(current_emails, p_email_address),
      primary_email = COALESCE(primary_email, p_email_address), -- Set as primary if first
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email berhasil ditambahkan'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove email address
CREATE OR REPLACE FUNCTION remove_email_address(
  p_user_id UUID,
  p_email_address TEXT
)
RETURNS JSON AS $$
DECLARE
  current_emails TEXT[];
  new_primary TEXT;
BEGIN
  -- Get current email addresses
  SELECT email_addresses INTO current_emails
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if email exists
  IF NOT (p_email_address = ANY(current_emails)) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email tidak ditemukan'
    );
  END IF;

  -- Remove email from array
  current_emails := array_remove(current_emails, p_email_address);

  -- If removing primary email, set new primary
  SELECT primary_email INTO new_primary
  FROM public.profiles
  WHERE id = p_user_id;

  IF new_primary = p_email_address THEN
    -- Set first email as new primary, or NULL if no emails left
    IF array_length(current_emails, 1) > 0 THEN
      new_primary := current_emails[1];
    ELSE
      new_primary := NULL;
    END IF;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET email_addresses = current_emails,
      primary_email = new_primary,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email berhasil dihapus'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set primary email
CREATE OR REPLACE FUNCTION set_primary_email(
  p_user_id UUID,
  p_email_address TEXT
)
RETURNS JSON AS $$
DECLARE
  current_emails TEXT[];
BEGIN
  -- Get current email addresses
  SELECT email_addresses INTO current_emails
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if email exists in the list
  IF NOT (p_email_address = ANY(current_emails)) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email tidak ditemukan dalam daftar'
    );
  END IF;

  -- Set as primary
  UPDATE public.profiles
  SET primary_email = p_email_address,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email utama berhasil diatur'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_email_address TO authenticated;
GRANT EXECUTE ON FUNCTION remove_email_address TO authenticated;
GRANT EXECUTE ON FUNCTION set_primary_email TO authenticated;

-- Comments
COMMENT ON COLUMN public.profiles.email_addresses IS 'Array of additional email addresses (max 3)';
COMMENT ON COLUMN public.profiles.primary_email IS 'Primary email for notifications';
COMMENT ON FUNCTION add_email_address IS 'Add new email address to profile (max 3)';
COMMENT ON FUNCTION remove_email_address IS 'Remove email address from profile';
COMMENT ON FUNCTION set_primary_email IS 'Set primary email for notifications';
