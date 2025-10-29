import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  quickAddToWishlist,
  removeFromWishlist,
  isInWishlist,
  getUserWishlists
} from '@/services/wishlistService';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  destinationId: number;
  destinationName?: string;
  variant?: 'default' | 'icon' | 'text';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export default function WishlistButton({
  destinationId,
  destinationName = 'destinasi',
  variant = 'default',
  size = 'default',
  className
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkWishlistStatus();
  }, [destinationId, isAuthenticated]);

  const checkWishlistStatus = async () => {
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }

    try {
      const status = await isInWishlist(destinationId);
      setInWishlist(status);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login untuk menyimpan favorit');
      return;
    }

    setLoading(true);

    try {
      if (inWishlist) {
        // Remove from wishlist
        const wishlists = await getUserWishlists();
        if (wishlists.length > 0) {
          await removeFromWishlist(wishlists[0].id, destinationId);
          setInWishlist(false);
          toast.success('Dihapus dari wishlist');
        }
      } else {
        // Add to wishlist
        await quickAddToWishlist(destinationId);
        setInWishlist(true);
        toast.success(`${destinationName} ditambahkan ke wishlist`);
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      
      if (error.message?.includes('sudah ada')) {
        toast.info('Destinasi sudah ada di wishlist');
        setInWishlist(true);
      } else if (error.message?.includes('Tidak ada wishlist')) {
        toast.error('Wishlist tidak ditemukan. Refresh halaman dan coba lagi.');
      } else {
        toast.error('Gagal mengubah wishlist');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return null; // Or skeleton
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        className={cn('p-2', className)}
        onClick={handleToggle}
        disabled={loading}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-colors',
            inWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
          )}
        />
      </Button>
    );
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size={size}
        className={className}
        onClick={handleToggle}
        disabled={loading}
      >
        <Heart
          className={cn(
            'h-4 w-4 mr-2 transition-colors',
            inWishlist ? 'fill-red-500 text-red-500' : ''
          )}
        />
        {inWishlist ? 'Tersimpan' : 'Simpan'}
      </Button>
    );
  }

  return (
    <Button
      variant={inWishlist ? 'default' : 'outline'}
      size={size}
      className={className}
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart
        className={cn(
          'h-4 w-4 mr-2 transition-colors',
          inWishlist ? 'fill-current' : ''
        )}
      />
      {inWishlist ? 'Tersimpan' : 'Simpan ke Wishlist'}
    </Button>
  );
}
