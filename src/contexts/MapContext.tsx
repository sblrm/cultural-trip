
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapContextType {
  userLocation: Coordinates | null;
  isLocating: boolean;
  hasLocationPermission: boolean;
  locateUser: () => Promise<void>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
};

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

  // Check for permission on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          setHasLocationPermission(permissionStatus.state === "granted");
          
          permissionStatus.onchange = () => {
            setHasLocationPermission(permissionStatus.state === "granted");
          };
        });
    }
  }, []);

  const locateUser = async (): Promise<void> => {
    if (!navigator.geolocation) {
      toast.error("Geolokasi tidak didukung di browser ini");
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      setHasLocationPermission(true);
    } catch (error) {
      let message = "Gagal mendapatkan lokasi Anda";
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          message = "Akses lokasi ditolak, silakan izinkan di pengaturan browser Anda";
          setHasLocationPermission(false);
        } else if (error.code === error.TIMEOUT) {
          message = "Waktu permintaan lokasi habis";
        }
      }
      toast.error(message);
    } finally {
      setIsLocating(false);
    }
  };

  const value = {
    userLocation,
    isLocating,
    hasLocationPermission,
    locateUser
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
