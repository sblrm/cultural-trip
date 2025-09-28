
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Compass, Target, Locate } from 'lucide-react';

declare global {
  interface Window {
    toast: typeof toast;
  }
}

const LiveMapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([-6.2088, 106.8456]); 
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [landmarks, setLandmarks] = useState<Array<{id: number, name: string, location: [number, number], type: string}>>([
    { id: 1, name: 'Candi Borobudur', location: [-7.6079, 110.2038], type: 'Candi' },
    { id: 2, name: 'Kraton Yogyakarta', location: [-7.8052, 110.3642], type: 'Istana' },
    { id: 3, name: 'Tanah Lot', location: [-8.6215, 115.0865], type: 'Pura' },
    { id: 4, name: 'Taman Mini Indonesia Indah', location: [-6.3024, 106.8951], type: 'Taman Budaya' },
    { id: 5, name: 'Museum Nasional', location: [-6.1769, 106.8222], type: 'Museum' },
    { id: 6, name: 'Desa Penglipuran', location: [-8.4222, 115.3575], type: 'Desa Adat' },
    { id: 7, name: 'Toraja', location: [-3.0374, 119.8601], type: 'Situs Budaya' },
    { id: 8, name: 'Keraton Solo', location: [-7.5708, 110.8267], type: 'Istana' }
  ]);
  const [ClientOnlyMap, setClientOnlyMap] = useState<React.ComponentType<any> | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  useEffect(() => {
    window.toast = toast;
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
  
  const startTracking = () => {
    setIsTracking(true);
    toast.success('Pelacakan lokasi dimulai');
  };
  
  const stopTracking = () => {
    setIsTracking(false);
    toast.info('Pelacakan lokasi dihentikan');
  };
  
  // Map loading component
  const MapLoading = () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p>Memuat peta...</p>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Peta Lokasi Realtime</h1>
      <p className="mb-4">Pantau lokasi Anda dan lihat objek wisata budaya terdekat dari posisi Anda saat ini.</p>
      
      <div className="flex gap-4 mb-4">
        {!isTracking ? (
          <Button onClick={startTracking} className="flex items-center gap-2">
            <Locate size={18} />
            Mulai Pelacakan
          </Button>
        ) : (
          <Button onClick={stopTracking} variant="secondary" className="flex items-center gap-2">
            <Target size={18} />
            Hentikan Pelacakan
          </Button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div style={{ height: '500px', width: '100%' }}>
          {isMapLoading || !ClientOnlyMap ? (
            <MapLoading />
          ) : (
            <ClientOnlyMap
              userLocation={userLocation}
              setUserLocation={setUserLocation}
              landmarks={landmarks}
              isTracking={isTracking}
            />
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Compass className="text-primary" />
          Info Navigasi
        </h2>
        <div className="space-y-2">
          <p><strong>Koordinat Anda:</strong> {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}</p>
          <p><strong>Status Pelacakan:</strong> {isTracking ? 'Aktif' : 'Tidak Aktif'}</p>
          <p className="text-sm text-gray-600">
            Gunakan peta ini untuk menemukan lokasi Anda saat ini dan melihat objek wisata budaya di sekitar Anda.
            Anda dapat mengaktifkan pelacakan untuk memperbarui lokasi Anda secara otomatis saat Anda bergerak.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <img 
          src="/culture-uploads/Tana Toraja.png" 
          alt="Rumah Adat Toraja" 
          className="w-full h-64 object-cover rounded-lg shadow-md"
        />
        <img 
          src="/culture-uploads/Desa Adat Wae Rebo.jpg"
          alt="Desa Tradisional" 
          className="w-full h-64 object-cover rounded-lg shadow-md"
        />
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h3 className="text-lg font-semibold mb-2">Petunjuk Penggunaan:</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Klik tombol "Mulai Pelacakan" untuk melacak lokasi Anda secara realtime.</li>
          <li>Geser peta untuk melihat area sekitar.</li>
          <li>Klik dan tahan untuk menggeser peta.</li>
          <li>Gunakan tombol + dan - di pojok kiri atas untuk memperbesar atau memperkecil tampilan.</li>
          <li>Klik marker untuk melihat informasi tentang objek wisata budaya.</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveMapPage;
