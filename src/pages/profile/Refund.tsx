import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRefunds, getUserBookings, requestRefund, checkRefundEligibility } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, RotateCcw, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface Refund {
  id: number;
  user_id: string;
  booking_id?: number;
  ticket_id?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  refund_amount?: number;
  refund_method?: string;
  rejection_reason?: string;
  requested_at: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  bookings?: {
    id: number;
    booking_code?: string;
    visit_date: string;
    total_price: number;
    status: string;
    destinations?: {
      id: number;
      name: string;
      city: string;
      province: string;
      image: string;
    };
  };
  tickets?: {
    id: number;
    visit_date: string;
    status: string;
    destinations?: {
      id: number;
      name: string;
      city: string;
      province: string;
      image: string;
    };
  };
}

interface Booking {
  id: number;
  destination_id: number;
  visit_date: string;
  total_price: number;
  booking_code?: string;
  destinations?: {
    id: number;
    name: string;
    city: string;
    province: string;
    image: string;
  };
}

const Refund = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  
  // Request refund modal
  const [requestOpen, setRequestOpen] = useState(false);
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [refundReason, setRefundReason] = useState('');
  const [refundEligibility, setRefundEligibility] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, [isAuthenticated, user?.id]);

  const loadRefunds = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const data = await getUserRefunds(user.id);
      setRefunds(data);
    } catch (e) {
      console.error(e);
      toast.error(t('refund.loadError') || "Gagal memuat data refund");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRefundClick = async () => {
    if (!user) return;
    
    try {
      // Load user's active bookings
      const bookings = await getUserBookings(user.id);
      // Filter only confirmed bookings that haven't been refunded
      const eligible = bookings.filter((b: any) => 
        b.status === 'confirmed' || b.status === 'paid'
      );
      setAvailableBookings(eligible);
      setRequestOpen(true);
    } catch (e) {
      console.error(e);
      toast.error(t('refund.loadBookingsError') || "Gagal memuat booking");
    }
  };

  const handleBookingSelect = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    
    if (!bookingId) {
      setRefundEligibility(null);
      return;
    }
    
    try {
      const eligibility = await checkRefundEligibility(parseInt(bookingId));
      setRefundEligibility(eligibility);
      
      if (!eligibility.eligible) {
        toast.warning(eligibility.message);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('refund.checkEligibilityError') || "Gagal mengecek kelayakan refund");
    }
  };

  const handleSubmitRefund = async () => {
    if (!user || !selectedBookingId) {
      toast.error(t('refund.selectBooking') || "Pilih booking yang ingin direfund");
      return;
    }
    
    if (!refundReason.trim()) {
      toast.error(t('refund.provideReason') || "Mohon isi alasan refund");
      return;
    }
    
    if (!refundEligibility?.eligible) {
      toast.error(t('refund.notEligible') || "Booking tidak memenuhi syarat refund");
      return;
    }
    
    setSubmitting(true);
    try {
      const result = await requestRefund(user.id, parseInt(selectedBookingId), refundReason);
      
      if (result.success) {
        toast.success(t('refund.requestSuccess') || "Permintaan refund berhasil diajukan");
        setRequestOpen(false);
        setSelectedBookingId('');
        setRefundReason('');
        setRefundEligibility(null);
        loadRefunds();
      } else {
        throw new Error(result.message);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('refund.requestError') || "Gagal mengajukan refund");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { 
        variant: "outline", 
        label: t('refund.status.pending') || "Menunggu",
        icon: Clock
      },
      approved: { 
        variant: "default", 
        label: t('refund.status.approved') || "Disetujui",
        icon: CheckCircle
      },
      rejected: { 
        variant: "destructive", 
        label: t('refund.status.rejected') || "Ditolak",
        icon: XCircle
      },
      completed: { 
        variant: "secondary", 
        label: t('refund.status.completed') || "Selesai",
        icon: CheckCircle
      },
      cancelled: { 
        variant: "outline", 
        label: t('refund.status.cancelled') || "Dibatalkan",
        icon: XCircle
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
        <h1 className="text-2xl font-bold mb-4">{t('refund.title') || "Refund"}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-muted-foreground">{t('refund.loading') || "Memuat refund..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('refund.title') || "Refund"}</h1>
        <Button onClick={handleRequestRefundClick}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('refund.requestNew') || "Ajukan Refund"}
        </Button>
      </div>

      {refunds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <RotateCcw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {t('refund.noRefunds') || "Tidak Ada Permintaan Refund"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('refund.noRefundsDesc') || "Anda belum pernah mengajukan refund"}
            </p>
            <Button onClick={handleRequestRefundClick} variant="outline">
              {t('refund.requestNew') || "Ajukan Refund"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => {
            const bookingData = refund.bookings || refund.tickets;
            const destination = bookingData?.destinations;

            return (
              <Card key={refund.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-muted">
                    <img
                      src={destination?.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                      alt={destination?.name}
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
                          <CardTitle className="text-lg mb-1 flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-primary" />
                            {destination?.name || t('refund.ticketRefund') || 'Refund Tiket'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3" />
                            {destination?.city}, {destination?.province}
                          </CardDescription>
                        </div>
                        {getStatusBadge(refund.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 space-y-2 text-sm">
                      {/* Refund ID */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {t('refund.refundId') || "ID Refund"}:
                        </span>
                        <span className="font-mono font-medium">#{refund.id}</span>
                      </div>

                      {/* Booking Code */}
                      {refund.bookings?.booking_code && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {t('refund.bookingCode') || "Kode Booking"}:
                          </span>
                          <span className="font-mono font-medium">{refund.bookings.booking_code}</span>
                        </div>
                      )}

                      {/* Requested Date */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{t('refund.requestedAt') || "Diajukan"}:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(refund.requested_at)}
                        </span>
                      </div>

                      {/* Processed Date */}
                      {refund.processed_at && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{t('refund.processedAt') || "Diproses"}:</span>
                          <span className="font-medium text-foreground">
                            {formatDate(refund.processed_at)}
                          </span>
                        </div>
                      )}

                      {/* Refund Amount */}
                      {refund.refund_amount && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-muted-foreground">
                            {t('refund.refundAmount') || "Nominal Refund"}:
                          </span>
                          <span className="font-semibold text-lg text-primary">
                            {formatPrice(refund.refund_amount)}
                          </span>
                        </div>
                      )}

                      {/* Reason */}
                      {refund.reason && (
                        <div className="pt-2 border-t">
                          <div className="text-muted-foreground mb-1">
                            {t('refund.reason') || "Alasan"}:
                          </div>
                          <div className="text-sm italic">{refund.reason}</div>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {refund.status === 'rejected' && refund.rejection_reason && (
                        <div className="pt-2 border-t">
                          <div className="text-destructive mb-1 font-medium">
                            {t('refund.rejectionReason') || "Alasan Penolakan"}:
                          </div>
                          <div className="text-sm text-destructive italic">
                            {refund.rejection_reason}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Refund Modal */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              {t('refund.requestTitle') || "Ajukan Permintaan Refund"}
            </DialogTitle>
            <DialogDescription>
              {t('refund.requestDesc') || "Pilih booking yang ingin direfund dan berikan alasan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Booking Selection */}
            <div className="space-y-2">
              <Label htmlFor="booking">
                {t('refund.selectBooking') || "Pilih Booking"} <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedBookingId} onValueChange={handleBookingSelect}>
                <SelectTrigger id="booking">
                  <SelectValue placeholder={t('refund.selectBookingPlaceholder') || "Pilih booking..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableBookings.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t('refund.noAvailableBookings') || "Tidak ada booking yang tersedia"}
                    </div>
                  ) : (
                    availableBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.destinations?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {booking.booking_code} • {formatDate(booking.visit_date)} • {formatPrice(booking.total_price)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Eligibility Info */}
            {refundEligibility && (
              <div className={`rounded-lg p-4 border ${
                refundEligibility.eligible 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <div className={`flex items-center gap-2 font-medium mb-2 ${
                  refundEligibility.eligible 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {refundEligibility.eligible ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span>
                    {refundEligibility.eligible 
                      ? t('refund.eligible') || "Memenuhi Syarat" 
                      : t('refund.notEligible') || "Tidak Memenuhi Syarat"}
                  </span>
                </div>
                <p className={`text-sm mb-2 ${
                  refundEligibility.eligible 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {refundEligibility.message}
                </p>
                {refundEligibility.eligible && (
                  <>
                    <div className={`flex items-baseline gap-2 text-2xl font-bold ${
                      refundEligibility.eligible 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      <span>{formatPrice(refundEligibility.refund_amount)}</span>
                      <span className="text-sm font-normal">
                        ({refundEligibility.refund_percentage}%)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('refund.from') || "Dari total"}: {formatPrice(refundEligibility.original_amount)}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                {t('refund.reason') || "Alasan Refund"} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder={t('refund.reasonPlaceholder') || "Contoh: Tidak bisa datang karena ada keperluan mendadak, salah memilih tanggal, dll."}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              {t('common.cancel') || "Batal"}
            </Button>
            <Button 
              onClick={handleSubmitRefund} 
              disabled={submitting || !refundEligibility?.eligible}
            >
              {submitting 
                ? t('common.processing') || "Memproses..." 
                : t('refund.submit') || "Ajukan Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Refund;
