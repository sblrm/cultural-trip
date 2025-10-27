import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPurchases, createRefund } from "@/lib/supabase";
import { sendEmailNotification } from "@/lib/notifications";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MapPin, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PurchaseList = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundTicketId, setRefundTicketId] = useState<number | null>(null);
  const [refundTicketStatus, setRefundTicketStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const data = await getUserPurchases(user.id);
        console.log('Purchases data:', data); // Debug log
        setPurchases(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Gagal memuat riwayat pembelian");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user?.id]);

  const openRefund = (ticketId: number, status?: string) => {
    const st = status ?? null;
    // Guard: only confirmed tickets can be refunded
    if (st && st !== 'confirmed') {
      toast.info("Refund hanya tersedia untuk tiket berstatus 'confirmed'.");
      return;
    }
    setRefundTicketId(ticketId);
    setRefundTicketStatus(st);
    setRefundReason("");
    setRefundOpen(true);
  };

  const submitRefund = async () => {
    if (!user || !refundTicketId) return;
    if (refundTicketStatus && refundTicketStatus !== 'confirmed') {
      toast.error("Status tiket bukan 'confirmed'. Refund tidak dapat diajukan.");
      return;
    }
    if (!refundReason.trim()) {
      toast.error("Mohon isi alasan refund");
      return;
    }
    setSubmitting(true);
    try {
      const refund = await createRefund(user.id, refundTicketId, refundReason.trim());
      toast.success("Permintaan refund diajukan");
      setRefundOpen(false);
      // Fire-and-forget email notification if possible
      const to = user.email || '';
      if (to) {
        void sendEmailNotification({
          to,
          subject: `Permintaan Refund #${refund.id}`,
          text: `Permintaan refund Anda telah diterima. ID Refund: ${refund.id}.`,
          meta: {
            refundId: refund.id,
            ticketId: refund.ticket_id,
            reason: refund.reason,
            requested_at: refund.requested_at,
          },
        });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Gagal mengajukan refund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Purchase List</h1>
      {loading ? (
        <div>Memuat pembelian...</div>
      ) : purchases.length === 0 ? (
        <div>Belum ada pembelian.</div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => {
            // Support both new bookings system and legacy tickets system
            const bookingData = p.bookings || p.tickets;
            const destination = bookingData?.destinations;
            
            // Debug log for troubleshooting
            console.log('Purchase item:', {
              id: p.id,
              hasBookings: !!p.bookings,
              hasTickets: !!p.tickets,
              destination: destination,
              image: destination?.image
            });
            
            const image = destination?.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
            const name = destination?.name || 'Pembelian Tiket';
            const city = destination?.city || '-';
            const province = destination?.province || '-';
            const visitDate = bookingData?.visit_date;
            const quantity = bookingData?.quantity || bookingData?.ticket_quantity || '-';
            const amount = p.amount || bookingData?.total_price || 0;
            const status = p.status || 'unknown';
            const bookingCode = bookingData?.booking_code;

            return (
              <Card key={p.id}>
                <div className="flex">
                  <div className="flex-1 p-4">
                    <CardHeader className="p-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        {name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3 w-3" />
                        {city}, {province}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 pt-2 text-sm space-y-1">
                      {bookingCode && (
                        <div className="font-mono text-xs text-muted-foreground">
                          Kode: {bookingCode}
                        </div>
                      )}
                      {visitDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(visitDate).toLocaleDateString('id-ID', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      )}
                      <div>Jumlah: {quantity} tiket</div>
                      <div className="font-semibold">
                        Total: Rp {Number(amount).toLocaleString('id-ID')}
                      </div>
                      <div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === 'paid' ? 'bg-green-100 text-green-800' :
                          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PurchaseList;
