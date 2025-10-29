import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  createWishlist,
  getWishlist,
  updateWishlist,
} from "@/services/wishlistService";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wishlist harus diisi")
    .max(100, "Nama wishlist maksimal 100 karakter"),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  is_public: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function WishlistFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const isEditMode = !!id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      is_public: false,
    },
  });

  // Load wishlist data for edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadWishlist = async () => {
      try {
        setInitialLoading(true);
        const wishlistId = parseInt(id, 10);
        if (isNaN(wishlistId)) {
          toast.error("ID wishlist tidak valid");
          navigate("/wishlist");
          return;
        }

        const wishlist = await getWishlist(wishlistId);
        if (!wishlist) {
          toast.error("Wishlist tidak ditemukan");
          navigate("/wishlist");
          return;
        }

        form.reset({
          name: wishlist.name,
          description: wishlist.description || "",
          is_public: wishlist.is_public,
        });
      } catch (error) {
        console.error("Error loading wishlist:", error);
        toast.error("Gagal memuat data wishlist");
      } finally {
        setInitialLoading(false);
      }
    };

    loadWishlist();
  }, [id, isEditMode, navigate, form]);

  // Check auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && id) {
        const wishlistId = parseInt(id, 10);
        if (isNaN(wishlistId)) {
          toast.error("ID wishlist tidak valid");
          return;
        }
        await updateWishlist(wishlistId, {
          name: values.name,
          description: values.description || null,
          is_public: values.is_public,
        });
        toast.success("Wishlist berhasil diperbarui");
        navigate(`/wishlist/${wishlistId}`);
      } else {
        const newWishlist = await createWishlist({
          name: values.name,
          description: values.description || null,
          is_public: values.is_public,
        });
        toast.success("Wishlist berhasil dibuat");
        navigate(`/wishlist/${newWishlist.id}`);
      }
    } catch (error) {
      console.error("Error saving wishlist:", error);
      toast.error(
        isEditMode
          ? "Gagal memperbarui wishlist"
          : "Gagal membuat wishlist"
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Wishlist" : "Buat Wishlist Baru"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Ubah informasi wishlist Anda"
              : "Buat wishlist baru untuk menyimpan destinasi favorit"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Wishlist *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Trip Bali 2024"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nama untuk mengidentifikasi wishlist ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Destinasi budaya yang ingin dikunjungi untuk liburan keluarga..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi singkat tentang wishlist ini (opsional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Wishlist Publik
                      </FormLabel>
                      <FormDescription>
                        Izinkan orang lain melihat wishlist ini melalui link sharing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isEditMode ? (
                    "Simpan Perubahan"
                  ) : (
                    "Buat Wishlist"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
