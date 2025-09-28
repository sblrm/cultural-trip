export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type TicketStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      destinations: {
        Row: {
          id: number
          name: string
          city: string
          province: string
          type: string
          latitude: number
          longitude: number
          hours: { open: string; close: string }
          duration: number
          description: string
          image: string
          price: number
          rating: number
          transportation: string[]
          created_at: string
          updated_at: string
          location: unknown // PostGIS geography type
        }
        Insert: Omit<Database['public']['Tables']['destinations']['Row'], 'id' | 'created_at' | 'updated_at' | 'location'>
        Update: Partial<Database['public']['Tables']['destinations']['Insert']>
      }
      plans: {
        Row: {
          id: number
          user_id: string
          name: string
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      plan_destinations: {
        Row: {
          id: number
          plan_id: number
          destination_id: number
          visit_date: string
          visit_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['plan_destinations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['plan_destinations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          gender?: string | null
          birthdate?: string | null
          city?: string | null
          mfa_enabled?: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      tickets: {
        Row: {
          id: number
          user_id: string
          destination_id: number
          quantity: number
          total_price: number
          visit_date: string
          booking_name: string
          booking_email: string
          booking_phone: string
          status: TicketStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          destination_id: number
          quantity: number
          total_price: number
          visit_date: string
          booking_name: string
          booking_email: string
          booking_phone: string
          status: TicketStatus
        }
        Update: {
          quantity?: number
          total_price?: number
          visit_date?: string
          booking_name?: string
          booking_email?: string
          booking_phone?: string
          status?: TicketStatus
        }
      }
      ,
      bookings: {
        Row: {
          id: number
          user_id: string
          destination_id: number
          booking_date: string
          quantity: number
          total_price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      ,
      purchases: {
        Row: {
          id: number
          user_id: string
          ticket_id: number | null
          amount: number
          payment_method: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>
      }
      ,
      refunds: {
        Row: {
          id: number
          user_id: string
          ticket_id: number | null
          reason: string | null
          status: string
          requested_at: string
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['refunds']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['refunds']['Insert']>
      }
      ,
      account_deletion_requests: {
        Row: {
          id: number
          user_id: string
          reason: string | null
          status: string
          requested_at: string
          processed_at: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: Omit<Database['public']['Tables']['account_deletion_requests']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['account_deletion_requests']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}