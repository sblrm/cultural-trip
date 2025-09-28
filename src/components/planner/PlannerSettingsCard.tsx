
import { useState, useEffect } from "react";
import { LocateFixed, Map, Locate, Target, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Destination } from "@/contexts/DestinationsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlannerSettingsCardProps {
  userLocation: { latitude: number; longitude: number } | null;
  locateUser: () => Promise<void>;
  isLocating: boolean;
  hasLocationPermission: boolean;
  destinations: Destination[];
  selectedProvinces: string[];
  handleProvinceChange: (province: string) => void;
  maxDestinations: number;
  setMaxDestinations: (value: number) => void;
  handlePlanRoute: () => void;
  isPlanning: boolean;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  currentPosition: [number, number] | null;
  landmarks: Array<{id: number, name: string, location: [number, number], type: string}>;
}

const PlannerSettingsCard = ({
  userLocation,
  locateUser,
  isLocating,
  hasLocationPermission,
  destinations,
  selectedProvinces,
  handleProvinceChange,
  maxDestinations,
  setMaxDestinations,
  handlePlanRoute,
  isPlanning,
  isTracking,
  startTracking,
  stopTracking,
  currentPosition,
  landmarks
}: PlannerSettingsCardProps) => {
  const [ClientOnlyMap, setClientOnlyMap] = useState<React.ComponentType<any> | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  const provinces = destinations.length > 0
    ? [...new Set(destinations.map(dest => dest.location.province))].sort()
    : [];
    
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.toast = toast;
    }
  }, []);
  
  useEffect(() => {
    import('@/components/map/ClientOnlyMap')
      .then(module => {
        setClientOnlyMap(() => module.default);
        setIsMapLoading(false);
      })
      .catch(error => {
        console.error('Error loading map component:', error);
        toast.error('Terjadi kesalahan saat memuat peta');
        setIsMapLoading(false);
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Map className="mr-2 h-5 w-5" />
          Pengaturan Rute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Setting */}
        <div>
          <h3 className="font-medium mb-2">Lokasi Anda</h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={locateUser}
              disabled={isLocating}
              className="w-full"
            >
              <LocateFixed className="mr-2 h-4 w-4" />
              {isLocating 
                ? "Mencari lokasi..." 
                : userLocation 
                  ? "Perbarui Lokasi" 
                  : "Dapatkan Lokasi"
              }
            </Button>
          </div>
          
          {userLocation && (
            <div className="mt-2 text-sm text-muted-foreground">
              Lokasi terdeteksi: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </div>
          )}
          
          {!hasLocationPermission && !userLocation && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Akses Lokasi Ditolak</AlertTitle>
              <AlertDescription>
                Izinkan akses lokasi di pengaturan browser Anda untuk menggunakan fitur ini.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Map Section */}
        <div className="mt-4">
          <h3 className="font-medium mb-2">Peta Lokasi</h3>
          <div className="h-[200px] bg-gray-100 rounded-lg overflow-hidden mb-2">
            {currentPosition && ClientOnlyMap ? (
              <ClientOnlyMap
                userLocation={currentPosition}
                setUserLocation={(pos) => {
                  if (userLocation) {
                    locateUser();
                  }
                }}
                landmarks={landmarks}
                isTracking={isTracking}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Memuat peta...</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isTracking ? (
              <Button size="sm" onClick={startTracking} className="w-full">
                <Locate className="mr-2 h-4 w-4" />
                Pelacakan Real-time
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={stopTracking} className="w-full">
                <Target className="mr-2 h-4 w-4" />
                Hentikan Pelacakan
              </Button>
            )}
          </div>
        </div>
        
        {/* Province Selection */}
        <div>
          <h3 className="font-medium mb-2">Provinsi Tujuan</h3>
          <div className="grid grid-cols-2 gap-2">
            {provinces.map((province) => (
              <div key={province} className="flex items-center">
                <input
                  type="checkbox"
                  id={`province-${province}`}
                  checked={selectedProvinces.includes(province)}
                  onChange={() => handleProvinceChange(province)}
                  className="mr-2"
                />
                <label htmlFor={`province-${province}`} className="text-sm">
                  {province}
                </label>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            *Jika tidak ada yang dipilih, semua provinsi akan dipertimbangkan.
          </div>
        </div>
        
        {/* Max Destinations */}
        <div>
          <h3 className="font-medium mb-2">Jumlah Destinasi</h3>
          <Select 
            value={maxDestinations.toString()} 
            onValueChange={(value) => setMaxDestinations(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jumlah destinasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Destinasi</SelectItem>
              <SelectItem value="2">2 Destinasi</SelectItem>
              <SelectItem value="3">3 Destinasi</SelectItem>
              <SelectItem value="4">4 Destinasi</SelectItem>
              <SelectItem value="5">5 Destinasi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Plan Button */}
        <Button
          className="w-full mt-4"
          onClick={handlePlanRoute}
          disabled={isPlanning || !destinations.length}
        >
          {isPlanning ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Merencanakan Rute...
            </>
          ) : (
            <>
              <Map className="mr-2 h-4 w-4" />
              Rencanakan Rute
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlannerSettingsCard;
