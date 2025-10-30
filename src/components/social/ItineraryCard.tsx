import { MapPin, Calendar, DollarSign, Clock, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TripPlan } from "@/services/socialSharing";

interface ItineraryCardProps {
  tripPlan: TripPlan;
  cardId?: string;
}

const ItineraryCard = ({ tripPlan, cardId = "itinerary-card" }: ItineraryCardProps) => {
  const { destinations, totalDistance, totalDuration, totalCost, startDate } = tripPlan;

  return (
    <div id={cardId} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 max-w-2xl mx-auto">
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                🗺️ Rencana Wisata Budaya
              </h2>
              {startDate && (
                <div className="flex items-center text-white/90 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(startDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-xs text-white/80">Total Destinasi</div>
              <div className="text-2xl font-bold">{destinations.length}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Destinations List */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Destinasi
            </h3>
            <div className="space-y-3">
              {destinations.map((dest, index) => (
                <div
                  key={dest.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200"
                >
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Destination Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Destination Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{dest.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {dest.location.city}, {dest.location.province}
                    </p>
                    <p className="text-xs text-primary font-medium mt-1">
                      Rp {dest.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">Jarak</div>
              <div className="font-bold text-sm">{totalDistance.toFixed(1)} km</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">Durasi</div>
              <div className="font-bold text-sm">{Math.round(totalDuration)} min</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">Biaya</div>
              <div className="font-bold text-sm">Rp {(totalCost / 1000).toFixed(0)}k</div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Direncanakan dengan
            </p>
            <p className="text-sm font-bold text-primary">
              TravoMate 🇮🇩
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Aplikasi Wisata Budaya Indonesia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItineraryCard;
