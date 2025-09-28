import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type DestinationRow = Database['public']['Tables']['destinations']['Row'];
export interface Destination {
  id: number;
  name: string;
  location: {
    city: string;
    province: string;
  };
  type: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  hours: {
    open: string;
    close: string;
  };
  duration: number;
  description: string;
  image: string;
  price: number;
  rating: number;
  transportation: string[];
}

interface DestinationsContextType {
  destinations: Destination[];
  loading: boolean;
  error: string | null;
  getDestinationById: (id: number) => Destination | undefined;
}

const DestinationsContext = createContext<DestinationsContextType | undefined>(undefined);

export const useDestinations = () => {
  const context = useContext(DestinationsContext);
  if (context === undefined) {
    throw new Error("useDestinations must be used within a DestinationsProvider");
  }
  return context;
};

export const DestinationsProvider = ({ children }: { children: ReactNode }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('destinations')
          .select('*')
          .order('id');
        
        if (error) throw error;

        const formattedData = data.map((dest: DestinationRow) => ({
          id: dest.id,
          name: dest.name,
          location: {
            city: dest.city,
            province: dest.province
          },
          type: dest.type,
          coordinates: {
            latitude: dest.latitude,
            longitude: dest.longitude
          },
          hours: dest.hours,
          duration: dest.duration,
          description: dest.description,
          image: dest.image,
          price: dest.price,
          rating: dest.rating,
          transportation: dest.transportation
        }));

        setDestinations(formattedData);
        setLoading(false);
      } catch (err) {
        setError("Gagal memuat data destinasi");
        setLoading(false);
        toast.error("Gagal memuat data destinasi");
        console.error('Error fetching destinations:', err);
      }
    };

    fetchDestinations();
  }, []);

  const getDestinationById = (id: number) => {
    return destinations.find(dest => dest.id === id);
  };

  const value = {
    destinations,
    loading,
    error,
    getDestinationById
  };

  return <DestinationsContext.Provider value={value}>{children}</DestinationsContext.Provider>;
};