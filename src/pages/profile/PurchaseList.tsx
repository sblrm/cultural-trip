import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPurchases } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Receipt, Download, ShoppingCart, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Purchase {
  id: number;
  user_id: string;
  destination_id: number;
  booking_date: string;
  visit_date: string;
  quantity: number;
  ticket_quantity: number;
  total_price: number;
  status: 'used' | 'refunded' | 'cancelled';
  booking_code?: string;
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
    gross_amount: number;
  };
  purchases?: Array<{
    id: number;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
  }>;
}

const PurchaseList = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    loadPurchases();
  }, [isAuthenticated, user?.id]);

  const loadPurchases = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const data = await getUserPurchases(user.id);
      setPurchases(data);
    } catch (e) {
      console.error(e);
      toast.error(t('purchase.loadError') || "Gagal memuat riwayat pembelian");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      used: { 
        variant: "secondary", 
        label: t('purchase.status.completed') || "Selesai"
      },
      refunded: { 
        variant: "outline", 
        label: t('purchase.status.refunded') || "Refunded"
      },
      cancelled: { 
        variant: "destructive", 
        label: t('purchase.status.cancelled') || "Dibatalkan"
      },
    };

    const config = variants[status] || { 
      variant: "outline", 
      label: status 
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  const handleBuyAgain = (destinationId: number) => {
    navigate(`/destinations/${destinationId}`);
  };

  const handleDownloadInvoice = (purchase: Purchase) => {
    // TODO: Implement PDF invoice generation
    toast.info(t('purchase.downloadInvoice') || "Fitur download invoice sedang dalam pengembangan");
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">{t('purchase.title') || "Purchase List"}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-muted-foreground">{t('purchase.loading') || "Memuat pembelian..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('purchase.title') || "Purchase List"}</h1>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {t('purchase.noPurchases') || "Belum Ada Pembelian"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('purchase.noPurchasesDesc') || "Riwayat transaksi Anda akan muncul di sini"}
            </p>
            <Button onClick={() => navigate('/destinations')}>
              {t('purchase.startExploring') || "Mulai Jelajahi"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const transactionId = purchase.transactions?.order_id || purchase.booking_code || `#${purchase.id}`;
            const purchaseDate = purchase.purchases?.[0]?.created_at || purchase.created_at;
            const paymentMethod = purchase.transactions?.payment_type || purchase.purchases?.[0]?.payment_method || '-';

            return (
              <Card key={purchase.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-muted">
                    <img
                      src={purchase.destinations?.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image'}
                      alt={purchase.destinations?.name}
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
                            {purchase.destinations?.name || 'Pembelian Tiket'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3" />
                            {purchase.destinations?.city}, {purchase.destinations?.province}
                          </CardDescription>
                        </div>
                        {getStatusBadge(purchase.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 space-y-2 text-sm">
                      {/* Transaction ID */}
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {t('purchase.transactionId') || "No. Transaksi"}:
                        </span>
                        <span className="font-mono font-medium">{transactionId}</span>
                      </div>

                      {/* Purchase Date */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{t('purchase.purchaseDate') || "Tanggal Pembelian"}:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(purchaseDate)}
                        </span>
                      </div>

                      {/* Visit Date */}
                      {purchase.visit_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{t('purchase.visitDate') || "Tanggal Kunjungan"}:</span>
                          <span className="font-medium text-foreground">
                            {formatDate(purchase.visit_date)}
                          </span>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {t('purchase.quantity') || "Jumlah"}:
                        </span>
                        <span className="font-medium">
                          {purchase.ticket_quantity || purchase.quantity} {t('purchase.tickets') || "tiket"}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {t('purchase.paymentMethod') || "Metode Pembayaran"}:
                        </span>
                        <span className="font-medium capitalize">{paymentMethod}</span>
                      </div>

                      {/* Total Price */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-muted-foreground">{t('purchase.total') || "Total"}:</span>
                        <span className="font-semibold text-lg text-primary">
                          {formatPrice(purchase.total_price)}
                        </span>
                      </div>
                    </CardContent>

                    {/* Actions */}
                    <CardFooter className="p-0 pt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBuyAgain(purchase.destination_id)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {t('purchase.buyAgain') || "Beli Lagi"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(purchase)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('purchase.downloadInvoice') || "Unduh Invoice"}
                      </Button>

                      {purchase.status === 'refunded' && (
                        <Badge variant="secondary" className="ml-auto">
                          {t('purchase.refundCompleted') || "Refund Selesai"}
                        </Badge>
                      )}
                    </CardFooter>
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
