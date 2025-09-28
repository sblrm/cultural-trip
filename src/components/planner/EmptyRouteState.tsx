
import { Navigation, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyRouteStateProps {
  loading: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  handlePlanRoute: () => void;
}

const EmptyRouteState = ({ loading, userLocation, handlePlanRoute }: EmptyRouteStateProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted rounded-lg p-8">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Navigation className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Rencanakan Rute Wisata Anda</h3>
      <p className="text-center text-muted-foreground mb-6">
        Aktifkan lokasi Anda dan pilih preferensi untuk mendapatkan rute wisata budaya yang optimal.
      </p>
      {loading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      ) : (
        <Button onClick={handlePlanRoute} disabled={!userLocation}>
          <LocateFixed className="mr-2 h-4 w-4" />
          {userLocation ? "Rencanakan Rute" : "Aktifkan Lokasi Terlebih Dahulu"}
        </Button>
      )}
    </div>
  );
};

export default EmptyRouteState;
