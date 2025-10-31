import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings, rescheduleBooking, cancelBooking, requestRefund, checkRefundEligibility } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Ticket, CalendarClock, XCircle, AlertCircle, FileText, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface Booking {
  id: number;
  user_id: string;
  destination_id: number;
  booking_date: string;
  visit_date: string;
  quantity: number;
  ticket_quantity: number;
  total_price: number;
  status: 'pending_payment' | 'paid' | 'confirmed' | 'used' | 'cancelled' | 'refund_requested' | 'refunded';
  booking_code?: string;
  qr_code_url?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
  destinations?: {
    id: number;
    name: string;
    city: string;
    province: string;
    image: string;
    price: number;
  };
  transactions?: {
    order_id: string;
    payment_type: string;
    transaction_status: string;
  };
}

const MyBooking = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Reschedule modal
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<number | null>(null);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  
  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  
  // Refund eligibility info
  const [refundEligibility, setRefundEligibility] = useState<any>(null);

  useEffect(() => {
    loadBookings();
  }, [isAuthenticated, user?.id]);

  const loadBookings = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const data = await getUserBookings(user.id);
      setBookings(data);
    } catch (e) {
      console.error(e);
      toast.error(t('booking.loadError') || "Gagal memuat data booking");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId || !newVisitDate) {
      toast.error(t('booking.selectNewDate') || "Pilih tanggal baru");
      return;
    }
    
    setRescheduling(true);
    try {
      await rescheduleBooking(rescheduleBookingId, newVisitDate);
      toast.success(t('booking.rescheduleSuccess') || "Jadwal berhasil diubah");
      setRescheduleOpen(false);
      setNewVisitDate('');
      loadBookings();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('booking.rescheduleError') || "Gagal mengubah jadwal");
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelClick = async (bookingId: number) => {
    setCancelBookingId(bookingId);
    setCancelReason('');
    
    // Check refund eligibility
    try {
      const eligibility = await checkRefundEligibility(bookingId);
      setRefundEligibility(eligibility);
    } catch (e) {
      console.error(e);
      setRefundEligibility(null);
    }
    
    setCancelOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    
    if (!cancelReason.trim()) {
      toast.error(t('booking.provideReason') || "Mohon isi alasan pembatalan");
      return;
    }
    
    setCancelling(true);
    try {
      // If eligible for refund, request refund instead of just cancelling
      if (refundEligibility?.eligible && user) {
        const result = await requestRefund(user.id, cancelBookingId, cancelReason);
        if (result.success) {
          toast.success(t('booking.refundRequestSuccess') || "Permintaan refund berhasil diajukan");
        } else {
          throw new Error(result.message);
        }
      } else {
        // Just cancel without refund
        await cancelBooking(cancelBookingId);
        toast.success(t('booking.cancelSuccess') || "Booking berhasil dibatalkan");
      }
      
      setCancelOpen(false);
      setCancelReason('');
      setRefundEligibility(null);
      loadBookings();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('booking.cancelError') || "Gagal membatalkan booking");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending_payment: { 
        variant: "outline", 
        label: t('booking.status.pendingPayment') || "Menunggu Pembayaran",
        icon: AlertCircle
      },
      paid: { 
        variant: "default", 
        label: t('booking.status.paid') || "Berhasil",
        icon: Ticket
      },
      confirmed: { 
        variant: "default", 
        label: t('booking.status.confirmed') || "Dikonfirmasi",
        icon: Ticket
      },
      refund_requested: { 
        variant: "secondary", 
        label: t('booking.status.refundRequested') || "Permintaan Refund",
        icon: RotateCcw
      },
    };

    const config = variants[status] || { 
      variant: "outline", 
      label: status,
      icon: AlertCircle
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">{t('booking.myBooking') || "My Booking"}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-muted-foreground">{t('booking.loading') || "Memuat booking..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('booking.myBooking') || "My Booking"}</h1>
        <Button onClick={() => navigate('/destinations')} variant="outline">
          <Ticket className="mr-2 h-4 w-4" />
          {t('booking.bookNew') || "Pesan Tiket Baru"}
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('booking.noBookings') || "Belum Ada Booking"}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('booking.noBookingsDesc') || "Anda belum memiliki tiket yang aktif. Pesan sekarang untuk mulai petualangan!"}
            </p>
            <Button onClick={() => navigate('/destinations')}>
              {t('booking.exploreDestinations') || "Jelajahi Destinasi"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-muted">
                  <img
                    src={booking.destinations?.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                    alt={booking.destinations?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6">
                  <CardHeader className="p-0 mb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {booking.destinations?.name || 'Destinasi'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          {booking.destinations?.city}, {booking.destinations?.province}
                        </CardDescription>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 space-y-2 text-sm">
                    {/* Booking Code */}
                    {booking.booking_code && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{booking.booking_code}</span>
                      </div>
                    )}

                    {/* Visit Date */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t('booking.visitDate') || "Tanggal Kunjungan"}:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(booking.visit_date)}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('booking.quantity') || "Jumlah"}:</span>
                      <span className="font-medium">
                        {booking.ticket_quantity || booking.quantity} {t('booking.tickets') || "tiket"}
                      </span>
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{t('booking.total') || "Total"}:</span>
                      <span className="font-semibold text-lg text-primary">
                        {formatPrice(booking.total_price)}
                      </span>
                    </div>

                    {/* Booking Date */}
                    <div className="text-xs text-muted-foreground mt-2">
                      {t('booking.bookedOn') || "Dipesan pada"}: {formatDate(booking.booking_date)}
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <CardFooter className="p-0 pt-4 flex flex-wrap gap-2">
                    <Link to={`/destinations/${booking.destination_id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('booking.viewDetail') || "Lihat Detail"}
                      </Button>
                    </Link>

                    {booking.status === 'confirmed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRescheduleBookingId(booking.id);
                            setNewVisitDate(booking.visit_date);
                            setRescheduleOpen(true);
                          }}
                        >
                          <CalendarClock className="mr-2 h-4 w-4" />
                          {t('booking.reschedule') || "Ubah Jadwal"}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelClick(booking.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {t('booking.cancel') || "Batalkan"}
                        </Button>
                      </>
                    )}

                    {booking.status === 'refund_requested' && (
                      <Button variant="secondary" size="sm" disabled>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('booking.refundInProgress') || "Refund Diproses"}
                      </Button>
                    )}
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('booking.rescheduleTitle') || "Ubah Jadwal Kunjungan"}</DialogTitle>
            <DialogDescription>
              {t('booking.rescheduleDesc') || "Pilih tanggal baru untuk kunjungan Anda"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDate">{t('booking.newVisitDate') || "Tanggal Kunjungan Baru"}</Label>
              <Input
                id="newDate"
                type="date"
                value={newVisitDate}
                onChange={(e) => setNewVisitDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              {t('common.cancel') || "Batal"}
            </Button>
            <Button onClick={handleReschedule} disabled={rescheduling}>
              {rescheduling ? t('common.processing') || "Memproses..." : t('common.save') || "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel/Refund Modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {refundEligibility?.eligible 
                ? t('booking.refundTitle') || "Ajukan Refund" 
                : t('booking.cancelTitle') || "Batalkan Booking"}
            </DialogTitle>
            <DialogDescription>
              {refundEligibility?.eligible 
                ? t('booking.refundDesc') || "Booking Anda memenuhi syarat untuk refund" 
                : t('booking.cancelDesc') || "Batalkan booking ini"}
            </DialogDescription>
          </DialogHeader>
          
          {refundEligibility?.eligible && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 space-y-2 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
                <RotateCcw className="h-5 w-5" />
                <span>{t('booking.refundEligible') || "Memenuhi Syarat Refund"}</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                {refundEligibility.message}
              </p>
              <div className="flex items-baseline gap-2 text-2xl font-bold text-green-700 dark:text-green-300">
                <span>{formatPrice(refundEligibility.refund_amount)}</span>
                <span className="text-sm font-normal">
                  ({refundEligibility.refund_percentage}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('booking.originalAmount') || "Dari total"}: {formatPrice(refundEligibility.original_amount)}
              </p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">
                {t('booking.cancelReason') || "Alasan Pembatalan"} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('booking.cancelReasonPlaceholder') || "Contoh: Tidak bisa datang, salah tanggal, dll."}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t('common.cancel') || "Batal"}
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelling}>
              {cancelling 
                ? t('common.processing') || "Memproses..." 
                : refundEligibility?.eligible 
                  ? t('booking.requestRefund') || "Ajukan Refund"
                  : t('booking.confirmCancel') || "Ya, Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBooking;
