-- Enhanced Booking System with QR Code & Proper Status Flow
-- This migration adds QR code support, booking codes, and proper status management

-- 1. Add booking_code and qr_code to bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS booking_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
  ADD COLUMN IF NOT EXISTS visit_date DATE, -- Actual visit date (different from booking_date)
  ADD COLUMN IF NOT EXISTS ticket_quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Update status to be more specific
-- Old: 'confirmed', 'pending', 'cancelled'
-- New: 'pending_payment', 'paid', 'confirmed', 'used', 'cancelled', 'refund_requested', 'refunded'
ALTER TABLE public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'used', 'cancelled', 'refund_requested', 'refunded'));

-- 2. Create booking_code generation function
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN := TRUE;
BEGIN
  WHILE exists LOOP
    -- Format: TRV-YYYYMMDD-XXXX (e.g., TRV-20251027-A1B2)
    code := 'TRV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_code = code) INTO exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to auto-generate booking_code on insert
CREATE OR REPLACE FUNCTION set_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_booking_code_trigger ON public.bookings;
CREATE TRIGGER generate_booking_code_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_code();

-- 4. Update purchases table to link with bookings
ALTER TABLE public.purchases 
  ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_booking_id ON public.purchases(booking_id);

-- 5. Update refunds table with more details
ALTER TABLE public.refunds 
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50);

-- Update refund status options
ALTER TABLE public.refunds 
  DROP CONSTRAINT IF EXISTS refunds_status_check;

ALTER TABLE public.refunds 
  ADD CONSTRAINT refunds_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- 6. Create reviews table for post-visit ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination_id BIGINT REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  visit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add booking_id column if table already existed
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add unique constraint only for non-null booking_id (one review per booking)
DROP INDEX IF EXISTS idx_reviews_unique_booking;
CREATE UNIQUE INDEX idx_reviews_unique_booking 
  ON public.reviews(user_id, booking_id) 
  WHERE booking_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_destination_id ON public.reviews(destination_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.reviews;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Update booking_details view to include new fields
DROP VIEW IF EXISTS public.booking_details;
CREATE OR REPLACE VIEW public.booking_details AS
SELECT 
  b.id,
  b.user_id,
  b.destination_id,
  b.booking_date,
  b.visit_date,
  b.quantity,
  b.ticket_quantity,
  b.total_price,
  b.status,
  b.booking_code,
  b.qr_code_url,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.created_at,
  b.updated_at,
  d.name as destination_name,
  d.city as destination_city,
  d.province as destination_province,
  d.image as destination_image,
  d.price as destination_price,
  t.order_id as transaction_order_id,
  t.payment_type,
  t.transaction_status,
  -- Check if review exists
  CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review,
  r.rating as review_rating
FROM public.bookings b
LEFT JOIN public.destinations d ON b.destination_id = d.id
LEFT JOIN public.transactions t ON b.transaction_id = t.id
LEFT JOIN public.reviews r ON r.booking_id = b.id;

GRANT SELECT ON public.booking_details TO authenticated;

-- 8. Function to mark booking as used (after visit date passes)
CREATE OR REPLACE FUNCTION mark_past_bookings_as_used()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.bookings
  SET status = 'used'
  WHERE status = 'confirmed'
    AND visit_date < CURRENT_DATE
    AND visit_date IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to get bookings that need review notification
CREATE OR REPLACE FUNCTION get_bookings_needing_review()
RETURNS TABLE (
  booking_id BIGINT,
  user_id UUID,
  destination_id BIGINT,
  destination_name TEXT,
  visit_date DATE,
  customer_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.destination_id,
    d.name,
    b.visit_date,
    b.customer_email
  FROM public.bookings b
  JOIN public.destinations d ON b.destination_id = d.id
  LEFT JOIN public.reviews r ON r.booking_id = b.id
  WHERE b.status = 'used'
    AND b.visit_date >= CURRENT_DATE - INTERVAL '7 days' -- Within 7 days
    AND r.id IS NULL -- No review yet
  ORDER BY b.visit_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update create_booking_from_transaction to use new fields
-- Drop trigger first before dropping function
DROP TRIGGER IF EXISTS create_booking_after_payment ON public.transactions;

-- Now safe to drop and recreate function
DROP FUNCTION IF EXISTS create_booking_from_transaction();
CREATE OR REPLACE FUNCTION create_booking_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  dest_id INTEGER;
  qty INTEGER;
  visit_date DATE;
BEGIN
  -- Only create booking on successful payment
  IF NEW.transaction_status IN ('settlement', 'capture') 
     AND (OLD.transaction_status IS NULL OR OLD.transaction_status != NEW.transaction_status) THEN
    
    -- Extract destination ID from trip_data_id
    dest_id := NEW.trip_data_id;
    
    -- If not set, try to extract from item_details
    IF dest_id IS NULL AND NEW.item_details IS NOT NULL THEN
      SELECT (regexp_matches(
        NEW.item_details->0->>'id', 
        '\d+'
      ))[1]::INTEGER INTO dest_id;
    END IF;
    
    -- Get quantity from item_details
    SELECT COALESCE((NEW.item_details->0->>'quantity')::INTEGER, 1) INTO qty;
    
    -- Set visit date to tomorrow as default
    visit_date := CURRENT_DATE + INTERVAL '1 day';
    
    -- Create booking if we have destination_id and user_id
    IF dest_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.bookings (
        user_id,
        destination_id,
        booking_date,
        visit_date,
        quantity,
        ticket_quantity,
        total_price,
        status,
        transaction_id,
        customer_name,
        customer_email,
        customer_phone
      ) VALUES (
        NEW.user_id,
        dest_id,
        CURRENT_DATE,
        visit_date,
        qty,
        qty,
        NEW.gross_amount,
        'paid', -- Changed from 'confirmed' to 'paid'
        NEW.id,
        NEW.customer_name,
        NEW.customer_email,
        NEW.customer_phone
      )
      ON CONFLICT DO NOTHING;
      
      -- Create purchase record and link to booking
      INSERT INTO public.purchases (
        user_id,
        ticket_id,
        amount,
        payment_method,
        status,
        booking_id
      ) 
      SELECT 
        NEW.user_id,
        NULL,
        NEW.gross_amount,
        NEW.payment_type,
        'paid',
        b.id
      FROM public.bookings b
      WHERE b.transaction_id = NEW.id
      LIMIT 1
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (already dropped above)
CREATE TRIGGER create_booking_after_payment
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_from_transaction();

-- 11. Comments
COMMENT ON COLUMN public.bookings.booking_code IS 'Unique booking code (e.g., TRV-20251027-A1B2)';
COMMENT ON COLUMN public.bookings.qr_code_url IS 'URL to QR code image for e-ticket';
COMMENT ON COLUMN public.bookings.visit_date IS 'Scheduled visit date (different from booking_date)';
COMMENT ON COLUMN public.bookings.status IS 'Status: pending_payment, paid, confirmed, used, cancelled, refund_requested, refunded';
COMMENT ON TABLE public.reviews IS 'User reviews and ratings for destinations after visit';
COMMENT ON FUNCTION generate_booking_code() IS 'Generates unique booking code in format TRV-YYYYMMDD-XXXX';
COMMENT ON FUNCTION mark_past_bookings_as_used() IS 'Marks bookings as used after visit date passes';
COMMENT ON FUNCTION get_bookings_needing_review() IS 'Returns bookings that need review notification (within 7 days, no review yet)';

-- Grant permissions
GRANT EXECUTE ON FUNCTION mark_past_bookings_as_used TO authenticated;
GRANT EXECUTE ON FUNCTION get_bookings_needing_review TO authenticated;

