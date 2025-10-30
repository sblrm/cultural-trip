import { useState } from "react";
import { Share2, Facebook, Twitter, MessageCircle, Send, Link as LinkIcon, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { shareToSocialMedia, copyToClipboard, shareNative, type ShareableItinerary } from "@/services/socialSharing";

interface ShareButtonProps {
  data: ShareableItinerary;
  onDownload?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

const ShareButton = ({ 
  data, 
  onDownload, 
  variant = "default", 
  size = "default",
  showLabel = true 
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 'native') => {
    if (platform === 'native') {
      const success = await shareNative(data);
      if (success) {
        toast.success("Dibagikan!");
        return;
      }
      // Fallback to copy link if native share fails
      handleCopyLink();
    } else {
      shareToSocialMedia(platform, data);
      toast.success(`Membuka ${platform}...`);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(data.url);
    if (success) {
      setCopied(true);
      toast.success("Link disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Gagal menyalin link");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Bagikan</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Native Share (if supported) */}
        {navigator.share && (
          <>
            <DropdownMenuItem onClick={() => handleShare('native')}>
              <Share2 className="h-4 w-4 mr-2" />
              Bagikan...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Social Media Platforms */}
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          Twitter (X)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('telegram')}>
          <Send className="h-4 w-4 mr-2 text-blue-500" />
          Telegram
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Link Disalin!
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" />
              Salin Link
            </>
          )}
        </DropdownMenuItem>

        {/* Download as Image */}
        {onDownload && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Gambar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
