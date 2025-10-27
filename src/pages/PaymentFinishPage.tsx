/**
 * Payment Success Page
 * Shown after successful Midtrans payment
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkTransactionStatus, getPaymentStatusLabel } from '@/services/paymentService';

const PaymentFinishPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
  const transactionStatus = searchParams.get('transaction_status');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        // If no order_id from URL params, check transaction_status directly
        const urlStatus = transactionStatus || 'unknown';
        setStatus(urlStatus);
        return;
      }

      try {
        // Verify transaction status from server
        const data = await checkTransactionStatus(orderId);
        setOrderDetails(data);
        setStatus(data.transactionStatus);
      } catch (error) {
        console.error('Failed to verify transaction:', error);
        
        // Fallback to URL params if API check fails
        const fallbackStatus = transactionStatus || 'unknown';
        setStatus(fallbackStatus);
        
        // Create fallback order details from URL params
        if (orderId) {
          setOrderDetails({
            orderId: orderId,
            transactionStatus: fallbackStatus,
            statusCode: statusCode || '000',
            grossAmount: '0',
          });
        }
      }
    };

    verifyPayment();
  }, [orderId, transactionStatus, statusCode]);

  const isSuccess = status === 'settlement' || status === 'capture' || status === 'success';
  const isPending = status === 'pending';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memverifikasi status pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            {isSuccess ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Pembayaran Berhasil!</CardTitle>
                <CardDescription>
                  Terima kasih atas pembayaran Anda
                </CardDescription>
              </>
            ) : isPending ? (
              <>
                <Loader2 className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-spin" />
                <CardTitle className="text-2xl">Pembayaran Pending</CardTitle>
                <CardDescription>
                  Pembayaran Anda sedang diproses
                </CardDescription>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <CardTitle className="text-2xl">Status Pembayaran</CardTitle>
                <CardDescription>
                  {getPaymentStatusLabel(status)}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {orderDetails && orderDetails.grossAmount !== '0' && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{orderDetails.orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">Rp {parseInt(orderDetails.grossAmount).toLocaleString('id-ID')}</span>
                </div>
                {orderDetails.paymentType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Metode Pembayaran:</span>
                    <span className="capitalize">{orderDetails.paymentType?.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold">{getPaymentStatusLabel(status)}</span>
                </div>
              </div>
            )}

            {orderId && !orderDetails && status === 'unknown' && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Tiket telah dikirim ke email Anda. Silakan cek inbox atau folder spam.
                </p>
              </div>
            )}

            {isPending && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏳ Pembayaran Anda sedang diproses. Kami akan mengirimkan konfirmasi melalui email setelah pembayaran selesai.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/profile/mybooking')} 
                className="flex-1"
              >
                Lihat Pesanan Saya <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={() => navigate('/destinations')} 
                variant="outline"
                className="flex-1"
              >
                Kembali ke Destinasi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFinishPage;
