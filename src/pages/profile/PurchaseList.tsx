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
          {purchases.map((p) => (
            <Card key={p.id}>
              <div className="flex">
                <div className="w-24 h-24 sm:w-32 sm:h-32">
                  <img
                    src={p.tickets?.destinations?.image}
                    alt={p.tickets?.destinations?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      {p.tickets?.destinations?.name || 'Pembelian Tiket'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {p.tickets?.destinations?.city}, {p.tickets?.destinations?.province}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 pt-2 text-sm">
                    {p.tickets?.visit_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.tickets.visit_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                    <div className="mt-1">Jumlah: {p.tickets?.quantity ?? '-'}</div>
                    <div>Total: Rp {Number(p.amount ?? p.tickets?.total_price ?? 0).toLocaleString('id-ID')}</div>
                    <div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-muted">{p.status}</span>
                    </div>
                    {p.tickets?.id && (
                      <div className="mt-3">
                        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openRefund(p.tickets.id, p.tickets?.status)}
                              disabled={p.tickets?.status !== 'confirmed'}
                              title={p.tickets?.status !== 'confirmed' ? 'Refund hanya untuk tiket confirmed' : undefined}
                            >
                              Ajukan Refund
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajukan Refund</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm mb-1">Alasan</label>
                                <Input
                                  placeholder="Tuliskan alasan refund"
                                  value={refundReason}
                                  onChange={(e) => setRefundReason(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setRefundOpen(false)}>
                                  Batal
                                </Button>
                                <Button onClick={submitRefund} disabled={submitting}>
                                  {submitting ? "Mengirim..." : "Kirim"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
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

export default PurchaseList;
