# Midtrans Payment Gateway Integration

Production-ready integration dengan Midtrans payment gateway untuk sistem pembayaran tiket wisata.

## 📋 Features

- ✅ **Midtrans Snap Integration** - Seamless payment popup
- ✅ **Multiple Payment Methods** - Credit card, bank transfer, e-wallet, convenience store
- ✅ **Transaction Tracking** - Database untuk monitor semua transaksi
- ✅ **Webhook Notifications** - Real-time payment status updates
- ✅ **Security** - Server-side API key management
- ✅ **Error Handling** - Comprehensive error handling dan user feedback
- ✅ **Payment Status Pages** - Success, pending, dan error pages

## 🔧 Setup

### 1. Environment Variables

Update `.env` file dengan Midtrans credentials:

```bash
# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-GkyMPSAEnrAzM1DMNzepISnB
MIDTRANS_MERCHANT_ID=G404807411
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-hdE4MHh7J0QtxgAn
VITE_MIDTRANS_ENVIRONMENT=sandbox  # 'sandbox' or 'production'
```

**Important:**
- `MIDTRANS_SERVER_KEY` - Server-side only, TIDAK exposed ke browser
- `VITE_MIDTRANS_CLIENT_KEY` - Safe untuk exposed ke browser (untuk Snap script)
- Set `VITE_MIDTRANS_ENVIRONMENT=production` untuk production deployment

### 2. Database Migration

Jalankan SQL migration untuk create transactions table:

```bash
# Di Supabase SQL Editor
supabase/migrations/add_transactions_table.sql
```

Table ini akan store:
- Order details (order_id, amount, status)
- Customer information
- Payment metadata
- Midtrans response data
- Transaction timestamps

### 3. Vercel Environment Variables

Untuk deployment di Vercel, tambahkan environment variables:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `MIDTRANS_SERVER_KEY` = `SB-Mid-server-GkyMPSAEnrAzM1DMNzepISnB`
   - `MIDTRANS_MERCHANT_ID` = `G404807411`
   - `VITE_MIDTRANS_CLIENT_KEY` = `SB-Mid-client-hdE4MHh7J0QtxgAn`
   - `VITE_MIDTRANS_ENVIRONMENT` = `sandbox` (atau `production`)
3. Redeploy aplikasi

## 🏗️ Architecture

### API Endpoints (`/api/midtrans`)

**1. Create Transaction**
```typescript
POST /api/midtrans?action=create-transaction

Body:
{
  orderId: string,
  grossAmount: number,
  customerDetails: {
    firstName: string,
    lastName?: string,
    email: string,
    phone?: string
  },
  itemDetails: [
    {
      id: string,
      name: string,
      price: number,
      quantity: number
    }
  ],
  metadata?: {
    tripDataId?: number,
    userId?: string,
    bookingType?: 'trip' | 'ticket' | 'package'
  }
}

Response:
{
  success: true,
  token: string,        // Snap token untuk payment popup
  redirectUrl: string,  // Alternative redirect URL
  orderId: string
}
```

**2. Check Transaction Status**
```typescript
GET /api/midtrans?action=check-status&orderId=ORDER-123

Response:
{
  success: true,
  data: {
    orderId: string,
    transactionStatus: string,
    fraudStatus?: string,
    grossAmount: string,
    paymentType?: string,
    transactionTime?: string,
    statusCode: string
  }
}
```

**3. Webhook Notification**
```typescript
POST /api/midtrans?action=notification

Body: (Otomatis dari Midtrans)
{
  order_id: string,
  transaction_status: string,
  // ... other Midtrans notification fields
}
```

### Frontend Services (`src/services/paymentService.ts`)

**Key Functions:**

```typescript
// Load Midtrans Snap script
await loadMidtransScript();

// Create transaction
const { token } = await createTransaction({
  orderId: generateOrderId('TICKET'),
  grossAmount: 100000,
  customerDetails: { ... },
  itemDetails: [ ... ],
  metadata: { ... }
});

// Show payment popup
await showSnapPayment(token, {
  onSuccess: (result) => { ... },
  onPending: (result) => { ... },
  onError: (result) => { ... },
  onClose: () => { ... }
});

// Check status
const status = await checkTransactionStatus(orderId);
```

## 💳 Payment Flow

1. **User fills checkout form** → `CheckoutPage.tsx`
2. **Click "Lanjutkan ke Pembayaran"**
3. **Frontend calls** `createTransaction()` → Creates order in database
4. **API returns** Snap token
5. **Frontend shows** Midtrans Snap popup
6. **User completes payment** in popup
7. **Midtrans sends** webhook notification to `/api/midtrans?action=notification`
8. **Database updated** with payment status
9. **User redirected** to success/pending/error page
10. **Email sent** dengan ticket (if success)

## 🧪 Testing

### Sandbox Test Cards

Midtrans provides test cards untuk testing:

**Success Payment:**
- Card Number: `4811 1111 1111 1114`
- CVV: `123`
- Expiry: Any future date

**Challenge/FDS:**
- Card Number: `4511 1111 1111 1112`

**Denied:**
- Card Number: `4911 1111 1111 1113`

### Test Bank Transfer

- Select "Bank Transfer"
- Choose bank (BCA, Mandiri, BNI, etc.)
- Copy VA number
- Use Midtrans simulator untuk simulate payment

### Test E-Wallet

- GoPay: Akan show QR code, gunakan Midtrans simulator
- ShopeePay: Akan redirect ke simulator

## 📱 Payment Methods Supported

- 💳 **Credit/Debit Card** - Visa, Mastercard, JCB, Amex
- 🏦 **Bank Transfer** - BCA, Mandiri, BNI, BRI, Permata, CIMB
- 🏪 **Convenience Store** - Indomaret, Alfamart
- 📱 **E-Wallet** - GoPay, ShopeePay, QRIS
- 💰 **Direct Debit** - BCA KlikPay, CIMB Clicks, Danamon Online
- 📦 **Installment** - Credit card installment (BCA, Mandiri, BNI)

## 🔐 Security Features

1. **Server-side Key Management**
   - Server key never exposed ke browser
   - Client key safe untuk public use

2. **Transaction Verification**
   - Webhook signature verification
   - Double-check transaction status via API

3. **Database Security**
   - Row Level Security (RLS) enabled
   - Users can only see their own transactions

4. **HTTPS Only**
   - All communications encrypted
   - Midtrans requires HTTPS for production

## 📊 Transaction Status

| Status | Description |
|--------|-------------|
| `pending` | Pembayaran belum selesai |
| `settlement` | Pembayaran berhasil |
| `capture` | Credit card capture berhasil |
| `deny` | Pembayaran ditolak |
| `cancel` | Pembayaran dibatalkan |
| `expire` | Pembayaran kadaluarsa |
| `challenge` | Perlu verifikasi fraud |

## 🔔 Webhook Configuration

Setup Midtrans webhook notification URL:

1. Login ke [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Settings → Configuration
3. Payment Notification URL: `https://your-domain.com/api/midtrans?action=notification`
4. Finish Redirect URL: `https://your-domain.com/payment/finish`
5. Error Redirect URL: `https://your-domain.com/payment/error`
6. Unfinish Redirect URL: `https://your-domain.com/payment/pending`

## 🚀 Production Deployment

### Checklist:

- [ ] Update `VITE_MIDTRANS_ENVIRONMENT` to `production`
- [ ] Replace sandbox keys dengan production keys:
  - Get dari Midtrans Dashboard → Settings → Access Keys
- [ ] Setup webhook URL di Midtrans Dashboard
- [ ] Test semua payment methods di production
- [ ] Enable 3DS (3D Secure) untuk credit cards
- [ ] Setup email notifications
- [ ] Monitor transactions di Midtrans Dashboard

### Production Keys Location:

Midtrans Dashboard → Settings → Access Keys → Production

**NEVER commit production keys to Git!**

## 📖 API Documentation

Full Midtrans API documentation:
- [Snap API](https://docs.midtrans.com/en/snap/overview)
- [Core API](https://docs.midtrans.com/en/core-api/overview)
- [Notification](https://docs.midtrans.com/en/after-payment/http-notification)

## 🐛 Troubleshooting

**Problem: Payment popup not showing**
- Check console for script loading errors
- Verify `VITE_MIDTRANS_CLIENT_KEY` is set correctly
- Check if `loadMidtransScript()` completed successfully

**Problem: Webhook not working**
- Verify webhook URL is accessible (HTTPS required)
- Check Midtrans Dashboard logs
- Verify signature validation

**Problem: Transaction not found**
- Order ID must be unique
- Check database for transaction record
- Verify transaction created before calling Snap

## 📞 Support

- Midtrans Support: [https://support.midtrans.com](https://support.midtrans.com)
- Documentation: [https://docs.midtrans.com](https://docs.midtrans.com)
- Status Page: [https://status.midtrans.com](https://status.midtrans.com)

## 📝 Notes

- Sandbox environment untuk testing ONLY
- Production requires business verification
- Test semua payment methods sebelum go-live
- Monitor transaction dashboard regularly
- Keep credentials secure dan never commit ke Git
