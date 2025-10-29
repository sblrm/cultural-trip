import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWishlistByShareToken } from "@/services/wishlistService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Heart,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

interface WishlistWithItems {
  id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  wishlist_items: Array<{
    id: number;
    notes: string | null;
    priority: number;
    added_at: string;
    destinations: {
      id: number;
      name: string;
      location: string;
      description: string;
      image_url: string | null;
      rating: number;
      estimated_duration: string;
      price_per_person: number;
    };
  }>;
}

export default function SharedWishlistPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<WishlistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!token) {
        setError("Token tidak valid");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getWishlistByShareToken(token);
        if (!data) {
          setError("Wishlist tidak ditemukan atau tidak dipublikasikan");
          return;
        }
        setWishlist(data);
      } catch (err) {
        console.error("Error loading shared wishlist:", err);
        setError("Gagal memuat wishlist");
        toast.error("Gagal memuat wishlist");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [token]);

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 2:
        return (
          <Badge className="bg-red-500 hover:bg-red-600">Must Visit</Badge>
        );
      case 1:
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            High Priority
          </Badge>
        );
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <AlertCircle className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {error || "Wishlist tidak ditemukan"}
                </h3>
                <p className="text-muted-foreground">
                  Wishlist ini mungkin sudah dihapus, tidak dipublikasikan, atau link tidak valid.
                </p>
              </div>
              <Button onClick={() => navigate("/destinations")}>
                Jelajahi Destinasi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="text-3xl">{wishlist.name}</CardTitle>
                {wishlist.description && (
                  <CardDescription className="text-base">
                    {wishlist.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0">
                <Heart className="w-3 h-3 mr-1" />
                {wishlist.wishlist_items.length} destinasi
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Destinations Grid */}
        {wishlist.wishlist_items.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <Heart className="w-16 h-16 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Wishlist Kosong</h3>
                  <p className="text-muted-foreground">
                    Belum ada destinasi dalam wishlist ini
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.wishlist_items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/destinations/${item.destinations.id}`)}
              >
                <div className="relative aspect-video">
                  <img
                    src={item.destinations.image_url || "/images/placeholder.jpg"}
                    alt={item.destinations.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-2 right-2">
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {item.destinations.name}
                  </CardTitle>
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">
                        {item.destinations.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{item.destinations.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.destinations.estimated_duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        Rp {item.destinations.price_per_person.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                {item.notes && (
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-lg mb-1">
                  Tertarik membuat wishlist sendiri?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Daftar sekarang dan mulai merencanakan trip impian Anda
                </p>
              </div>
              <Button onClick={() => navigate("/register")} size="lg">
                Daftar Gratis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
