
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface MapProps {
  userLocation: [number, number]; 
  setUserLocation: (location: [number, number]) => void;
  landmarks: Array<{id: number, name: string, location: [number, number], type: string}>;
  isTracking: boolean;
}

const ClientOnlyMap: React.FC<MapProps> = ({ userLocation, setUserLocation, landmarks, isTracking }) => {
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const landmarkMarkersRef = useRef<L.Marker[]>([]);
  
  useEffect(() => {
    // Keep Leaflet's default icon config for any fallback/default markers
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl
    });

    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(userLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create a generic pin-style DivIcon (original SVG, not Google asset)
    const createPinIcon = (fill = '#EA4335', stroke = '#B31412') =>
      L.divIcon({
        className: '',
        html: `
          <div style="position: relative; transform: translate(-50%,-100%);">
            <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.4 11.03 7.09 11.66a1 1 0 0 0 1.33 0C13.6 21.03 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
              <circle cx="12" cy="10" r="3" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

    const userLocationIcon = createPinIcon('#4285F4', '#1A73E8'); // blue pin for user
    const landmarkIcon = createPinIcon('#EA4335', '#B31412'); // red pin for landmarks

    userMarkerRef.current = L.marker(userLocation, { icon: userLocationIcon })
      .addTo(map)
      .bindPopup(`
        <div>
          <p class="font-semibold">Lokasi Anda</p>
          <p class="text-xs">Koordinat: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}</p>
        </div>
      `);

    landmarks.forEach(landmark => {
      const marker = L.marker(landmark.location, { icon: landmarkIcon })
        .addTo(map)
        .bindPopup(`
          <div>
            <p class="font-semibold">${landmark.name}</p>
            <p class="text-sm text-gray-600">${landmark.type}</p>
          </div>
        `);
      landmarkMarkersRef.current.push(marker);
    });

    mapRef.current = map;
    setIsMounted(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMounted(false);
    };
  }, []);
  
  useEffect(() => {
    if (!mapRef.current || !userMarkerRef.current) return;
    
    userMarkerRef.current.setLatLng(userLocation);
    userMarkerRef.current.setPopupContent(`
      <div>
        <p class="font-semibold">Lokasi Anda</p>
        <p class="text-xs">Koordinat: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}</p>
      </div>
    `);
    
    if (isTracking) {
      mapRef.current.setView(userLocation);
    }
  }, [userLocation, isTracking]);
  
  useEffect(() => {
    let watchId: number | undefined;
    
    console.log('Geolocation tracking state:', {
      isTracking,
      hasNavigator: typeof navigator !== 'undefined',
      hasGeolocation: typeof navigator !== 'undefined' && !!navigator.geolocation
    });

    if (isTracking && typeof navigator !== 'undefined' && navigator.geolocation) {
      const updateLocation = (position: GeolocationPosition) => {
        console.log('Received position update:', position);
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      };
      
      const handleError = (error: GeolocationPositionError) => {
        console.error('Error getting location:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        });
        
        let errorMessage = 'Tidak dapat melacak lokasi Anda';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan peramban Anda.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis.';
            break;
        }
        
        if (window.toast) {
          window.toast.error(errorMessage);
        }
      };
      
      navigator.geolocation.getCurrentPosition(updateLocation, handleError);
      watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
    
    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, setUserLocation]);
  
  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full rounded-lg"
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default ClientOnlyMap;
