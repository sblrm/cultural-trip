/**
 * Midtrans Payment Service
 * 
 * Handles integration with Midtrans Snap payment gateway
 * Production-ready implementation with proper error handling
 */

import { supabase } from '@/lib/supabase';

// Midtrans Snap configuration
const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
const MIDTRANS_ENVIRONMENT = import.meta.env.VITE_MIDTRANS_ENVIRONMENT || 'sandbox';

// Midtrans Snap script URL
const SNAP_SCRIPT_URL =
  MIDTRANS_ENVIRONMENT === 'production'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

// API endpoint
const MIDTRANS_API_URL = '/api/midtrans';

/**
 * Transaction item details
 */
export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Customer details
 */
export interface CustomerDetails {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
}

/**
 * Payment metadata
 */
export interface PaymentMetadata {
  tripDataId?: number;
  userId?: string;
  bookingType?: 'trip' | 'ticket' | 'package';
  visitDate?: string; // ISO date string for visit date
}

/**
 * Create payment transaction parameters
 */
export interface CreateTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: CustomerDetails;
  itemDetails: TransactionItem[];
  metadata?: PaymentMetadata;
}

/**
 * Transaction status response
 */
export interface TransactionStatus {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
  grossAmount: string;
  paymentType?: string;
  transactionTime?: string;
  statusCode: string;
}

/**
 * Load Midtrans Snap script
 */
export const loadMidtransScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if ((window as any).snap) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = SNAP_SCRIPT_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    
    script.onload = () => {
      console.log('Midtrans Snap script loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
      reject(new Error('Failed to load Midtrans Snap script'));
    };

    document.body.appendChild(script);
  });
};

/**
 * Create payment transaction
 */
export const createTransaction = async (
  params: CreateTransactionParams
): Promise<{ token: string; redirectUrl: string; orderId: string }> => {
  try {
    const response = await fetch(`${MIDTRANS_API_URL}?action=create-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create transaction');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create transaction');
    }

    // Save transaction to database
    await saveTransactionToDb({
      orderId: data.orderId,
      userId: params.metadata?.userId,
      grossAmount: params.grossAmount,
      customerDetails: params.customerDetails,
      itemDetails: params.itemDetails,
      snapToken: data.token,
      redirectUrl: data.redirectUrl,
      metadata: params.metadata,
    });

    return {
      token: data.token,
      redirectUrl: data.redirectUrl,
      orderId: data.orderId,
    };
  } catch (error: any) {
    console.error('Create transaction error:', error);
    throw error;
  }
};

/**
 * Save transaction to Supabase database
 */
const saveTransactionToDb = async (data: {
  orderId: string;
  userId?: string;
  grossAmount: number;
  customerDetails: CustomerDetails;
  itemDetails: TransactionItem[];
  snapToken: string;
  redirectUrl: string;
  metadata?: PaymentMetadata;
}) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || data.userId;

    const insertData = {
      order_id: data.orderId,
      user_id: userId,
      booking_type: data.metadata?.bookingType || 'trip',
      transaction_status: 'pending',
      gross_amount: data.grossAmount,
      currency: 'IDR',
      customer_name: `${data.customerDetails.firstName} ${data.customerDetails.lastName || ''}`.trim(),
      customer_email: data.customerDetails.email,
      customer_phone: data.customerDetails.phone,
      snap_token: data.snapToken,
      redirect_url: data.redirectUrl,
      trip_data_id: data.metadata?.tripDataId || null,
      item_details: data.itemDetails,
      transaction_time: new Date().toISOString(),
    };

    console.log('Saving transaction to database:', insertData);

    const { error } = await supabase.from('transactions').insert(insertData);

    if (error) {
      console.error('Failed to save transaction to database:', error);
      // Don't throw - payment can still proceed
    } else {
      console.log('✅ Transaction saved successfully:', data.orderId);
    }
  } catch (error) {
    console.error('Database save error:', error);
    // Don't throw - payment can still proceed
  }
};

/**
 * Show Midtrans Snap payment popup
 */
export const showSnapPayment = async (
  snapToken: string,
  callbacks?: {
    onSuccess?: (result: any) => void;
    onPending?: (result: any) => void;
    onError?: (result: any) => void;
    onClose?: () => void;
  }
): Promise<void> => {
  // Ensure script is loaded
  await loadMidtransScript();

  const snap = (window as any).snap;
  
  if (!snap) {
    throw new Error('Midtrans Snap not initialized');
  }

  snap.pay(snapToken, {
    onSuccess: (result: any) => {
      console.log('Payment success:', result);
      updateTransactionStatus(result.order_id, 'success', result);
      callbacks?.onSuccess?.(result);
    },
    onPending: (result: any) => {
      console.log('Payment pending:', result);
      updateTransactionStatus(result.order_id, 'pending', result);
      callbacks?.onPending?.(result);
    },
    onError: (result: any) => {
      console.error('Payment error:', result);
      updateTransactionStatus(result.order_id, 'failed', result);
      callbacks?.onError?.(result);
    },
    onClose: () => {
      console.log('Payment popup closed');
      callbacks?.onClose?.();
    },
  });
};

/**
 * Update transaction status in database
 */
const updateTransactionStatus = async (
  orderId: string,
  status: string,
  midtransResponse?: any
) => {
  try {
    const updateData: any = {
      transaction_status: status,
      updated_at: new Date().toISOString(),
    };

    if (midtransResponse) {
      updateData.midtrans_response = midtransResponse;
      updateData.payment_type = midtransResponse.payment_type;
      updateData.fraud_status = midtransResponse.fraud_status;
    }

    if (status === 'success') {
      updateData.settlement_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('order_id', orderId);

    if (error) {
      console.error('Failed to update transaction status:', error);
    }
  } catch (error) {
    console.error('Update transaction status error:', error);
  }
};

/**
 * Check transaction status
 */
export const checkTransactionStatus = async (
  orderId: string
): Promise<TransactionStatus> => {
  try {
    const response = await fetch(
      `${MIDTRANS_API_URL}?action=check-status&orderId=${orderId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check transaction status');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to check transaction status');
    }

    // Update local database
    await updateTransactionStatus(orderId, data.data.transactionStatus, data.data);

    return data.data;
  } catch (error: any) {
    console.error('Check transaction status error:', error);
    throw error;
  }
};

/**
 * Generate unique order ID
 */
export const generateOrderId = (prefix: string = 'TRV'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format currency to IDR
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get payment status color for UI
 */
export const getPaymentStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    success: 'text-green-600 bg-green-50',
    settlement: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    cancel: 'text-red-600 bg-red-50',
    deny: 'text-red-600 bg-red-50',
    expire: 'text-gray-600 bg-gray-50',
    challenge: 'text-orange-600 bg-orange-50',
  };
  
  return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-50';
};

/**
 * Get payment status label for UI
 */
export const getPaymentStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Menunggu Pembayaran',
    success: 'Berhasil',
    settlement: 'Berhasil',
    failed: 'Gagal',
    cancel: 'Dibatalkan',
    deny: 'Ditolak',
    expire: 'Kadaluarsa',
    challenge: 'Verifikasi',
  };
  
  return statusLabels[status.toLowerCase()] || status;
};
