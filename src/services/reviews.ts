import { supabase } from '@/lib/supabase';
import type { Review, ReviewWithProfile, DestinationRating, CreateReviewInput, UpdateReviewInput } from '@/types/review';

/**
 * Fetch all reviews for a specific destination with user profiles
 */
export async function getDestinationReviews(destinationId: number): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('destination_id', destinationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReviewWithProfile[];
}

/**
 * Get rating summary for a destination
 */
export async function getDestinationRating(destinationId: number): Promise<DestinationRating | null> {
  const { data, error } = await supabase
    .from('destination_ratings')
    .select('*')
    .eq('destination_id', destinationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return data as DestinationRating;
}

/**
 * Get ratings for multiple destinations (for list pages)
 */
export async function getDestinationRatings(destinationIds: number[]): Promise<Map<number, DestinationRating>> {
  if (destinationIds.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from('destination_ratings')
    .select('*')
    .in('destination_id', destinationIds);

  if (error) throw error;
  
  const ratingsMap = new Map<number, DestinationRating>();
  (data as DestinationRating[]).forEach(rating => {
    ratingsMap.set(rating.destination_id, rating);
  });
  
  return ratingsMap;
}

/**
 * Check if current user has reviewed a destination
 */
export async function getUserReview(destinationId: number, userId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('destination_id', destinationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No review found
    throw error;
  }
  return data as Review;
}

/**
 * Create a new review
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated to create a review');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      destination_id: input.destination_id,
      user_id: user.id,
      rating: input.rating,
      comment: input.comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Update an existing review
 */
export async function updateReview(reviewId: number, input: UpdateReviewInput): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      rating: input.rating,
      comment: input.comment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: number): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

/**
 * Get user's all reviews
 */
export async function getUserReviews(userId: string): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReviewWithProfile[];
}
