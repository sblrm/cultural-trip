
import { Link } from "react-router-dom";
import { Clock, Wallet, Map, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Route as TravelRoute } from "@/services/routePlanner";

interface PlannedRouteCardProps {
  route: TravelRoute;
}

const PlannedRouteCard = ({ route }: PlannedRouteCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rute Wisata Anda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center">
              <Clock className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm text-muted-foreground">Total Waktu Perjalanan</div>
              <div className="font-bold text-lg">
                {Math.floor(route.totalDuration / 60)} jam {route.totalDuration % 60} menit
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center">
              <Map className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm text-muted-foreground">Total Jarak</div>
              <div className="font-bold text-lg">
                {route.totalDistance.toFixed(1)} km
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center">
              <Wallet className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm text-muted-foreground">Estimasi Biaya Perjalanan</div>
              <div className="font-bold text-lg">
                Rp {route.totalCost.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          
          {/* Route Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detail Rute</h3>
            <div className="space-y-4">
              {route.nodes.map((node, index) => (
                <div key={node.destination.id} className="relative">
                  <div className="flex">
                    <div className="mr-4 relative flex flex-col items-center">
                      <div className="rounded-full w-8 h-8 bg-primary text-white flex items-center justify-center">
                        {index + 1}
                      </div>
                      {index < route.nodes.length - 1 && (
                        <div className="h-full border-l-2 border-dashed border-muted-foreground absolute top-8"></div>
                      )}
                    </div>
                    
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-1/4">
                            <img
                              src={node.destination.image}
                              alt={node.destination.name}
                              className="rounded-md w-full h-24 object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{node.destination.name}</h4>
                            <div className="flex items-center text-muted-foreground text-sm">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {node.destination.location.city}, {node.destination.location.province}
                              </span>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Jarak: </span>
                                {node.distance.toFixed(1)} km
                              </div>
                              <div>
                                <span className="text-muted-foreground">Waktu Tempuh: </span>
                                {Math.floor(node.duration / 60) > 0 ? `${Math.floor(node.duration / 60)} jam ` : ""}
                                {node.duration % 60} menit
                              </div>
                              <div>
                                <span className="text-muted-foreground">Biaya: </span>
                                Rp {node.cost.toLocaleString('id-ID')}
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <Link to={`/destinations/${node.destination.id}`}>
                                <Button variant="outline" size="sm">
                                  Detail <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Ticket Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Informasi Tiket</h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="font-medium mb-2">Estimasi Biaya Tiket Masuk:</div>
              <div className="space-y-2">
                {route.nodes.map((node) => (
                  <div key={node.destination.id} className="flex justify-between">
                    <span>{node.destination.name}</span>
                    <span>Rp {node.destination.price.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total Tiket Masuk:</span>
                <span>
                  Rp {route.nodes.reduce((sum, node) => sum + node.destination.price, 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Total Cost */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Estimasi Biaya:</span>
              <span>
                Rp {(
                  route.totalCost + 
                  route.nodes.reduce((sum, node) => sum + node.destination.price, 0)
                ).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              *Termasuk biaya perjalanan dan tiket masuk untuk 1 orang
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlannedRouteCard;
