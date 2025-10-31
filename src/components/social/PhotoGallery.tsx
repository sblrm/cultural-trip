import { useState, useEffect } from "react";
import { Camera, X, Loader2, Calendar, User, Trash2, Edit2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PhotoWithUser {
  id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface PhotoGalleryProps {
  destinationId: number;
  destinationName: string;
}

const PhotoGallery = ({ destinationId, destinationName }: PhotoGalleryProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; user: PhotoWithUser; photoIndex: number } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState('');
  const [editedRating, setEditedRating] = useState(5);
  const [saving, setSaving] = useState(false);

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
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('destination_id', destinationId)
        .not('photos', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading photos:', error);
        throw error;
      }

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
      setPhotos([]); // Set empty array on error
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

  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !user) return;

    setDeleting(true);
    try {
      const review = selectedPhoto.user;
      const photoUrl = selectedPhoto.url;
      
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.indexOf('culture-uploads');
      if (bucketIndex === -1) throw new Error('Invalid photo URL');
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      // Remove photo from array
      const updatedPhotos = review.photos.filter((_, idx) => idx !== selectedPhoto.photoIndex);

      // Update review in database
      const { error: dbError } = await supabase
        .from('reviews')
        .update({ photos: updatedPhotos })
        .eq('id', review.id);

      if (dbError) throw dbError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('culture-uploads')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error (non-critical):', storageError);
        // Don't throw - photo reference already removed from DB
      }

      toast.success('Foto berhasil dihapus');
      setDeleteDialogOpen(false);
      setSelectedPhoto(null);
      
      // Reload photos
      loadPhotos();
    } catch (error: any) {
      console.error('Delete photo error:', error);
      toast.error(error.message || 'Gagal menghapus foto');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartEdit = () => {
    if (!selectedPhoto) return;
    setEditedComment(selectedPhoto.user.comment || '');
    setEditedRating(selectedPhoto.user.rating);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedComment('');
    setEditedRating(5);
  };

  const handleSaveEdit = async () => {
    if (!selectedPhoto || !user) return;

    setSaving(true);
    try {
      const review = selectedPhoto.user;

      // Update review in database
      const { error } = await supabase
        .from('reviews')
        .update({
          comment: editedComment.trim() || null,
          rating: editedRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', review.id);

      if (error) throw error;

      toast.success('Caption berhasil diperbarui');
      setIsEditing(false);
      setSelectedPhoto(null);
      
      // Reload photos
      loadPhotos();
    } catch (error: any) {
      console.error('Update review error:', error);
      toast.error(error.message || 'Gagal memperbarui caption');
    } finally {
      setSaving(false);
    }
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
                onClick={() => setSelectedPhoto({ url: photoUrl, user: review, photoIndex: index })}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-muted"
              >
                <img
                  src={photoUrl}
                  alt={`Foto oleh ${review.profiles?.full_name || 'User'}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                  <User className="h-6 w-6 mb-2" />
                  <p className="text-sm font-medium text-center">
                    {review.profiles?.full_name || 'User'}
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
              {/* Action buttons */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* Delete button - only show for photo owner */}
                {user && selectedPhoto.user.user_id === user.id && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

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
                        alt={selectedPhoto.user.profiles?.full_name || 'User'}
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {selectedPhoto.user.profiles?.full_name || 'User'}
                        </h4>
                        {!isEditing && (
                          <span className="text-yellow-500">
                            {'⭐'.repeat(selectedPhoto.user.rating)}
                          </span>
                        )}
                      </div>
                      
                      {/* Edit button - only show for photo owner */}
                      {user && selectedPhoto.user.user_id === user.id && !isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleStartEdit}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-4 mt-4">
                        {/* Rating Editor */}
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditedRating(star)}
                                className="text-2xl focus:outline-none transition-transform hover:scale-110"
                              >
                                {star <= editedRating ? '⭐' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Caption Editor */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-caption">Caption</Label>
                          <Textarea
                            id="edit-caption"
                            value={editedComment}
                            onChange={(e) => setEditedComment(e.target.value)}
                            placeholder="Ceritakan pengalaman Anda..."
                            rows={3}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Simpan
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        {selectedPhoto.user.comment && (
                          <p className="text-muted-foreground mb-2">
                            {selectedPhoto.user.comment}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(selectedPhoto.user.created_at)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Foto
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PhotoGallery;
