import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";

const MyBooking = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const data = await getUserBookings(user.id);
        setBookings(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Gagal memuat data booking");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user?.id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Booking</h1>
      {loading ? (
        <div>Memuat booking...</div>
      ) : bookings.length === 0 ? (
        <div>Tidak ada booking.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex">
                <div className="w-24 h-24 sm:w-32 sm:h-32">
                  <img
                    src={b.destinations?.image}
                    alt={b.destinations?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base">{b.destinations?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {b.destinations?.city}, {b.destinations?.province}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 pt-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(b.booking_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="mt-1">Jumlah: {b.quantity}</div>
                    <div>Total: Rp {Number(b.total_price).toLocaleString('id-ID')}</div>
                    <div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-muted">{b.status}</span>
                    </div>
                  </CardContent>
                  <div className="mt-3">
                    <Link to={`/destinations/${b.destinations?.id}`}>
                      <Button size="sm">Lihat Detail</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBooking;
