/**
 * Midtrans Payment Gateway API
 * 
 * Handles payment creation and webhook notifications
 * Uses Midtrans Snap for seamless checkout experience
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import midtransClient from 'midtrans-client';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize Midtrans Snap client
const getSnapClient = () => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY not configured');
  }

  return new midtransClient.Snap({
    isProduction: process.env.VITE_MIDTRANS_ENVIRONMENT === 'production',
    serverKey: serverKey,
    clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY || '',
  });
};

// Initialize Core API for transaction status
const getCoreApiClient = () => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY not configured');
  }

  return new midtransClient.CoreApi({
    isProduction: process.env.VITE_MIDTRANS_ENVIRONMENT === 'production',
    serverKey: serverKey,
    clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY || '',
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'create-transaction':
        return await createTransaction(req, res);
      
      case 'check-status':
        return await checkTransactionStatus(req, res);
      
      case 'notification':
        return await handleNotification(req, res);
      
      default:
        return res.status(400).json({
          error: 'Invalid action. Use: create-transaction, check-status, or notification',
        });
    }
  } catch (error: any) {
    console.error('Midtrans API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Create Midtrans Snap transaction
 */
async function createTransaction(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      orderId,
      grossAmount,
      customerDetails,
      itemDetails,
      metadata,
    } = req.body;

    // Validate required fields
    if (!orderId || !grossAmount || !customerDetails) {
      return res.status(400).json({
        error: 'Missing required fields: orderId, grossAmount, customerDetails',
      });
    }

    const snap = getSnapClient();

    // Prepare transaction parameters
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName || '',
        email: customerDetails.email,
        phone: customerDetails.phone || '',
      },
      item_details: itemDetails || [
        {
          id: 'TRIP-001',
          price: grossAmount,
          quantity: 1,
          name: 'Trip Package',
        },
      ],
      callbacks: {
        finish: `${process.env.APP_URL || 'http://localhost:5173'}/payment/finish`,
        error: `${process.env.APP_URL || 'http://localhost:5173'}/payment/error`,
        pending: `${process.env.APP_URL || 'http://localhost:5173'}/payment/pending`,
      },
      credit_card: {
        secure: true,
      },
      custom_field1: metadata?.tripDataId || '',
      custom_field2: metadata?.userId || '',
      custom_field3: metadata?.bookingType || 'trip',
    };

    // Create transaction
    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId: orderId,
    });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
      message: error.message,
    });
  }
}

/**
 * Check transaction status
 */
async function checkTransactionStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid orderId parameter',
      });
    }

    const coreApi = getCoreApiClient();
    const statusResponse = await coreApi.transaction.status(orderId);

    return res.status(200).json({
      success: true,
      data: {
        orderId: statusResponse.order_id,
        transactionStatus: statusResponse.transaction_status,
        fraudStatus: statusResponse.fraud_status,
        grossAmount: statusResponse.gross_amount,
        paymentType: statusResponse.payment_type,
        transactionTime: statusResponse.transaction_time,
        statusCode: statusResponse.status_code,
      },
    });
  } catch (error: any) {
    console.error('Check status error:', error);
    
    // Handle 404 - transaction not found
    if (error.httpStatusCode === 404) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to check transaction status',
      message: error.message,
    });
  }
}

/**
 * Handle Midtrans webhook notification
 * Supports: transaction, recurring, and pay-account notifications
 */
async function handleNotification(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notification = req.body;
    const notificationType = (req.query.type as string) || 'transaction';

    console.log('Notification received:', {
      type: notificationType,
      order_id: notification.order_id,
      subscription_id: notification.subscription_id,
      account_id: notification.account_id,
    });

    // Route to appropriate handler based on notification type
    switch (notificationType) {
      case 'recurring':
        return await handleRecurringNotification(notification, res);
      
      case 'pay-account':
        return await handlePayAccountNotification(notification, res);
      
      default:
        return await handleTransactionNotification(notification, res);
    }
  } catch (error: any) {
    console.error('Notification handling error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process notification',
      message: error.message,
    });
  }
}

/**
 * Handle transaction payment notification
 */
async function handleTransactionNotification(notification: any, res: VercelResponse) {
  try {
    const coreApi = getCoreApiClient();

    // Verify notification authenticity
    const statusResponse = await coreApi.transaction.notification(notification);

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
    } = statusResponse;

    console.log('Transaction notification:', {
      orderId: order_id,
      transactionStatus: transaction_status,
      fraudStatus: fraud_status,
      paymentType: payment_type,
    });

    // Determine final status
    let finalStatus = 'pending';
    
    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        finalStatus = 'success';
      } else if (fraud_status === 'challenge') {
        finalStatus = 'challenge';
      }
    } else if (transaction_status === 'settlement') {
      finalStatus = 'success';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      finalStatus = 'failed';
    } else if (transaction_status === 'pending') {
      finalStatus = 'pending';
    }

    // TODO: Update database with payment status
    // Example: await updateTransactionStatus(order_id, finalStatus, statusResponse);
    
    console.log(`Transaction ${order_id} status updated to: ${finalStatus}`);

    return res.status(200).json({
      success: true,
      message: 'Transaction notification processed',
      status: finalStatus,
    });
  } catch (error: any) {
    console.error('Transaction notification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process transaction notification',
      message: error.message,
    });
  }
}

/**
 * Handle recurring/subscription notification
 */
async function handleRecurringNotification(notification: any, res: VercelResponse) {
  try {
    const {
      subscription_id,
      transaction_status,
      order_id,
      payment_type,
    } = notification;

    console.log('Recurring notification:', {
      subscriptionId: subscription_id,
      orderId: order_id,
      transactionStatus: transaction_status,
      paymentType: payment_type,
    });

    // TODO: Update subscription status in database
    // Example: await updateSubscriptionStatus(subscription_id, transaction_status);

    return res.status(200).json({
      success: true,
      message: 'Recurring notification processed',
    });
  } catch (error: any) {
    console.error('Recurring notification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process recurring notification',
      message: error.message,
    });
  }
}

/**
 * Handle pay account linking notification
 */
async function handlePayAccountNotification(notification: any, res: VercelResponse) {
  try {
    const {
      account_id,
      account_status,
      payment_type,
    } = notification;

    console.log('Pay Account notification:', {
      accountId: account_id,
      accountStatus: account_status,
      paymentType: payment_type,
    });

    // TODO: Update linked account status in database
    // Example: await updatePayAccountStatus(account_id, account_status);

    return res.status(200).json({
      success: true,
      message: 'Pay Account notification processed',
    });
  } catch (error: any) {
    console.error('Pay Account notification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process pay account notification',
      message: error.message,
    });
  }
}
