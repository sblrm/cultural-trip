import { useState } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ItineraryCard from "./ItineraryCard";
import ShareButton from "./ShareButton";
import { downloadAsImage, generateItineraryText, type TripPlan } from "@/services/socialSharing";

interface ShareTripModalProps {
  tripPlan: TripPlan;
  trigger?: React.ReactNode;
}

const ShareTripModal = ({ tripPlan, trigger }: ShareTripModalProps) => {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareData = {
    title: `Rencana Wisata Budaya - ${tripPlan.destinations.length} Destinasi`,
    description: generateItineraryText(tripPlan),
    url: window.location.href,
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      await downloadAsImage('shareable-itinerary-card', 'rencana-wisata.png');
      toast.success("Itinerary berhasil diunduh! 📥");
    } catch (error) {
      toast.error("Gagal mengunduh gambar");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Bagikan Rencana
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bagikan Rencana Wisata Anda</DialogTitle>
          <DialogDescription>
            Bagikan itinerary Anda ke social media atau download sebagai gambar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Card */}
          <div className="border border-border rounded-lg p-4 bg-muted/30 dark:bg-muted/10">
            <ItineraryCard tripPlan={tripPlan} cardId="shareable-itinerary-card" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Gambar
                </>
              )}
            </Button>
            <ShareButton
              data={shareData}
              onDownload={handleDownloadImage}
              variant="default"
            />
          </div>

          {/* Text Preview (for copy-paste) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Teks Itinerary (untuk copy-paste):</label>
            <div className="bg-background border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
              {shareData.description}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTripModal;
