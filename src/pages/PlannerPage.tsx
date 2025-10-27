
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDestinations } from "@/contexts/DestinationsContext";
import { useMap } from "@/contexts/MapContext";
import { findOptimalRoute, Route as TravelRoute, OptimizationMode } from "@/services/routePlanner";
import PlannerSettingsCard from "@/components/planner/PlannerSettingsCard";
import PlannedRouteCard from "@/components/planner/PlannedRouteCard";
import ChatSidebar from "@/components/planner/ChatSidebar";
import EmptyRouteState from "@/components/planner/EmptyRouteState";

const PlannerPage = () => {
  const { destinations, loading } = useDestinations();
  const { userLocation, locateUser, isLocating, hasLocationPermission } = useMap();
  
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [maxDestinations, setMaxDestinations] = useState<number>(3);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('balanced');
  const [plannedRoute, setPlannedRoute] = useState<TravelRoute | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  
  const [landmarks, setLandmarks] = useState<Array<{id: number, name: string, location: [number, number], type: string}>>([]);
  
  useEffect(() => {
    if (userLocation) {
      setCurrentPosition([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);
  
  useEffect(() => {
    if (destinations.length > 0) {
      const mapLandmarks = destinations.slice(0, 10).map(dest => ({
        id: dest.id,
        name: dest.name,
        location: [dest.coordinates.latitude, dest.coordinates.longitude] as [number, number],
        type: dest.type || 'Destinasi Budaya'
      }));
      setLandmarks(mapLandmarks);
    }
  }, [destinations]);

  const handleProvinceChange = (province: string) => {
    if (selectedProvinces.includes(province)) {
      setSelectedProvinces(selectedProvinces.filter(p => p !== province));
    } else {
      setSelectedProvinces([...selectedProvinces, province]);
    }
  };

  const handlePlanRoute = async () => {
    if (!userLocation) {
      toast.error("Mohon aktifkan lokasi Anda terlebih dahulu");
      return;
    }
    
    setIsPlanning(true);
    
    try {
      let filteredDestinations = [...destinations];
      if (selectedProvinces.length > 0) {
        filteredDestinations = destinations.filter(dest => 
          selectedProvinces.includes(dest.location.province)
        );
      }
      
      if (filteredDestinations.length === 0) {
        toast.error("Tidak ada destinasi yang dipilih");
        setIsPlanning(false);
        return;
      }
      
      // Show loading toast with real-time data info
      toast.loading("Menghitung rute optimal dengan data real-time...");
      
      const route = await findOptimalRoute(
        userLocation.latitude,
        userLocation.longitude,
        filteredDestinations,
        maxDestinations,
        optimizationMode,
        new Date() // Use current time for dynamic pricing
      );
      
      setPlannedRoute(route);
      
      // Show success message with optimization mode and data source
      const modeText = optimizationMode === 'fastest' ? 'tercepat' : 
                       optimizationMode === 'cheapest' ? 'terhemat' : 'seimbang';
      const dataSourceText = route.dataSource === 'ors' ? 'real-time' : 'estimasi';
      
      toast.dismiss(); // Dismiss loading toast
      toast.success(
        `Rute ${modeText} telah dibuat dengan A* Algorithm!\n` +
        `Menggunakan data ${dataSourceText} dari ${route.dataSource === 'ors' ? 'OpenRouteService' : 'Haversine formula'}`
      );
    } catch (error) {
      toast.dismiss();
      toast.error("Gagal merencanakan rute: " + error.message);
    } finally {
      setIsPlanning(false);
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    locateUser();
    toast.success('Pelacakan lokasi dimulai');
  };
  
  const stopTracking = () => {
    setIsTracking(false);
    toast.info('Pelacakan lokasi dihentikan');
  };

  return (
    <div>
      {/* Header with Tumpak Sewu background image */}
      <section className="relative py-16 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="/culture-uploads/tumpaksewu.jpg" 
            alt="Tumpak Sewu" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Rencanakan Rute Wisata Budaya</h1>
            <p className="text-lg">
              Gunakan fitur AI kami untuk merencanakan rute wisata budaya yang optimal berdasarkan 
              lokasi Anda dengan estimasi biaya dan waktu yang akurat.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Route Planner Settings */}
            <div>
              <PlannerSettingsCard
                userLocation={userLocation}
                locateUser={locateUser}
                isLocating={isLocating}
                hasLocationPermission={hasLocationPermission}
                destinations={destinations}
                selectedProvinces={selectedProvinces}
                handleProvinceChange={handleProvinceChange}
                maxDestinations={maxDestinations}
                setMaxDestinations={setMaxDestinations}
                optimizationMode={optimizationMode}
                setOptimizationMode={setOptimizationMode}
                handlePlanRoute={handlePlanRoute}
                isPlanning={isPlanning}
                isTracking={isTracking}
                startTracking={startTracking}
                stopTracking={stopTracking}
                currentPosition={currentPosition}
                landmarks={landmarks}
              />
            </div>
            
            {/* Middle - Planned Route */}
            <div className="lg:col-span-2">
              {plannedRoute ? (
                <PlannedRouteCard route={plannedRoute} />
              ) : (
                <EmptyRouteState 
                  loading={loading} 
                  userLocation={userLocation} 
                  handlePlanRoute={handlePlanRoute} 
                />
              )}
            </div>

            {/* Right - Chat Sidebar */}
            <div className="lg:col-span-1">
              <ChatSidebar route={plannedRoute} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlannerPage;
