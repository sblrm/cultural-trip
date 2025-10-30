
import { useState, useEffect } from "react";
import { LocateFixed, Map, Locate, Target, AlertCircle, Zap, DollarSign, Scale } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Destination } from "@/contexts/DestinationsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizationMode } from "@/services/routePlanner";
import { type TransportMode } from "@/services/dynamicPricing";
import TransportModeSelector from "./TransportModeSelector";

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
  optimizationMode: OptimizationMode;
  setOptimizationMode: (mode: OptimizationMode) => void;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
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
  optimizationMode,
  setOptimizationMode,
  transportMode,
  setTransportMode,
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
  const { t } = useTranslation();
  
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
          {t('planner.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Setting */}
        <div>
          <h3 className="font-medium mb-2">{t('planner.yourLocation')}</h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={locateUser}
              disabled={isLocating}
              className="w-full"
            >
              <LocateFixed className="mr-2 h-4 w-4" />
              {isLocating 
                ? t('common.loading')
                : userLocation 
                  ? t('planner.yourLocation')
                  : t('planner.startPoint')
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
          <h3 className="font-medium mb-2">{t('planner.selectDestinations')}</h3>
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
        </div>
        
        {/* Max Destinations */}
        <div>
          <h3 className="font-medium mb-2">{t('planner.selectedDestinations')}</h3>
          <Select 
            value={maxDestinations.toString()} 
            onValueChange={(value) => setMaxDestinations(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('planner.selectDestinations')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 {t('planner.destination')}</SelectItem>
              <SelectItem value="2">2 {t('planner.destination')}</SelectItem>
              <SelectItem value="3">3 {t('planner.destination')}</SelectItem>
              <SelectItem value="4">4 {t('planner.destination')}</SelectItem>
              <SelectItem value="5">5 {t('planner.destination')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Optimization Mode - NEW */}
        <div>
          <h3 className="font-medium mb-3">{t('planner.optimizationMode')}</h3>
          <RadioGroup value={optimizationMode} onValueChange={(value) => setOptimizationMode(value as OptimizationMode)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <RadioGroupItem value="fastest" id="fastest" className="mt-0.5" />
                <Label htmlFor="fastest" className="cursor-pointer flex-1">
                  <div className="flex items-center mb-1">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="font-semibold">{t('planner.fastest')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('home.features.smartPlannerDesc')}
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <RadioGroupItem value="cheapest" id="cheapest" className="mt-0.5" />
                <Label htmlFor="cheapest" className="cursor-pointer flex-1">
                  <div className="flex items-center mb-1">
                    <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                    <span className="font-semibold">{t('planner.cheapest')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('home.features.realTimeDesc')}
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <RadioGroupItem value="balanced" id="balanced" className="mt-0.5" />
                <Label htmlFor="balanced" className="cursor-pointer flex-1">
                  <div className="flex items-center mb-1">
                    <Scale className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-semibold">{t('planner.balanced')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('home.features.aiPoweredDesc')}
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>A* Algorithm:</strong> Sistem menggunakan algoritma A* dengan heuristic function untuk menemukan rute optimal berdasarkan mode yang dipilih.
            </p>
          </div>
        </div>

        {/* Transport Mode Selector - NEW */}
        <div>
          <TransportModeSelector
            selectedMode={transportMode}
            onModeChange={setTransportMode}
          />
        </div>
        
        {/* Plan Route Button */}
        <Button
          className="w-full mt-4"
          onClick={handlePlanRoute}
          disabled={isPlanning || !destinations.length}
        >
          {isPlanning ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              {t('common.loading')}
            </>
          ) : (
            <>
              <Map className="mr-2 h-4 w-4" />
              {t('planner.planRoute')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlannerSettingsCard;
