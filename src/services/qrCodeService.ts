/**
 * QR Code Generation Service
 * Generates QR codes for e-tickets using QR Server API
 */

export interface QRCodeData {
  bookingCode: string;
  destinationName: string;
  customerName: string;
  visitDate: string;
  quantity: number;
  bookingId: number;
}

/**
 * Generate QR code URL using QR Server API (free service)
 * Alternative: Use qrcode library for local generation
 */
export const generateQRCodeURL = (data: QRCodeData): string => {
  // Format data untuk QR code
  const qrData = {
    code: data.bookingCode,
    destination: data.destinationName,
    name: data.customerName,
    date: data.visitDate,
    qty: data.quantity,
    id: data.bookingId,
    app: 'TravoMate',
  };

  // Convert to JSON string
  const qrString = JSON.stringify(qrData);

  // Encode for URL
  const encodedData = encodeURIComponent(qrString);

  // Generate QR code URL using QR Server API
  // Size: 300x300, error correction: M
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;

  return qrCodeURL;
};

/**
 * Generate QR code for booking after successful payment
 */
export const generateBookingQRCode = async (bookingData: {
  bookingId: number;
  bookingCode: string;
  destinationName: string;
  customerName: string;
  visitDate: string;
  quantity: number;
}): Promise<string> => {
  try {
    const qrCodeURL = generateQRCodeURL({
      bookingCode: bookingData.bookingCode,
      destinationName: bookingData.destinationName,
      customerName: bookingData.customerName,
      visitDate: bookingData.visitDate,
      quantity: bookingData.quantity,
      bookingId: bookingData.bookingId,
    });

    // Save QR code URL to database
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase
      .from('bookings')
      .update({ qr_code_url: qrCodeURL })
      .eq('id', bookingData.bookingId);

    if (error) {
      console.error('Failed to save QR code URL:', error);
      throw error;
    }

    console.log(`✅ QR code generated for booking ${bookingData.bookingCode}`);
    return qrCodeURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw error;
  }
};

/**
 * Parse QR code data back to object
 */
export const parseQRCodeData = (qrData: string): QRCodeData | null => {
  try {
    const parsed = JSON.parse(qrData);
    return {
      bookingCode: parsed.code,
      destinationName: parsed.destination,
      customerName: parsed.name,
      visitDate: parsed.date,
      quantity: parsed.qty,
      bookingId: parsed.id,
    };
  } catch (error) {
    console.error('Failed to parse QR code data:', error);
    return null;
  }
};

/**
 * Download QR code as image
 */
export const downloadQRCode = async (qrCodeURL: string, bookingCode: string): Promise<void> => {
  try {
    const response = await fetch(qrCodeURL);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravoMate-Ticket-${bookingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download QR code:', error);
    throw error;
  }
};

/**
 * Generate verification URL for QR code scanning
 */
export const generateVerificationURL = (bookingCode: string): string => {
  const baseURL = window.location.origin;
  return `${baseURL}/verify/${bookingCode}`;
};

