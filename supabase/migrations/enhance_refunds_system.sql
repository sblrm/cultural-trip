-- Enhanced Refunds System
-- This migration improves refund functionality with booking links and better status management

-- 1. Update refunds table to link with bookings instead of tickets
ALTER TABLE public.refunds 
  ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON public.refunds(booking_id);

-- 2. Add more refund details
ALTER TABLE public.refunds 
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50) DEFAULT 'original_payment',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Update refund status options to be more specific
ALTER TABLE public.refunds 
  DROP CONSTRAINT IF EXISTS refunds_status_check;

ALTER TABLE public.refunds 
  ADD CONSTRAINT refunds_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'));

-- 4. Add eligibility check function
CREATE OR REPLACE FUNCTION check_refund_eligibility(
  booking_id_param BIGINT
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
  is_eligible BOOLEAN := FALSE;
  message TEXT := '';
  refund_percentage NUMERIC := 0;
  refund_amount NUMERIC := 0;
  days_until_visit INTEGER;
BEGIN
  -- Get booking details
  SELECT 
    b.id,
    b.status,
    b.visit_date,
    b.total_price,
    b.created_at
  INTO booking_record
  FROM public.bookings b
  WHERE b.id = booking_id_param;

  -- Check if booking exists
  IF NOT FOUND THEN
    result := json_build_object(
      'eligible', FALSE,
      'message', 'Booking tidak ditemukan',
      'refund_percentage', 0,
      'refund_amount', 0
    );
    RETURN result;
  END IF;

  -- Check if booking status is valid for refund
  IF booking_record.status NOT IN ('paid', 'confirmed') THEN
    result := json_build_object(
      'eligible', FALSE,
      'message', 'Status booking tidak memenuhi syarat refund. Hanya tiket dengan status "paid" atau "confirmed" yang bisa direfund.',
      'refund_percentage', 0,
      'refund_amount', 0
    );
    RETURN result;
  END IF;

  -- Check if visit date has passed
  IF booking_record.visit_date <= CURRENT_DATE THEN
    result := json_build_object(
      'eligible', FALSE,
      'message', 'Tanggal kunjungan sudah lewat. Refund tidak dapat diajukan.',
      'refund_percentage', 0,
      'refund_amount', 0
    );
    RETURN result;
  END IF;

  -- Check if there's already a pending/approved refund
  IF EXISTS (
    SELECT 1 FROM public.refunds 
    WHERE booking_id = booking_id_param 
    AND status IN ('pending', 'approved', 'completed')
  ) THEN
    result := json_build_object(
      'eligible', FALSE,
      'message', 'Sudah ada permintaan refund untuk booking ini',
      'refund_percentage', 0,
      'refund_amount', 0
    );
    RETURN result;
  END IF;

  -- Calculate days until visit
  days_until_visit := booking_record.visit_date - CURRENT_DATE;

  -- Determine refund percentage based on days until visit
  -- More than 7 days: 100% refund
  -- 3-7 days: 50% refund
  -- Less than 3 days: 25% refund
  IF days_until_visit >= 7 THEN
    refund_percentage := 100;
    message := 'Refund penuh (100%) - pembatalan lebih dari 7 hari sebelum kunjungan';
  ELSIF days_until_visit >= 3 THEN
    refund_percentage := 50;
    message := 'Refund 50% - pembatalan 3-7 hari sebelum kunjungan';
  ELSE
    refund_percentage := 25;
    message := 'Refund 25% - pembatalan kurang dari 3 hari sebelum kunjungan';
  END IF;

  -- Calculate refund amount
  refund_amount := booking_record.total_price * (refund_percentage / 100);

  -- Build result
  result := json_build_object(
    'eligible', TRUE,
    'message', message,
    'refund_percentage', refund_percentage,
    'refund_amount', refund_amount,
    'days_until_visit', days_until_visit,
    'original_amount', booking_record.total_price
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to request refund
CREATE OR REPLACE FUNCTION request_refund(
  user_id_param UUID,
  booking_id_param BIGINT,
  reason_param TEXT
)
RETURNS JSON AS $$
DECLARE
  eligibility JSON;
  is_eligible BOOLEAN;
  refund_amount_calc NUMERIC;
  new_refund_id BIGINT;
  result JSON;
BEGIN
  -- Check eligibility
  eligibility := check_refund_eligibility(booking_id_param);
  is_eligible := (eligibility->>'eligible')::BOOLEAN;

  IF NOT is_eligible THEN
    result := json_build_object(
      'success', FALSE,
      'message', eligibility->>'message'
    );
    RETURN result;
  END IF;

  -- Get refund amount
  refund_amount_calc := (eligibility->>'refund_amount')::NUMERIC;

  -- Create refund request
  INSERT INTO public.refunds (
    user_id,
    booking_id,
    ticket_id,
    reason,
    status,
    refund_amount,
    requested_at
  ) VALUES (
    user_id_param,
    booking_id_param,
    NULL,
    reason_param,
    'pending',
    refund_amount_calc,
    NOW()
  )
  RETURNING id INTO new_refund_id;

  -- Update booking status to refund_requested
  UPDATE public.bookings
  SET status = 'refund_requested',
      updated_at = NOW()
  WHERE id = booking_id_param;

  -- Build success result
  result := json_build_object(
    'success', TRUE,
    'message', 'Permintaan refund berhasil diajukan',
    'refund_id', new_refund_id,
    'refund_amount', refund_amount_calc,
    'refund_percentage', eligibility->>'refund_percentage'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to approve/reject refund (admin only)
CREATE OR REPLACE FUNCTION process_refund(
  refund_id_param BIGINT,
  admin_id_param UUID,
  new_status VARCHAR(20),
  rejection_reason_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  refund_record RECORD;
  result JSON;
BEGIN
  -- Get refund details
  SELECT r.*, b.id as booking_id
  INTO refund_record
  FROM public.refunds r
  JOIN public.bookings b ON r.booking_id = b.id
  WHERE r.id = refund_id_param;

  IF NOT FOUND THEN
    result := json_build_object(
      'success', FALSE,
      'message', 'Refund tidak ditemukan'
    );
    RETURN result;
  END IF;

  -- Check if admin (for now, just allow any authenticated user)
  -- In production, add proper admin role check

  -- Update refund status
  UPDATE public.refunds
  SET 
    status = new_status,
    approved_by = admin_id_param,
    processed_at = NOW(),
    rejection_reason = rejection_reason_param,
    updated_at = NOW()
  WHERE id = refund_id_param;

  -- Update booking status based on refund status
  IF new_status = 'approved' THEN
    UPDATE public.bookings
    SET status = 'refunded',
        updated_at = NOW()
    WHERE id = refund_record.booking_id;
    
    result := json_build_object(
      'success', TRUE,
      'message', 'Refund disetujui'
    );
  ELSIF new_status = 'rejected' THEN
    UPDATE public.bookings
    SET status = 'confirmed', -- Restore to confirmed
        updated_at = NOW()
    WHERE id = refund_record.booking_id;
    
    result := json_build_object(
      'success', TRUE,
      'message', 'Refund ditolak'
    );
  ELSIF new_status = 'completed' THEN
    result := json_build_object(
      'success', TRUE,
      'message', 'Refund selesai diproses'
    );
  ELSE
    result := json_build_object(
      'success', FALSE,
      'message', 'Status tidak valid'
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION check_refund_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION request_refund TO authenticated;
GRANT EXECUTE ON FUNCTION process_refund TO authenticated;

-- 8. Comments
COMMENT ON COLUMN public.refunds.booking_id IS 'Links to booking record (preferred over ticket_id)';
COMMENT ON COLUMN public.refunds.refund_amount IS 'Calculated refund amount based on cancellation policy';
COMMENT ON COLUMN public.refunds.approved_by IS 'Admin user who approved/rejected the refund';
COMMENT ON COLUMN public.refunds.refund_method IS 'Method of refund (original_payment, wallet, etc.)';
COMMENT ON COLUMN public.refunds.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON FUNCTION check_refund_eligibility IS 'Checks if a booking is eligible for refund and calculates refund amount';
COMMENT ON FUNCTION request_refund IS 'Creates a refund request if booking is eligible';
COMMENT ON FUNCTION process_refund IS 'Approves, rejects, or completes a refund request (admin function)';
