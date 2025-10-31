import { AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const GuestBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-amber-900 dark:text-amber-100">
            {t('guest.banner.message') || 'Anda sedang menjelajah sebagai tamu dengan fitur terbatas.'}{" "}
            <Link to="/register" className="font-semibold underline hover:text-amber-700 dark:hover:text-amber-300">
              {t('guest.banner.register') || 'Daftar sekarang'}
            </Link>
            {" "}{t('guest.banner.forFullAccess') || 'untuk akses penuh'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
