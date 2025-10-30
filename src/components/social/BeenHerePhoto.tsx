import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface BeenHerePhotoProps {
  destinationId: number;
  destinationName: string;
  onUploadSuccess?: () => void;
}

interface PhotoData {
  file: File;
  preview: string;
  caption: string;
  rating: number;
}

const BeenHerePhoto = ({ destinationId, destinationName, onUploadSuccess }: BeenHerePhotoProps) => {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoData({
        file,
        preview: reader.result as string,
        caption: "",
        rating: 5,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!photoData || !user) return;

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = photoData.file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `user-photos/${destinationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('culture-uploads')
        .upload(filePath, photoData.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('culture-uploads')
        .getPublicUrl(filePath);

      // Save to database (create a user_photos table or add to reviews)
      const { error: dbError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          destination_id: destinationId,
          rating: photoData.rating,
          comment: photoData.caption,
          photos: [publicUrl],
          created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast.success("Foto berhasil diunggah! 📸");
      setOpen(false);
      setPhotoData(null);
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Gagal mengunggah foto. Silakan coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Camera className="h-4 w-4 mr-2" />
          Saya Pernah Ke Sini
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bagikan Pengalaman Anda</DialogTitle>
          <DialogDescription>
            Upload foto dan ceritakan pengalaman Anda di {destinationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo Upload Area */}
          {!photoData ? (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border dark:border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-muted/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Klik untuk upload foto atau drag & drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG (max 5MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative">
                <img
                  src={photoData.preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label>Rating Pengalaman Anda</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPhotoData({ ...photoData, rating: star })}
                      className="text-2xl focus:outline-none"
                    >
                      {star <= photoData.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (opsional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Ceritakan pengalaman Anda..."
                  value={photoData.caption}
                  onChange={(e) => setPhotoData({ ...photoData, caption: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Upload Button */}
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Bagikan Foto
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BeenHerePhoto;
