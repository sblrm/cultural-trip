import { Car, Bike, Bus, Train, Plane, Ship } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { TransportMode } from "@/services/dynamicPricing";

interface TransportModeSelectorProps {
  selectedMode: TransportMode;
  onModeChange: (mode: TransportMode) => void;
}

const TransportModeSelector = ({ selectedMode, onModeChange }: TransportModeSelectorProps) => {
  const transportModes: Array<{
    value: TransportMode;
    label: string;
    icon: React.ReactNode;
    description: string;
    features: string[];
  }> = [
    {
      value: 'car',
      label: 'Mobil',
      icon: <Car className="w-6 h-6" />,
      description: 'Nyaman untuk keluarga',
      features: ['BBM', 'Tol', 'Parkir']
    },
    {
      value: 'motorcycle',
      label: 'Motor',
      icon: <Bike className="w-6 h-6" />,
      description: 'Hemat dan lincah',
      features: ['BBM Hemat', 'Parkir Murah', 'Tol 50%']
    },
    {
      value: 'bus',
      label: 'Bus',
      icon: <Bus className="w-6 h-6" />,
      description: 'Ekonomis untuk jarak jauh',
      features: ['City Bus', 'AKAP', 'Terhemat']
    },
    {
      value: 'train',
      label: 'Kereta',
      icon: <Train className="w-6 h-6" />,
      description: 'Nyaman dan cepat',
      features: ['KRL', 'Ekonomi', 'Eksekutif']
    },
    {
      value: 'flight',
      label: 'Pesawat',
      icon: <Plane className="w-6 h-6" />,
      description: 'Tercepat untuk jarak jauh',
      features: ['LCC', 'Full Service', '> 400km']
    },
    {
      value: 'ship',
      label: 'Kapal Laut',
      icon: <Ship className="w-6 h-6" />,
      description: 'Untuk rute kepulauan',
      features: ['Ferry', 'PELNI', 'Speed Boat']
    }
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Mode Transportasi</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {transportModes.map((mode) => (
          <Card
            key={mode.value}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedMode === mode.value
                ? 'ring-2 ring-primary bg-primary/5 border-primary'
                : 'border-muted hover:border-primary/50'
            }`}
            onClick={() => onModeChange(mode.value)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-2.5">
                {/* Icon */}
                <div
                  className={`p-3 rounded-full transition-colors ${
                    selectedMode === mode.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {mode.icon}
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm leading-tight">{mode.label}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{mode.description}</p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {mode.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded-full ${
                        selectedMode === mode.value
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Checkmark for selected */}
                {selectedMode === mode.value && (
                  <div className="w-full pt-2 border-t border-primary/20">
                    <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Dipilih
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info text based on selection */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedMode === 'car' && (
            <>
              💰 <strong>Biaya termasuk:</strong> BBM (≈12 km/L), tol untuk rute cepat, parkir di setiap destinasi
            </>
          )}
          {selectedMode === 'motorcycle' && (
            <>
              💰 <strong>Biaya termasuk:</strong> BBM hemat (≈35 km/L), tol diskon 50%, parkir motor lebih murah
            </>
          )}
          {selectedMode === 'bus' && (
            <>
              💰 <strong>Biaya termasuk:</strong> Tiket bus (City: Rp 3.5k+, AKAP: Rp 35k+). Ekonomis untuk jarak menengah!
            </>
          )}
          {selectedMode === 'train' && (
            <>
              💰 <strong>Biaya termasuk:</strong> Tiket kereta (KRL: Rp 5k, Ekonomi: Rp 50k+, Eksekutif: Rp 100k+)
            </>
          )}
          {selectedMode === 'flight' && (
            <>
              💰 <strong>Biaya termasuk:</strong> Tiket pesawat (LCC: Rp 400k+, Full service: Rp 600k+). Tercepat untuk {'>'} 400km!
            </>
          )}
          {selectedMode === 'ship' && (
            <>
              💰 <strong>Biaya termasuk:</strong> Tiket kapal (Ferry: Rp 75k+, PELNI: Rp 150k+). Ideal untuk rute kepulauan!
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default TransportModeSelector;
