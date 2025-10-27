-- Transactions Table for Payment Tracking
-- Stores all payment transactions via Midtrans

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Order details
  order_id VARCHAR(255) UNIQUE NOT NULL,
  booking_type VARCHAR(50) NOT NULL, -- 'trip', 'ticket', 'package'
  
  -- Midtrans transaction details
  transaction_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, success, failed, challenge, expired
  payment_type VARCHAR(50), -- credit_card, bank_transfer, gopay, etc.
  fraud_status VARCHAR(50), -- accept, challenge, deny
  
  -- Amount details
  gross_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  
  -- Customer details
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Payment metadata
  snap_token TEXT, -- Token for Midtrans Snap popup
  redirect_url TEXT, -- Redirect URL for payment
  
  -- Related data
  trip_data_id INTEGER REFERENCES trip_data(id) ON DELETE SET NULL,
  booking_id UUID, -- Link to bookings table if exists
  
  -- Item details (JSON)
  item_details JSONB, -- Array of items being purchased
  
  -- Midtrans response data (full response for reference)
  midtrans_response JSONB,
  
  -- Timestamps
  transaction_time TIMESTAMP WITH TIME ZONE,
  settlement_time TIMESTAMP WITH TIME ZONE,
  expiry_time TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX idx_transactions_status ON public.transactions(transaction_status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to update transactions (for webhook notifications)
CREATE POLICY "Service role can update transactions"
  ON public.transactions
  FOR UPDATE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.transactions IS 'Payment transactions via Midtrans payment gateway';
COMMENT ON COLUMN public.transactions.order_id IS 'Unique order ID for Midtrans transaction';
COMMENT ON COLUMN public.transactions.transaction_status IS 'Status: pending, success, failed, challenge, expired';
COMMENT ON COLUMN public.transactions.snap_token IS 'Midtrans Snap token for payment popup';
COMMENT ON COLUMN public.transactions.item_details IS 'JSON array of purchased items';
