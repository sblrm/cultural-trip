import { createClient } from '@supabase/supabase-js';

export interface Destination {
  id: number;
  name: string;
  city: string;
  province: string;
  type: string;
  latitude: number;
  longitude: number;
  hours: { open: string; close: string };
  duration: number;
  description: string;
  image: string;
  price: number;
  rating: number;
  transportation: string[];
  created_at: string;
  updated_at: string;
  location: unknown;
}

export interface Plan {
  id: number;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface PlanDestination {
  id: number;
  plan_id: number;
  destination_id: number;
  visit_date: string;
  visit_order: number;
  created_at: string;
  updated_at: string;
  destination?: Destination;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type TicketStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Ticket {
  id: number;
  user_id: string;
  destination_id: number;
  quantity: number;
  total_price: number;
  visit_date: string;
  booking_name: string;
  booking_email: string;
  booking_phone: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  destinations?: Destination;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('destinations').select('count').single();
    if (error) throw error;
    console.log('Successfully connected to Supabase!');
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return false;
  }
};

export const getDestinations = async () => {
  const { data, error } = await supabase
    .from('destinations')
    .select('*');
  
  if (error) throw error;
  return data;
};

export const getDestinationById = async (id: number) => {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createPlan = async (userId: string, name: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('plans')
    .insert([
      { user_id: userId, name, start_date: startDate, end_date: endDate }
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserPlans = async (userId: string) => {
  const { data, error } = await supabase
    .from('plans')
    .select(`
      *,
      plan_destinations (
        *,
        destination: destinations (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addDestinationToPlan = async (
  planId: number,
  destinationId: number,
  visitDate: Date,
  visitOrder: number
) => {
  const { data, error } = await supabase
    .from('plan_destinations')
    .insert([
      {
        plan_id: planId,
        destination_id: destinationId,
        visit_date: visitDate,
        visit_order: visitOrder
      }
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createTicket = async ({
  userId,
  destinationId,
  quantity,
  totalPrice,
  visitDate,
  bookingName,
  bookingEmail,
  bookingPhone,
  status = 'confirmed' as const
}: {
  userId: string;
  destinationId: number;
  quantity: number;
  totalPrice: number;
  visitDate: string;
  bookingName: string;
  bookingEmail: string;
  bookingPhone: string;
  status?: TicketStatus;
}) => {
  console.log('Creating ticket with data:', {
    userId,
    destinationId,
    quantity,
    totalPrice,
    visitDate,
    bookingName,
    bookingEmail,
    bookingPhone,
    status
  });

  const insertData = {
    user_id: userId,
    destination_id: destinationId,
    quantity,
    total_price: totalPrice,
    visit_date: visitDate,
    booking_name: bookingName,
    booking_email: bookingEmail,
    booking_phone: bookingPhone,
    status
  } as Partial<Ticket>;

  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert(insertData)
      .select(`
        *,
        destinations:destinations (*)
      `)
      .single();

    if (error) {
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from insert');
    }

    console.log('Ticket created successfully:', data);
    return data;
  } catch (error) {
    console.error('Ticket creation failed:', error);
    throw error;
  }
};

// New helpers for Profile pages
export const getUserBookings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      destinations:destinations (
        id,
        name,
        city,
        province,
        image
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getUserPurchases = async (userId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      tickets:tickets (
        id,
        quantity,
        total_price,
        visit_date,
        status,
        destinations:destinations (
          id,
          name,
          city,
          province,
          image
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getUserRefunds = async (userId: string) => {
  const { data, error } = await supabase
    .from('refunds')
    .select(`
      *,
      tickets:tickets (
        id,
        visit_date,
        status,
        destinations:destinations (
          id,
          name,
          city,
          province,
          image
        )
      )
    `)
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createRefund = async (
  userId: string,
  ticketId: number,
  reason: string
) => {
  const { data, error } = await supabase
    .from('refunds')
    .insert({ user_id: userId, ticket_id: ticketId, reason })
    .select(`
      *,
      tickets:tickets (
        id,
        destinations:destinations (id, name, city, province, image)
      )
    `)
    .single();
  if (error) throw error;
  return data;
};