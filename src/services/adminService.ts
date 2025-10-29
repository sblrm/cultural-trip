/**
 * Admin Service
 * Handles admin-only operations for managing destinations
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type DestinationInsert = Database['public']['Tables']['destinations']['Insert'];
type DestinationUpdate = Database['public']['Tables']['destinations']['Update'];

export interface CreateDestinationInput {
  name: string;
  city: string;
  province: string;
  type: string;
  latitude: number;
  longitude: number;
  hours: {
    open: string;
    close: string;
  };
  duration: number;
  description: string;
  image: string;
  price: number;
  transportation: string[];
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    
    return data?.role === 'admin' || data?.role === 'superadmin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get all destinations for admin management
 */
export async function getAllDestinationsAdmin() {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Create a new destination (admin only)
 */
export async function createDestination(input: CreateDestinationInput) {
  const destinationData: DestinationInsert = {
    name: input.name,
    city: input.city,
    province: input.province,
    type: input.type,
    latitude: input.latitude,
    longitude: input.longitude,
    hours: input.hours,
    duration: input.duration,
    description: input.description,
    image: input.image,
    price: input.price,
    rating: 0, // Always start with 0, will be calculated from reviews
    transportation: input.transportation,
  };

  const { data, error } = await supabase
    .from('destinations')
    .insert([destinationData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing destination (admin only)
 */
export async function updateDestination(id: number, input: Partial<CreateDestinationInput>) {
  const updateData: DestinationUpdate = {
    ...input,
  };

  const { data, error } = await supabase
    .from('destinations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a destination (admin only)
 */
export async function deleteDestination(id: number) {
  const { error } = await supabase
    .from('destinations')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Upload image to Supabase Storage
 * Uses 'destination-images' bucket (create if not exists)
 */
export async function uploadDestinationImage(file: File): Promise<string> {
  // Verify user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    throw new Error('Anda harus login untuk upload gambar. Silakan login terlebih dahulu.');
  }

  const bucketName = 'destination-images';
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`; // No subfolder, directly in bucket

  console.log('Uploading image:', { fileName, fileSize: file.size, fileType: file.type });

  // Try to upload to bucket
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    
    // Provide helpful error messages
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error(
        'Storage bucket belum dibuat. Silakan buat bucket "destination-images" di Supabase Dashboard → Storage dengan setting Public bucket.'
      );
    }
    
    if (uploadError.message.includes('No API key found') || uploadError.message.includes('apikey')) {
      throw new Error(
        'Authentication error. Silakan logout dan login kembali, lalu coba upload lagi.'
      );
    }
    
    if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
      throw new Error(
        'Storage policies belum configured. Silakan run migration: supabase/migrations/add_storage_policies.sql di Supabase SQL Editor.'
      );
    }
    
    throw uploadError;
  }

  // Get public URL
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  console.log('Upload successful:', data.publicUrl);
  return data.publicUrl;
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  const [destinationsCount, reviewsCount, bookingsCount] = await Promise.all([
    supabase.from('destinations').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalDestinations: destinationsCount.count || 0,
    totalReviews: reviewsCount.count || 0,
    totalBookings: bookingsCount.count || 0,
  };
}
