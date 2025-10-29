import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Target, Loader2, Wifi, WifiOff } from 'lucide-react';
import type { Route as TravelRoute } from '@/services/routePlanner';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Decode Google Polyline Algorithm
 * Used by OpenRouteService for compact geometry representation
 */
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }

  return poly;
}

interface RouteMapVisualizationProps {
  route: TravelRoute;
  userLocation: { latitude: number; longitude: number } | null;
}

const RouteMapVisualization = ({ route, userLocation }: RouteMapVisualizationProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [routeDataSource, setRouteDataSource] = useState<'real' | 'fallback'>('real');

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

    // Draw actual road routes between points
    const drawRealRoutes = async () => {
      console.log('🗺️ Starting to draw routes for', coordinates.length - 1, 'segments');
      setIsLoadingRoutes(true);
      let hasRealRoutes = false;
      
      try {
        for (let i = 0; i < coordinates.length - 1; i++) {
          const start = coordinates[i];
          const end = coordinates[i + 1];
          
          console.log(`📍 Drawing route ${i + 1}: [${start}] → [${end}]`);
          
          // Try to get real route from OpenRouteService
          try {
            const requestBody = {
              endpoint: 'directions',
              coordinates: [
                [start[1], start[0]], // ORS uses [lng, lat]
                [end[1], end[0]]
              ],
              profile: 'driving-car'
            };
            
            console.log('📤 Sending request to ORS:', requestBody);
            
            const response = await fetch('/api/openroute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });

            console.log('📥 ORS Response status:', response.status);

            if (response.ok) {
              const data = await response.json();
              console.log('✅ ORS Response data:', data);
              
              // Check different possible response formats
              let routeCoords: [number, number][] | null = null;
              
              // Format 1: Encoded polyline (ORS v2 default)
              if (data.routes && data.routes[0]?.geometry && typeof data.routes[0].geometry === 'string') {
                const encodedPolyline = data.routes[0].geometry;
                console.log('📍 Using encoded polyline format, decoding...');
                routeCoords = decodePolyline(encodedPolyline);
                console.log(`🛣️ Decoded ${routeCoords.length} coordinates from polyline`);
              }
              // Format 2: GeoJSON with features (v1 API or geojson format)
              else if (data.features && data.features[0]?.geometry?.coordinates) {
                routeCoords = data.features[0].geometry.coordinates.map(
                  (coord: [number, number]) => [coord[1], coord[0]] // Convert [lng,lat] to [lat,lng]
                );
                console.log('📍 Using GeoJSON features format');
              }
              // Format 3: routes array with coordinate array
              else if (data.routes && data.routes[0]?.geometry?.coordinates) {
                routeCoords = data.routes[0].geometry.coordinates.map(
                  (coord: [number, number]) => [coord[1], coord[0]] // Convert [lng,lat] to [lat,lng]
                );
                console.log('📍 Using routes coordinates format');
              }
              // Format 4: Direct geometry with coordinates
              else if (data.geometry?.coordinates) {
                routeCoords = data.geometry.coordinates.map(
                  (coord: [number, number]) => [coord[1], coord[0]] // Convert [lng,lat] to [lat,lng]
                );
                console.log('📍 Using direct geometry format');
              }
              
              if (routeCoords && routeCoords.length > 0) {
                console.log(`🛣️ Got ${routeCoords.length} route coordinates`);
                
                // Draw the actual road route
                const polyline = L.polyline(routeCoords, {
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }).addTo(map);
                
                console.log('✅ Real road route drawn successfully', polyline);
                hasRealRoutes = true;
              } else {
                console.warn('⚠️ No valid route coordinates found in response, using fallback');
                console.log('Response structure:', JSON.stringify(data, null, 2));
                
                // Fallback to straight line
                L.polyline([start, end], {
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.6,
                  dashArray: '8, 4',
                }).addTo(map);
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('❌ ORS API failed:', response.status, errorData);
              
              // Fallback to straight line
              L.polyline([start, end], {
                color: '#94a3b8',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 4',
              }).addTo(map);
            }
          } catch (routeError) {
            console.error('❌ Route API error:', routeError);
            // Fallback to straight line with different styling
            L.polyline([start, end], {
              color: '#94a3b8',
              weight: 3,
              opacity: 0.7,
              dashArray: '8, 4',
            }).addTo(map);
          }
        }
        
        console.log('🏁 Finished drawing routes. Has real routes:', hasRealRoutes);
        setRouteDataSource(hasRealRoutes ? 'real' : 'fallback');
      } catch (error) {
        console.error('💥 Fatal error drawing routes:', error);
        setRouteDataSource('fallback');
        
        // Ultimate fallback - draw straight lines
        for (let i = 0; i < coordinates.length - 1; i++) {
          L.polyline([coordinates[i], coordinates[i + 1]], {
            color: '#94a3b8',
            weight: 3,
            opacity: 0.5,
            dashArray: '10, 5',
          }).addTo(map);
        }
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    // Start drawing routes
    console.log('🚀 Calling drawRealRoutes()');
    drawRealRoutes();

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
          
          <div className="ml-auto flex items-center gap-2">
            {isLoadingRoutes && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading routes...
              </div>
            )}
            
            {!isLoadingRoutes && (
              <div className="flex items-center gap-1">
                {routeDataSource === 'real' ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Real Roads
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Estimasi
                  </Badge>
                )}
              </div>
            )}
            
            <Badge variant="outline">
              {route.nodes.length} destinasi
            </Badge>
          </div>
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