import { useState, useEffect } from "react";
import { Camera, X, Loader2, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface PhotoWithUser {
  id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

interface PhotoGalleryProps {
  destinationId: number;
  destinationName: string;
}

const PhotoGallery = ({ destinationId, destinationName }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<PhotoWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; user: PhotoWithUser } | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [destinationId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // Query reviews that have photos
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          rating,
          comment,
          photos,
          created_at,
          profiles:user_id (
            name,
            avatar_url
          )
        `)
        .eq('destination_id', destinationId)
        .not('photos', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out reviews with empty photo arrays and map to correct type
      const photosData = (data || [])
        .filter(
          (review: any) => review.photos && Array.isArray(review.photos) && review.photos.length > 0
        )
        .map((review: any) => ({
          ...review,
          profiles: Array.isArray(review.profiles) ? review.profiles[0] : review.profiles
        }));

      setPhotos(photosData);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Belum Ada Foto</h3>
          <p className="text-muted-foreground mb-6">
            Jadilah yang pertama membagikan foto pengalaman Anda di {destinationName}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Photo Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Galeri Foto Pengunjung</h3>
            <p className="text-muted-foreground">
              {photos.length} foto dari pengunjung di {destinationName}
            </p>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.flatMap((review) =>
            review.photos.map((photoUrl, index) => (
              <button
                key={`${review.id}-${index}`}
                onClick={() => setSelectedPhoto({ url: photoUrl, user: review })}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-muted"
              >
                <img
                  src={photoUrl}
                  alt={`Foto oleh ${review.profiles?.name || 'User'}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                  <User className="h-6 w-6 mb-2" />
                  <p className="text-sm font-medium text-center">
                    {review.profiles?.name || 'User'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Photo */}
              <div className="bg-black">
                <img
                  src={selectedPhoto.url}
                  alt="Foto destinasi"
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>

              {/* Photo Info */}
              <div className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {selectedPhoto.user.profiles?.avatar_url ? (
                      <img
                        src={selectedPhoto.user.profiles.avatar_url}
                        alt={selectedPhoto.user.profiles?.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {selectedPhoto.user.profiles?.name || 'User'}
                      </h4>
                      <span className="text-yellow-500">
                        {'⭐'.repeat(selectedPhoto.user.rating)}
                      </span>
                    </div>
                    
                    {selectedPhoto.user.comment && (
                      <p className="text-muted-foreground mb-2">
                        {selectedPhoto.user.comment}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(selectedPhoto.user.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PhotoGallery;
