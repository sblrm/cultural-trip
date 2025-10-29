import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Heart,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Lock,
  Unlock,
  Loader2,
  Globe
} from 'lucide-react';
import {
  getUserWishlists,
  deleteWishlist,
  generateShareToken,
  removeShareToken,
  type Wishlist
} from '@/services/wishlistService';

export default function WishlistsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sharingId, setSharingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated) {
      loadWishlists();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadWishlists = async () => {
    try {
      setLoading(true);
      const data = await getUserWishlists();
      setWishlists(data);
    } catch (error) {
      console.error('Error loading wishlists:', error);
      toast.error('Gagal memuat wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteWishlist(deleteId);
      setWishlists(wishlists.filter(w => w.id !== deleteId));
      toast.success('Wishlist berhasil dihapus');
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      toast.error('Gagal menghapus wishlist');
    } finally {
      setDeleteId(null);
    }
  };

  const handleShare = async (wishlistId: number) => {
    setSharingId(wishlistId);
    try {
      const token = await generateShareToken(wishlistId);
      const shareUrl = `${window.location.origin}/wishlist/shared/${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link berbagi disalin ke clipboard!');
      
      // Update local state
      setWishlists(wishlists.map(w =>
        w.id === wishlistId ? { ...w, share_token: token, is_public: true } : w
      ));
    } catch (error) {
      console.error('Error sharing wishlist:', error);
      toast.error('Gagal membuat link berbagi');
    } finally {
      setSharingId(null);
    }
  };

  const handleUnshare = async (wishlistId: number) => {
    try {
      await removeShareToken(wishlistId);
      toast.success('Wishlist sekarang private');
      
      // Update local state
      setWishlists(wishlists.map(w =>
        w.id === wishlistId ? { ...w, share_token: null, is_public: false } : w
      ));
    } catch (error) {
      console.error('Error unsharing wishlist:', error);
      toast.error('Gagal membuat private');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              Wishlist Saya
            </h1>
            <p className="text-muted-foreground mt-2">
              Simpan destinasi favorit untuk dikunjungi nanti
            </p>
          </div>
          <Button onClick={() => navigate('/wishlist/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Wishlist Baru
          </Button>
        </div>

        {/* Wishlists Grid */}
        {wishlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Belum ada wishlist</h3>
              <p className="text-muted-foreground text-center mb-6">
                Buat wishlist pertama Anda untuk menyimpan destinasi favorit
              </p>
              <Button onClick={() => navigate('/wishlist/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Wishlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist) => (
              <Card key={wishlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {wishlist.name}
                        {wishlist.is_public && (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {wishlist.description || 'Tidak ada deskripsi'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/wishlist/edit/${wishlist.id}`)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            wishlist.share_token
                              ? handleUnshare(wishlist.id)
                              : handleShare(wishlist.id)
                          }
                          disabled={sharingId === wishlist.id}
                        >
                          {wishlist.share_token ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Buat Private
                            </>
                          ) : (
                            <>
                              <Share2 className="h-4 w-4 mr-2" />
                              Bagikan
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(wishlist.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {wishlist.item_count || 0} destinasi
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Dibuat: {new Date(wishlist.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/wishlist/${wishlist.id}`)}
                    >
                      Lihat Wishlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua destinasi dalam wishlist ini akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
