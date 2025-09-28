import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRefunds } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MapPin, RotateCcw } from "lucide-react";

const Refund = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const data = await getUserRefunds(user.id);
        setRefunds(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Gagal memuat data refund");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user?.id]);

  const statusClass = (status: string) =>
    status === 'approved'
      ? 'bg-green-100 text-green-800'
      : status === 'rejected'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Refund</h1>
      {loading ? (
        <div>Memuat refund...</div>
      ) : refunds.length === 0 ? (
        <div>Tidak ada permintaan refund.</div>
      ) : (
        <div className="space-y-4">
          {refunds.map((r) => (
            <Card key={r.id}>
              <div className="flex">
                <div className="w-24 h-24 sm:w-32 sm:h-32">
                  <img
                    src={r.tickets?.destinations?.image}
                    alt={r.tickets?.destinations?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      {r.tickets?.destinations?.name || 'Refund Tiket'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {r.tickets?.destinations?.city}, {r.tickets?.destinations?.province}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 pt-2 text-sm">
                    {r.requested_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Diajukan: {new Date(r.requested_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                    {r.processed_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Diproses: {new Date(r.processed_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                    {r.reason && <div className="mt-1">Alasan: {r.reason}</div>}
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusClass(r.status)}`}>{r.status}</span>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Refund;
