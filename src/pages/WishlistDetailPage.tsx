import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ArrowLeft,
  Heart,
  MapPin,
  MoreVertical,
  Trash2,
  ExternalLink,
  Loader2,
  Star,
  Clock
} from 'lucide-react';
import {
  getWishlist,
  removeFromWishlist
} from '@/services/wishlistService';

export default function WishlistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated && id) {
      loadWishlist();
    }
  }, [id, isAuthenticated, authLoading, navigate]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist(Number(id));
      setWishlist(data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Gagal memuat wishlist');
      navigate('/wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId || !wishlist) return;

    try {
      await removeFromWishlist(wishlist.id, deleteItemId);
      setWishlist({
        ...wishlist,
        wishlist_items: wishlist.wishlist_items.filter(
          (item: any) => item.destination_id !== deleteItemId
        )
      });
      toast.success('Destinasi dihapus dari wishlist');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Gagal menghapus destinasi');
    } finally {
      setDeleteItemId(null);
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 2:
        return { label: 'Must Visit', color: 'bg-red-500' };
      case 1:
        return { label: 'High Priority', color: 'bg-orange-500' };
      default:
        return { label: 'Normal', color: 'bg-gray-500' };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!wishlist) {
    return null;
  }

  const items = wishlist.wishlist_items || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/wishlist')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              {wishlist.name}
            </h1>
            {wishlist.description && (
              <p className="text-muted-foreground mt-2">{wishlist.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} destinasi
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/wishlist/edit/${wishlist.id}`)}>
            Edit Wishlist
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Wishlist kosong</h3>
            <p className="text-muted-foreground text-center mb-6">
              Belum ada destinasi di wishlist ini. Mulai menambahkan destinasi favorit Anda!
            </p>
            <Button onClick={() => navigate('/destinations')}>
              Jelajahi Destinasi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => {
            const destination = item.destination;
            const priority = getPriorityLabel(item.priority);
            
            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                  />
                  {item.priority > 0 && (
                    <Badge className={`absolute top-2 right-2 ${priority.color}`}>
                      {priority.label}
                    </Badge>
                  )}
                  <div className="absolute top-2 left-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => navigate(`/destinations/${destination.id}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteItemId(destination.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus dari Wishlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{destination.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{destination.city}, {destination.province}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{destination.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{destination.duration} menit</span>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      <p className="text-muted-foreground italic">"{item.notes}"</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-lg font-bold text-primary">
                      Rp {destination.price.toLocaleString('id-ID')}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/destinations/${destination.id}`)}
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dari Wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Destinasi ini akan dihapus dari wishlist. Anda bisa menambahkannya lagi kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
