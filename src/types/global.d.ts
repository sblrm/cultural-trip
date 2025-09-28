
import { toast } from 'sonner';

declare global {
  interface Window {
    toast: typeof toast;
  }
}
