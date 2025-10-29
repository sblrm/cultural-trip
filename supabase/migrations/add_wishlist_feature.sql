-- =====================================================
-- Wishlist/Favorites Feature
-- =====================================================
-- Allows users to save favorite destinations for later visits
-- and share wishlist with friends

-- 1. Create wishlists table (user's wishlist collections)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Wishlist',
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(32) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create wishlist_items table (destinations in each wishlist)
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id BIGSERIAL PRIMARY KEY,
  wishlist_id BIGINT NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  destination_id BIGINT NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  notes TEXT,
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=must-visit
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wishlist_id, destination_id) -- Prevent duplicate entries
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_share_token ON public.wishlists(share_token);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_destination_id ON public.wishlist_items(destination_id);

-- 4. Create updated_at trigger for wishlists
CREATE OR REPLACE FUNCTION update_wishlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wishlist_updated_at
BEFORE UPDATE ON public.wishlists
FOR EACH ROW
EXECUTE FUNCTION update_wishlist_updated_at();

-- 5. Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(32) AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 6. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Wishlists policies
-- Users can view their own wishlists
CREATE POLICY "Users can view own wishlists"
ON public.wishlists FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can view public wishlists or wishlists shared with them
CREATE POLICY "Anyone can view public wishlists"
ON public.wishlists FOR SELECT
TO public
USING (is_public = true OR share_token IS NOT NULL);

-- Users can create their own wishlists
CREATE POLICY "Users can create own wishlists"
ON public.wishlists FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wishlists
CREATE POLICY "Users can update own wishlists"
ON public.wishlists FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlists
CREATE POLICY "Users can delete own wishlists"
ON public.wishlists FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Wishlist Items policies
-- Users can view items in their own wishlists
CREATE POLICY "Users can view own wishlist items"
ON public.wishlist_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

-- Anyone can view items in public wishlists
CREATE POLICY "Anyone can view public wishlist items"
ON public.wishlist_items FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND (wishlists.is_public = true OR wishlists.share_token IS NOT NULL)
  )
);

-- Users can add items to their own wishlists
CREATE POLICY "Users can add items to own wishlists"
ON public.wishlist_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

-- Users can update items in their own wishlists
CREATE POLICY "Users can update own wishlist items"
ON public.wishlist_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

-- Users can delete items from their own wishlists
CREATE POLICY "Users can delete own wishlist items"
ON public.wishlist_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

-- 7. Helper Views

-- View to get wishlist with item count
CREATE OR REPLACE VIEW wishlist_summary AS
SELECT 
  w.id,
  w.user_id,
  w.name,
  w.description,
  w.is_public,
  w.share_token,
  w.created_at,
  w.updated_at,
  COUNT(wi.id) as item_count
FROM public.wishlists w
LEFT JOIN public.wishlist_items wi ON w.id = wi.wishlist_id
GROUP BY w.id;

-- View to get popular destinations in wishlists
CREATE OR REPLACE VIEW popular_wishlist_destinations AS
SELECT 
  d.id,
  d.name,
  d.city,
  d.province,
  d.image,
  d.type,
  d.rating,
  COUNT(wi.id) as wishlist_count
FROM public.destinations d
INNER JOIN public.wishlist_items wi ON d.id = wi.destination_id
GROUP BY d.id
ORDER BY wishlist_count DESC;

-- 8. Sample data / Default wishlist creation trigger

-- Function to create default wishlist for new users
CREATE OR REPLACE FUNCTION create_default_wishlist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wishlists (user_id, name, description)
  VALUES (
    NEW.id,
    'My Wishlist',
    'Places I want to visit'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create wishlist when profile is created
CREATE TRIGGER trigger_create_default_wishlist
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_wishlist();

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT SELECT ON public.wishlists TO anon;
GRANT SELECT ON public.wishlist_items TO anon;
GRANT SELECT ON wishlist_summary TO authenticated, anon;
GRANT SELECT ON popular_wishlist_destinations TO authenticated, anon;

-- =====================================================
-- Verification queries
-- =====================================================

-- Check tables created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('wishlists', 'wishlist_items');

-- Check policies
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('wishlists', 'wishlist_items');

-- Check indexes
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('wishlists', 'wishlist_items');
