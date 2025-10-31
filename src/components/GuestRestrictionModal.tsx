import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuestRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export const GuestRestrictionModal = ({ isOpen, onClose, feature }: GuestRestrictionModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">
            {t('guest.restriction.title') || 'Fitur Terbatas untuk Tamu'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('guest.restriction.message', { feature }) || `Fitur "${feature}" tidak tersedia untuk mode tamu. Daftar atau login untuk mengakses semua fitur.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-semibold">{t('guest.restriction.benefits.title') || 'Keuntungan Akun Terdaftar:'}</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>{t('guest.restriction.benefits.plan') || 'Buat dan simpan rencana perjalanan'}</li>
              <li>{t('guest.restriction.benefits.book') || 'Pesan tiket dan akomodasi'}</li>
              <li>{t('guest.restriction.benefits.review') || 'Tulis ulasan destinasi'}</li>
              <li>{t('guest.restriction.benefits.save') || 'Simpan destinasi favorit'}</li>
              <li>{t('guest.restriction.benefits.history') || 'Akses riwayat perjalanan'}</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:flex-col gap-2">
          <Link to="/register" className="w-full">
            <Button className="w-full">
              {t('guest.restriction.register') || 'Daftar Sekarang'}
            </Button>
          </Link>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              {t('guest.restriction.login') || 'Login'}
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
