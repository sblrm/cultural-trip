export interface Destination {
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
  location: unknown
}

export interface Plan {
  id: number
  user_id: string
  name: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface PlanDestination {
  id: number
  plan_id: number
  destination_id: number
  visit_date: string
  visit_order: number
  created_at: string
  updated_at: string
  destination?: Destination
}

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type TicketStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Ticket {
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
  destinations?: Destination
}

export interface Database {
  public: {
    Tables: {
      destinations: {
        Row: Destination
        Insert: Omit<Destination, 'id' | 'created_at' | 'updated_at' | 'location'>
        Update: Partial<Omit<Destination, 'id' | 'created_at' | 'updated_at' | 'location'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>
      }
      plan_destinations: {
        Row: PlanDestination
        Insert: Omit<PlanDestination, 'id' | 'created_at' | 'updated_at' | 'destination'>
        Update: Partial<Omit<PlanDestination, 'id' | 'created_at' | 'updated_at' | 'destination'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'destinations'>
        Update: Partial<Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'destinations'>>
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