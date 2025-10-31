-- Fix Payment to Booking Flow
-- This migration ensures proper linking between transactions, bookings, and purchases

-- 0. Drop existing views that may conflict with table alterations
DROP VIEW IF EXISTS public.booking_details CASCADE;
DROP VIEW IF EXISTS public.purchase_details CASCADE;

-- 1. Make trip_data_id nullable and allow storing destination_id directly
DO $$ 
BEGIN
  -- Try to alter column, ignore if already nullable
  ALTER TABLE public.transactions 
    ALTER COLUMN trip_data_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore if already nullable
END $$;

-- Add comment to clarify usage
COMMENT ON COLUMN public.transactions.trip_data_id IS 'Can store destination_id for direct ticket purchases or trip_data_id for planned trips';

-- 2. Ensure bookings table has correct structure
-- (This is idempotent - won't fail if already exists)
DO $$ 
BEGIN
  -- Check if destination_id column exists and has correct type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings' 
    AND column_name = 'destination_id'
  ) THEN
    ALTER TABLE public.bookings 
      ADD COLUMN destination_id BIGINT REFERENCES public.destinations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Add trip_data_id to bookings for linking planned trips
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS trip_data_id INTEGER REFERENCES public.trip_data(id) ON DELETE SET NULL;

-- 3a. Add visit_date column to bookings (separate from booking_date)
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS visit_date DATE;

-- Update existing bookings to have visit_date = booking_date if null
UPDATE public.bookings 
SET visit_date = booking_date 
WHERE visit_date IS NULL;

-- Make visit_date NOT NULL after backfill
ALTER TABLE public.bookings 
  ALTER COLUMN visit_date SET NOT NULL;

-- 4. Link bookings back to transactions
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- 5. Update purchases table to link with bookings
ALTER TABLE public.purchases 
  ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_transaction_id ON public.bookings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_data_id ON public.bookings(trip_data_id);
CREATE INDEX IF NOT EXISTS idx_purchases_booking_id ON public.purchases(booking_id);

-- 6. Create a view for complete booking information
CREATE OR REPLACE VIEW public.booking_details AS
SELECT 
  b.id,
  b.user_id,
  b.destination_id,
  b.booking_date,
  b.quantity,
  b.total_price,
  b.status,
  b.created_at,
  b.updated_at,
  d.name as destination_name,
  d.city as destination_city,
  d.province as destination_province,
  d.image as destination_image,
  d.price as destination_price,
  t.order_id as transaction_order_id,
  t.payment_type,
  t.transaction_status
FROM public.bookings b
LEFT JOIN public.destinations d ON b.destination_id = d.id
LEFT JOIN public.transactions t ON b.transaction_id = t.id;

-- Grant access to authenticated users for the view
GRANT SELECT ON public.booking_details TO authenticated;

-- 7. Create a view for complete purchase information
CREATE OR REPLACE VIEW public.purchase_details AS
SELECT 
  p.id,
  p.user_id,
  p.ticket_id,
  p.booking_id,
  p.amount,
  p.payment_method,
  p.status,
  p.created_at,
  p.updated_at,
  b.destination_id,
  d.name as destination_name,
  d.city as destination_city,
  d.province as destination_province,
  d.image as destination_image,
  b.booking_date,
  b.quantity
FROM public.purchases p
LEFT JOIN public.bookings b ON p.booking_id = b.id
LEFT JOIN public.destinations d ON b.destination_id = d.id;

-- Grant access to authenticated users for the view
GRANT SELECT ON public.purchase_details TO authenticated;

-- 8. Add RLS policies for new columns
-- (Bookings policies already exist, just ensure they cover new columns)

-- 9. Comments for documentation
COMMENT ON COLUMN public.bookings.trip_data_id IS 'Links to planned trip if booking is part of a trip plan';
COMMENT ON COLUMN public.bookings.transaction_id IS 'Links to payment transaction';
COMMENT ON COLUMN public.purchases.booking_id IS 'Links to booking record';
COMMENT ON VIEW public.booking_details IS 'Complete booking information with destination and transaction details';
COMMENT ON VIEW public.purchase_details IS 'Complete purchase information with booking and destination details';

-- 10. Function to automatically create booking after successful payment
CREATE OR REPLACE FUNCTION create_booking_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  dest_id INTEGER;
  qty INTEGER;
  visit_date DATE;
  existing_booking_count INTEGER;
BEGIN
  -- Only create booking on successful payment
  IF NEW.transaction_status IN ('settlement', 'capture') 
     AND (OLD.transaction_status IS NULL OR OLD.transaction_status != NEW.transaction_status) THEN
    
    -- Check if booking already exists for this transaction
    SELECT COUNT(*) INTO existing_booking_count
    FROM public.bookings
    WHERE transaction_id = NEW.id;
    
    -- Skip if booking already created
    IF existing_booking_count > 0 THEN
      RETURN NEW;
    END IF;
    
    -- Extract destination ID from trip_data_id
    dest_id := NEW.trip_data_id;
    
    -- If not set, try to extract from item_details
    IF dest_id IS NULL AND NEW.item_details IS NOT NULL THEN
      -- Extract first number from first item's id (format: "DEST-123" or "123")
      SELECT (regexp_matches(
        NEW.item_details->0->>'id', 
        '\d+'
      ))[1]::INTEGER INTO dest_id;
    END IF;
    
    -- Get quantity from item_details
    SELECT COALESCE((NEW.item_details->0->>'quantity')::INTEGER, 1) INTO qty;
    
    -- Get visit date from metadata (stored in custom_field1) or default to tomorrow
    IF NEW.custom_field1 IS NOT NULL AND NEW.custom_field1 != '' THEN
      BEGIN
        visit_date := NEW.custom_field1::DATE;
      EXCEPTION
        WHEN OTHERS THEN
          visit_date := CURRENT_DATE + INTERVAL '1 day';
      END;
    ELSE
      visit_date := CURRENT_DATE + INTERVAL '1 day';
    END IF;
    
    -- Create booking if we have destination_id and user_id
    IF dest_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.bookings (
        user_id,
        destination_id,
        booking_date,
        visit_date,
        quantity,
        total_price,
        status,
        transaction_id
      ) VALUES (
        NEW.user_id,
        dest_id,
        CURRENT_DATE,
        visit_date,
        qty,
        NEW.gross_amount,
        'confirmed',
        NEW.id
      );
      
      -- Also create purchase record
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
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic booking creation
DROP TRIGGER IF EXISTS create_booking_after_payment ON public.transactions;
CREATE TRIGGER create_booking_after_payment
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_from_transaction();

COMMENT ON FUNCTION create_booking_from_transaction() IS 'Automatically creates booking and purchase records when payment is successful';

