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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDestinations: 0, totalReviews: 0, totalBookings: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedDestinations, setPaginatedDestinations] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, [isAuthenticated, user]);

  // Filter & Search effect
  useEffect(() => {
    if (destinations.length > 0) {
      applyFiltersAndSort();
    }
  }, [destinations, searchTerm, filterProvince, filterType, sortBy, sortOrder]);

  // Pagination effect
  useEffect(() => {
    if (filteredDestinations.length > 0) {
      applyPagination();
    } else {
      setPaginatedDestinations([]);
      setTotalPages(1);
    }
  }, [filteredDestinations, currentPage, itemsPerPage]);

  const applyFiltersAndSort = () => {
    let filtered = [...destinations];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(dest =>
        dest.name.toLowerCase().includes(search) ||
        dest.city.toLowerCase().includes(search) ||
        dest.province.toLowerCase().includes(search) ||
        dest.type.toLowerCase().includes(search)
      );
    }

    // Province filter
    if (filterProvince !== 'all') {
      filtered = filtered.filter(dest => dest.province === filterProvince);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(dest => dest.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA = a[sortBy];
      let compareB = b[sortBy];

      // Handle string comparison
      if (typeof compareA === 'string') {
        compareA = compareA.toLowerCase();
        compareB = compareB.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    setFilteredDestinations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const applyPagination = () => {
    const totalPages = Math.ceil(filteredDestinations.length / itemsPerPage);
    setTotalPages(totalPages);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredDestinations.slice(startIndex, endIndex);

    setPaginatedDestinations(paginated);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterProvince('all');
    setFilterType('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const getUniqueProvinces = () => {
    const provinces = destinations.map(dest => dest.province);
    return [...new Set(provinces)].sort();
  };

  const getUniqueTypes = () => {
    const types = destinations.map(dest => dest.type);
    return [...new Set(types)].sort();
  };

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
        <CardContent className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari destinasi, kota, provinsi, atau tipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Province Filter */}
            <Select value={filterProvince} onValueChange={setFilterProvince}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Semua Provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Provinsi</SelectItem>
                {getUniqueProvinces().map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {getUniqueTypes().map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Terbaru</SelectItem>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="price">Harga</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            {/* Reset Filters */}
            <Button variant="ghost" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Menampilkan {paginatedDestinations.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredDestinations.length)} dari {filteredDestinations.length} destinasi
              {searchTerm || filterProvince !== 'all' || filterType !== 'all' ? (
                <span className="ml-2 text-primary">(terfilter dari {destinations.length} total)</span>
              ) : null}
            </div>
            
            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span>Per halaman:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
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
                {paginatedDestinations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {destinations.length === 0 
                        ? 'Belum ada destinasi. Klik "Tambah Destinasi" untuk memulai.'
                        : 'Tidak ada destinasi yang sesuai dengan filter.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDestinations.map((dest) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => handlePageChange(page)}
                            className="w-9"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
