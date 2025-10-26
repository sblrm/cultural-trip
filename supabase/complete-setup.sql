-- ============================================================================
-- CulturalTrip - Complete Database Setup Script
-- ============================================================================
-- Jalankan script ini di Supabase SQL Editor untuk setup database lengkap
-- 
-- PENTING: Pastikan PostGIS extension sudah enabled!
-- Dashboard → Database → Extensions → Enable "postgis"
-- ============================================================================

-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- STEP 1: Create Custom Types
-- ============================================================================

CREATE TYPE hours_type AS (
    open text,
    close text
);

-- ============================================================================
-- STEP 2: Create Main Tables
-- ============================================================================

-- Destinations table with PostGIS support
CREATE TABLE IF NOT EXISTS public.destinations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    city text NOT NULL,
    province text NOT NULL,
    type text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    hours hours_type NOT NULL,
    duration integer NOT NULL,
    description text NOT NULL,
    image text NOT NULL,
    price numeric(10,2) NOT NULL,
    rating numeric(2,1) NOT NULL,
    transportation text[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    location geography(Point, 4326) GENERATED ALWAYS AS (st_makepoint(longitude, latitude)::geography) STORED
);

-- Plans table for trip planning
CREATE TABLE IF NOT EXISTS public.plans (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Plan destinations (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.plan_destinations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plan_id bigint REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
    destination_id bigint REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    visit_date date NOT NULL,
    visit_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, destination_id)
);

-- User profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tickets table for bookings
CREATE TABLE IF NOT EXISTS public.tickets (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    destination_id bigint REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
    visit_date date NOT NULL,
    booking_name text NOT NULL,
    booking_email text NOT NULL,
    booking_phone text NOT NULL,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    destination_id bigint REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    booking_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ticket_id bigint REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    payment_method text NOT NULL,
    payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ticket_id bigint REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- STEP 3: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create RLS Policies
-- ============================================================================

-- Destinations policies (public read)
DROP POLICY IF EXISTS "Destinations are viewable by everyone" ON public.destinations;
CREATE POLICY "Destinations are viewable by everyone"
ON public.destinations FOR SELECT
TO authenticated, anon
USING (true);

-- Plans policies (owner only)
DROP POLICY IF EXISTS "Plans are viewable by owner only" ON public.plans;
CREATE POLICY "Plans are viewable by owner only"
ON public.plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Plans can be inserted by authenticated users" ON public.plans;
CREATE POLICY "Plans can be inserted by authenticated users"
ON public.plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Plan destinations policies
DROP POLICY IF EXISTS "Plan destinations are viewable by plan owner only" ON public.plan_destinations;
CREATE POLICY "Plan destinations are viewable by plan owner only"
ON public.plan_destinations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.plans
        WHERE id = plan_destinations.plan_id
        AND user_id = auth.uid()
    )
);

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Profiles can only be updated by owner" ON public.profiles;
CREATE POLICY "Profiles can only be updated by owner"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles can be inserted by owner" ON public.profiles;
CREATE POLICY "Profiles can be inserted by owner"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Tickets policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
CREATE POLICY "Users can insert their own tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Purchases policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Refunds policies
DROP POLICY IF EXISTS "Users can view their own refunds" ON public.refunds;
CREATE POLICY "Users can view their own refunds"
ON public.refunds FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own refunds" ON public.refunds;
CREATE POLICY "Users can insert their own refunds"
ON public.refunds FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Create Functions and Triggers
-- ============================================================================

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at ON public.destinations;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.destinations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.plans;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.plan_destinations;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.plan_destinations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.tickets;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- Function for upsert profile
CREATE OR REPLACE FUNCTION public.upsert_profile(
    user_id uuid,
    new_username text,
    new_full_name text DEFAULT NULL,
    new_avatar_url text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (user_id, new_username, new_full_name, new_avatar_url)
    ON CONFLICT (id)
    DO UPDATE SET
        username = EXCLUDED.username,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS destinations_location_idx ON public.destinations USING gist(location);
CREATE INDEX IF NOT EXISTS plans_user_id_idx ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS plan_destinations_plan_id_idx ON public.plan_destinations(plan_id);
CREATE INDEX IF NOT EXISTS plan_destinations_destination_id_idx ON public.plan_destinations(destination_id);
CREATE INDEX IF NOT EXISTS tickets_user_id_idx ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS tickets_destination_id_idx ON public.tickets(destination_id);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS refunds_user_id_idx ON public.refunds(user_id);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next step: Run seed-data.sql to insert initial destinations data
-- ============================================================================
