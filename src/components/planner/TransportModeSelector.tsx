import { Car, Bike, Bus } from "lucide-react";
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
      features: ['BBM Hemat', 'Parkir Murah', 'Tol 50% Off']
    },
    {
      value: 'public_transport',
      label: 'Transportasi Umum',
      icon: <Bus className="w-6 h-6" />,
      description: 'Ramah lingkungan',
      features: ['Bus', 'Kereta', 'Pesawat']
    }
  ];

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Mode Transportasi</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center space-y-2">
                {/* Icon */}
                <div
                  className={`p-2.5 rounded-full transition-colors ${
                    selectedMode === mode.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {mode.icon}
                </div>

                {/* Label */}
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm">{mode.label}</h3>
                  <p className="text-xs text-muted-foreground leading-tight">{mode.description}</p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap justify-center gap-1">
                  {mode.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
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
                  <div className="w-full pt-1.5 border-t border-primary/20">
                    <div className="flex items-center justify-center gap-1 text-primary text-xs font-medium">
                      <svg
                        className="w-3.5 h-3.5"
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
      <div className="bg-muted/50 rounded-lg p-2.5">
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
          {selectedMode === 'public_transport' && (
            <>
              💰 <strong>Biaya termasuk:</strong> Tiket bus/kereta/pesawat sesuai jarak. Lebih hemat untuk jarak jauh!
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default TransportModeSelector;
