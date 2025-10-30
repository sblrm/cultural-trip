export interface TripPlan {
  destinations: any[]; // Destination array
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  startDate?: string;
}

export interface ShareableItinerary {
  title: string;
  description: string;
  url: string;
  image?: string;
}

/**
 * Share trip plan to social media platforms
 */
export const shareToSocialMedia = (platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram', data: ShareableItinerary) => {
  const { title, description, url, image } = data;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  let shareUrl = '';

  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
      break;
  }

  window.open(shareUrl, '_blank', 'width=600,height=400');
};

/**
 * Copy link to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Generate shareable itinerary text
 */
export const generateItineraryText = (tripPlan: TripPlan): string => {
  const { destinations, totalDistance, totalDuration, totalCost, startDate } = tripPlan;
  
  let text = `🗺️ Rencana Wisata Budaya Indonesia\n\n`;
  
  if (startDate) {
    text += `📅 Tanggal: ${new Date(startDate).toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n\n`;
  }

  text += `📍 Destinasi (${destinations.length}):\n`;
  destinations.forEach((dest, index) => {
    text += `${index + 1}. ${dest.name} - ${dest.location.city}, ${dest.location.province}\n`;
  });

  text += `\n📊 Ringkasan:\n`;
  text += `• Jarak Total: ${totalDistance.toFixed(1)} km\n`;
  text += `• Durasi Total: ${Math.round(totalDuration)} menit\n`;
  text += `• Estimasi Biaya: Rp ${totalCost.toLocaleString('id-ID')}\n`;
  text += `\nDirencanakan dengan TravoMate - Aplikasi Wisata Budaya Indonesia 🇮🇩`;

  return text;
};

/**
 * Use Web Share API if available
 */
export const shareNative = async (data: ShareableItinerary): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.description,
      url: data.url,
    });
    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Error sharing:', err);
    }
    return false;
  }
};

/**
 * Download itinerary as image (for card generation)
 */
export const downloadAsImage = async (elementId: string, filename: string = 'itinerary.png') => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};
