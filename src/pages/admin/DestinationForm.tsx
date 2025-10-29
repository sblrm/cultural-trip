import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createDestination, 
  updateDestination,
  uploadDestinationImage,
  isAdmin,
} from '@/services/adminService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';

const destinationSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  city: z.string().min(2, 'Kota harus diisi'),
  province: z.string().min(2, 'Provinsi harus diisi'),
  type: z.string().min(2, 'Tipe harus diisi'),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid'),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid'),
  hours_open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format: HH:MM'),
  hours_close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format: HH:MM'),
  duration: z.number().min(15, 'Durasi minimal 15 menit').max(1440, 'Durasi maksimal 24 jam'),
  description: z.string().min(50, 'Deskripsi minimal 50 karakter'),
  image: z.string().url('URL gambar tidak valid'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  transportation: z.string().min(1, 'Minimal 1 transportasi'),
});

type FormData = z.infer<typeof destinationSchema>;

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'Kepulauan Riau',
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Banten', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan',
  'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara',
  'Papua', 'Papua Barat', 'Papua Tengah', 'Papua Pegunungan', 'Papua Selatan', 'Papua Barat Daya'
];

const DESTINATION_TYPES = [
  'Candi & Warisan Sejarah',
  'Kehidupan Adat & Arsitektur',
  'Museum & Warisan Sejarah',
  'Kerajinan Tradisional',
  'Warisan Kerajaan & Seni Pertunjukan',
  'Tradisi Kematian & Arsitektur',
  'Seni Pertunjukan & Musik',
  'Kuliner Tradisional',
];

export default function DestinationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      hours_open: '08:00',
      hours_close: '17:00',
      duration: 120,
      price: 0,
    },
  });

  const imageUrl = watch('image');

  // Check admin status with proper loading handling
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/login');
        return;
      }

      // Check if user is admin
      try {
        const adminStatus = await isAdmin();
        setIsAdminUser(adminStatus);
        
        if (!adminStatus) {
          toast.error('Akses ditolak. Halaman ini hanya untuk admin.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Gagal memverifikasi akses admin');
        navigate('/');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user, authLoading, navigate]);

  useEffect(() => {
    if (imageUrl) {
      setImagePreview(imageUrl);
    }
  }, [imageUrl]);

  // Load destination data for edit mode
  useEffect(() => {
    if (!isCheckingAdmin && isAdminUser && isEditMode) {
      loadDestination();
    }
  }, [id, isCheckingAdmin, isAdminUser, isEditMode]);

  const loadDestination = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Populate form with existing data
      setValue('name', data.name);
      setValue('city', data.city);
      setValue('province', data.province);
      setValue('type', data.type);
      setValue('latitude', data.latitude);
      setValue('longitude', data.longitude);
      setValue('hours_open', data.hours.open);
      setValue('hours_close', data.hours.close);
      setValue('duration', data.duration);
      setValue('description', data.description);
      setValue('image', data.image);
      setValue('price', data.price);
      setValue('transportation', data.transportation.join(', '));
    } catch (error: any) {
      console.error('Error loading destination:', error);
      toast.error('Gagal memuat data destinasi');
      navigate('/admin');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadDestinationImage(file);
      setValue('image', imageUrl);
      setImagePreview(imageUrl);
      toast.success('Gambar berhasil diupload');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Gagal mengupload gambar');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const destinationData = {
        name: data.name,
        city: data.city,
        province: data.province,
        type: data.type,
        latitude: data.latitude,
        longitude: data.longitude,
        hours: {
          open: data.hours_open,
          close: data.hours_close,
        },
        duration: data.duration,
        description: data.description,
        image: data.image,
        price: data.price,
        transportation: data.transportation.split(',').map(t => t.trim()),
      };

      if (isEditMode) {
        await updateDestination(Number(id), destinationData);
        toast.success('Destinasi berhasil diupdate');
      } else {
        await createDestination(destinationData);
        toast.success('Destinasi berhasil ditambahkan');
      }

      navigate('/admin');
    } catch (error: any) {
      console.error('Error saving destination:', error);
      toast.error(error.message || 'Gagal menyimpan destinasi');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth and admin status
  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div>
            <p className="text-lg font-medium">Memverifikasi Akses</p>
            <p className="text-sm text-muted-foreground mt-1">Mohon tunggu...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Destinasi' : 'Tambah Destinasi Baru'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Update informasi destinasi budaya'
              : 'Tambahkan destinasi budaya baru ke database'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nama Destinasi */}
            <div className="space-y-2">
              <Label htmlFor="name">Nama Destinasi *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Candi Borobudur"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Lokasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Kota *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Magelang"
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Provinsi *</Label>
                <Select
                  onValueChange={(value) => setValue('province', value)}
                  defaultValue={watch('province')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-sm text-destructive">{errors.province.message}</p>
                )}
              </div>
            </div>

            {/* Tipe & Koordinat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipe *</Label>
                <Select
                  onValueChange={(value) => setValue('type', value)}
                  defaultValue={watch('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register('latitude', { valueAsNumber: true })}
                  placeholder="-7.6079"
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude', { valueAsNumber: true })}
                  placeholder="110.2038"
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude.message}</p>
                )}
              </div>
            </div>

            {/* Jam Operasional & Durasi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours_open">Jam Buka *</Label>
                <Input
                  id="hours_open"
                  {...register('hours_open')}
                  placeholder="08:00"
                />
                {errors.hours_open && (
                  <p className="text-sm text-destructive">{errors.hours_open.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours_close">Jam Tutup *</Label>
                <Input
                  id="hours_close"
                  {...register('hours_close')}
                  placeholder="17:00"
                />
                {errors.hours_close && (
                  <p className="text-sm text-destructive">{errors.hours_close.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durasi (menit) *</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  placeholder="120"
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{errors.duration.message}</p>
                )}
              </div>
            </div>

            {/* Harga */}
            <div className="space-y-2">
              <Label htmlFor="price">Harga Tiket (Rp) *</Label>
              <Input
                id="price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                placeholder="50000"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            {/* Transportation */}
            <div className="space-y-2">
              <Label htmlFor="transportation">Transportasi (pisahkan dengan koma) *</Label>
              <Input
                id="transportation"
                {...register('transportation')}
                placeholder="Bus, Kereta, Taksi"
              />
              {errors.transportation && (
                <p className="text-sm text-destructive">{errors.transportation.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Contoh: Bus, Kereta, Motor, Taksi
              </p>
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Deskripsi lengkap tentang destinasi..."
                rows={5}
                className="resize-none"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimal 50 karakter
              </p>
            </div>

            {/* Upload Gambar */}
            <div className="space-y-2">
              <Label>Gambar Destinasi *</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {imagePreview && (
                <div className="relative w-full h-48 mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setValue('image', '');
                      setImagePreview('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.image && (
                <p className="text-sm text-destructive">{errors.image.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin')}
                disabled={loading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>{isEditMode ? 'Update Destinasi' : 'Tambah Destinasi'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
