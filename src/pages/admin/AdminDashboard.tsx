import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  isAdmin,
  getAllDestinationsAdmin,
  deleteDestination,
  getAdminStats,
} from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  BarChart3, 
  MapPin, 
  Star,
  Loader2,
  Shield
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDestinations: 0, totalReviews: 0, totalBookings: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [isAuthenticated, user]);

  const checkAdminAccess = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    try {
      const hasAccess = await isAdmin();
      if (!hasAccess) {
        toast.error('Akses ditolak. Anda tidak memiliki hak admin.');
        navigate('/');
        return;
      }

      setAdminAccess(true);
      await Promise.all([loadDestinations(), loadStats()]);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Gagal memverifikasi akses admin');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadDestinations = async () => {
    try {
      const data = await getAllDestinationsAdmin();
      setDestinations(data);
    } catch (error) {
      console.error('Error loading destinations:', error);
      toast.error('Gagal memuat data destinasi');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await deleteDestination(deleteId);
      toast.success('Destinasi berhasil dihapus');
      await loadDestinations();
      await loadStats();
    } catch (error: any) {
      console.error('Error deleting destination:', error);
      toast.error(error.message || 'Gagal menghapus destinasi');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  if (!adminAccess) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Kelola destinasi budaya Indonesia</p>
          </div>
        </div>
        <Button onClick={() => navigate('/admin/destinations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Destinasi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Destinasi</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDestinations}</div>
            <p className="text-xs text-muted-foreground">Destinasi budaya terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Review</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Review dari pengguna</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Booking</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Booking yang terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Destinations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Destinasi</CardTitle>
          <CardDescription>
            Kelola semua destinasi budaya yang tersedia di platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada destinasi. Klik "Tambah Destinasi" untuk memulai.
                    </TableCell>
                  </TableRow>
                ) : (
                  destinations.map((dest) => (
                    <TableRow key={dest.id}>
                      <TableCell className="font-medium">{dest.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={dest.image}
                            alt={dest.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium">{dest.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{dest.city}</div>
                          <div className="text-muted-foreground">{dest.province}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dest.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {dest.price.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">Aktif</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/destinations/${dest.id}`)}
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/destinations/edit/${dest.id}`)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(dest.id)}
                            title="Hapus"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Destinasi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus destinasi ini? Tindakan ini tidak dapat dibatalkan
              dan akan menghapus semua data terkait termasuk review dan booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
