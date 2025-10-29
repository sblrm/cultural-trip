/**
 * Wishlist Service
 * Handles wishlist/favorites operations for destinations
 */

import { supabase } from '@/lib/supabase';

export interface Wishlist {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface WishlistItem {
  id: number;
  wishlist_id: number;
  destination_id: number;
  notes: string | null;
  priority: number;
  added_at: string;
  destination?: any; // Will be populated with join
}

export interface CreateWishlistInput {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface AddItemInput {
  wishlist_id: number;
  destination_id: number;
  notes?: string;
  priority?: number;
}

/**
 * Get all wishlists for current user
 */
export async function getUserWishlists(): Promise<Wishlist[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      wishlist_items(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform count to item_count
  return (data || []).map(wishlist => ({
    ...wishlist,
    item_count: wishlist.wishlist_items?.[0]?.count || 0,
    wishlist_items: undefined
  }));
}

/**
 * Get single wishlist with items
 */
export async function getWishlist(wishlistId: number) {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      wishlist_items (
        *,
        destination:destinations (*)
      )
    `)
    .eq('id', wishlistId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get wishlist by share token (public access)
 */
export async function getWishlistByShareToken(token: string) {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      wishlist_items (
        *,
        destination:destinations (*)
      )
    `)
    .eq('share_token', token)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new wishlist
 */
export async function createWishlist(input: CreateWishlistInput): Promise<Wishlist> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('wishlists')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      is_public: input.is_public || false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update wishlist
 */
export async function updateWishlist(
  wishlistId: number,
  updates: Partial<CreateWishlistInput>
) {
  const { data, error } = await supabase
    .from('wishlists')
    .update(updates)
    .eq('id', wishlistId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete wishlist
 */
export async function deleteWishlist(wishlistId: number) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('id', wishlistId);

  if (error) throw error;
  return true;
}

/**
 * Generate share token for wishlist
 */
export async function generateShareToken(wishlistId: number): Promise<string> {
  // Call SQL function to generate token
  const { data, error } = await supabase.rpc('generate_share_token');
  
  if (error) throw error;
  
  const token = data;

  // Update wishlist with token
  const { error: updateError } = await supabase
    .from('wishlists')
    .update({ share_token: token, is_public: true })
    .eq('id', wishlistId);

  if (updateError) throw updateError;

  return token;
}

/**
 * Remove share token (make private)
 */
export async function removeShareToken(wishlistId: number) {
  const { error } = await supabase
    .from('wishlists')
    .update({ share_token: null, is_public: false })
    .eq('id', wishlistId);

  if (error) throw error;
  return true;
}

/**
 * Add destination to wishlist
 */
export async function addToWishlist(input: AddItemInput): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: input.wishlist_id,
      destination_id: input.destination_id,
      notes: input.notes || null,
      priority: input.priority || 0
    })
    .select(`
      *,
      destination:destinations (*)
    `)
    .single();

  if (error) {
    // Handle duplicate entry error
    if (error.code === '23505') {
      throw new Error('Destinasi sudah ada di wishlist ini');
    }
    throw error;
  }

  return data;
}

/**
 * Quick add to default wishlist
 */
export async function quickAddToWishlist(destinationId: number) {
  // Get user's first wishlist (default)
  const wishlists = await getUserWishlists();
  
  if (wishlists.length === 0) {
    throw new Error('Tidak ada wishlist. Silakan buat wishlist terlebih dahulu.');
  }

  const defaultWishlist = wishlists[0];

  return addToWishlist({
    wishlist_id: defaultWishlist.id,
    destination_id: destinationId
  });
}

/**
 * Remove destination from wishlist
 */
export async function removeFromWishlist(wishlistId: number, destinationId: number) {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlistId)
    .eq('destination_id', destinationId);

  if (error) throw error;
  return true;
}

/**
 * Update wishlist item
 */
export async function updateWishlistItem(
  itemId: number,
  updates: { notes?: string; priority?: number }
) {
  const { data, error } = await supabase
    .from('wishlist_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if destination is in any user's wishlist
 */
export async function isInWishlist(destinationId: number): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // First get user's wishlist IDs
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id);

  if (!wishlists || wishlists.length === 0) return false;

  const wishlistIds = wishlists.map(w => w.id);

  // Then check if destination is in any of those wishlists
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('destination_id', destinationId)
    .in('wishlist_id', wishlistIds)
    .limit(1);

  if (error) return false;
  return (data?.length || 0) > 0;
}

/**
 * Get wishlist items for a destination (which wishlists contain this destination)
 */
export async function getWishlistsForDestination(destinationId: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First get user's wishlist IDs
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id);

  if (!wishlists || wishlists.length === 0) return [];

  const wishlistIds = wishlists.map(w => w.id);

  // Then get items for those wishlists
  const { data, error } = await supabase
    .from('wishlist_items')
    .select(`
      *,
      wishlist:wishlists (*)
    `)
    .eq('destination_id', destinationId)
    .in('wishlist_id', wishlistIds);

  if (error) throw error;
  return data;
}

/**
 * Get popular destinations in wishlists
 */
export async function getPopularWishlistDestinations(limit: number = 10) {
  const { data, error } = await supabase
    .from('popular_wishlist_destinations')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get share URL for wishlist
 */
export function getShareUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/wishlist/shared/${token}`;
}
