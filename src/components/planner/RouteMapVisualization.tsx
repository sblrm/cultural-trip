import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Target } from 'lucide-react';
import type { Route as TravelRoute } from '@/services/routePlanner';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapVisualizationProps {
  route: TravelRoute;
  userLocation: { latitude: number; longitude: number } | null;
}

const RouteMapVisualization = ({ route, userLocation }: RouteMapVisualizationProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !route || !userLocation) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create custom icons
    const startIcon = L.divIcon({
      html: `
        <div style="
          background: #10b981; 
          color: white; 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: 14px;
        ">
          📍
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const destinationIcon = (index: number) => L.divIcon({
      html: `
        <div style="
          background: #3b82f6; 
          color: white; 
          width: 36px; 
          height: 36px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: 16px;
        ">
          ${index + 1}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Add starting point marker
    const startMarker = L.marker([userLocation.latitude, userLocation.longitude], { 
      icon: startIcon 
    }).addTo(map);
    
    startMarker.bindPopup(`
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #10b981; font-weight: bold;">📍 Titik Awal</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">Lokasi Anda saat ini</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #888;">
          Lat: ${userLocation.latitude.toFixed(6)}<br>
          Lng: ${userLocation.longitude.toFixed(6)}
        </p>
      </div>
    `);

    // Add destination markers
    const markers: L.Marker[] = [startMarker];
    const coordinates: [number, number][] = [[userLocation.latitude, userLocation.longitude]];

    route.nodes.forEach((node, index) => {
      const lat = node.destination.coordinates.latitude;
      const lng = node.destination.coordinates.longitude;
      
      coordinates.push([lat, lng]);
      
      const marker = L.marker([lat, lng], { 
        icon: destinationIcon(index) 
      }).addTo(map);
      
      marker.bindPopup(`
        <div style="min-width: 250px;">
          <h4 style="margin: 0 0 8px 0; color: #3b82f6; font-weight: bold;">
            ${index + 1}. ${node.destination.name}
          </h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            📍 ${node.destination.location.city}, ${node.destination.location.province}
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
            <div>
              <strong>Jarak:</strong><br>
              ${node.distance.toFixed(1)} km
            </div>
            <div>
              <strong>Waktu:</strong><br>
              ${Math.floor(node.duration / 60)}j ${Math.round(node.duration % 60)}m
            </div>
            <div>
              <strong>Biaya Perjalanan:</strong><br>
              Rp ${node.cost.toLocaleString('id-ID')}
            </div>
            <div>
              <strong>Tiket Masuk:</strong><br>
              Rp ${node.destination.price.toLocaleString('id-ID')}
            </div>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <strong style="color: #3b82f6;">Total: Rp ${(node.cost + node.destination.price).toLocaleString('id-ID')}</strong>
          </div>
        </div>
      `);
      
      markers.push(marker);
    });

    // Draw route polyline
    const polyline = L.polyline(coordinates, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 5',
    }).addTo(map);

    // Add distance labels on segments
    for (let i = 1; i < coordinates.length; i++) {
      const start = coordinates[i - 1];
      const end = coordinates[i];
      const midpoint: [number, number] = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
      ];
      
      const distance = route.nodes[i - 1].distance;
      const duration = route.nodes[i - 1].duration;
      
      const label = L.divIcon({
        html: `
          <div style="
            background: rgba(59, 130, 246, 0.9); 
            color: white; 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            ${distance.toFixed(1)} km • ${Math.floor(duration / 60)}j ${Math.round(duration % 60)}m
          </div>
        `,
        className: 'route-label',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      
      L.marker(midpoint, { icon: label }).addTo(map);
    }

    // Fit map to show all markers with padding
    const group = new L.FeatureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route, userLocation]);

  if (!route || !userLocation) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Belum ada rute yang direncanakan. Silakan rencanakan rute terlebih dahulu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Visualisasi Rute Perjalanan
          <Badge variant="secondary" className="ml-auto">
            {route.nodes.length} destinasi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="h-96 w-full rounded-b-lg"
          style={{ minHeight: '400px' }}
        />
        
        {/* Legend */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                <span>Titik Awal (Lokasi Anda)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">1</div>
                <span>Destinasi Wisata</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-blue-500" style={{ borderStyle: 'dashed' }}></div>
                <span>Rute Perjalanan</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Total: {route.totalDistance.toFixed(1)} km</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteMapVisualization;