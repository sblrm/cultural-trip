
import { Navigation, LocateFixed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface EmptyRouteStateProps {
  loading: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  handlePlanRoute: () => void;
}

const EmptyRouteState = ({ loading, userLocation, handlePlanRoute }: EmptyRouteStateProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted rounded-lg p-8">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Navigation className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t('planner.title')}</h3>
      <p className="text-center text-muted-foreground mb-6">
        {t('planner.subtitle')}
      </p>
      {loading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      ) : (
        <Button onClick={handlePlanRoute} disabled={!userLocation}>
          <LocateFixed className="mr-2 h-4 w-4" />
          {userLocation ? t('planner.planRoute') : t('planner.startPoint')}
        </Button>
      )}
    </div>
  );
};

export default EmptyRouteState;
