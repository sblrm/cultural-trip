
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Mail, Phone, CreditCard, ArrowRight } from "lucide-react";
import { useDestinations } from "@/contexts/DestinationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase, createTicket } from "@/lib/supabase";
import type { TicketStatus } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const CheckoutPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const quantity = parseInt(searchParams.get("quantity") || "1", 10);
  const { getDestinationById } = useDestinations();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    date: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = getDestinationById(Number(id));

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name,
        email: user.email
      }));
    }
  }, [isAuthenticated, user]);

  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Destinasi tidak ditemukan</h1>
        <Button onClick={() => navigate("/destinations")}>
          Kembali ke Destinasi
        </Button>
      </div>
    );
  }

  const totalPrice = destination.price * quantity;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.date) {
      toast.error("Mohon isi semua data pengunjung");
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCvv) {
      toast.error("Mohon isi semua data pembayaran");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Check if user is logged in
      if (!user?.id) {
        toast.error("Silakan login terlebih dahulu");
        navigate("/login");
        return;
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await createTicket({
          userId: user.id,
          destinationId: destination.id,
          quantity: quantity,
          totalPrice: totalPrice,
          visitDate: formData.date,
          bookingName: formData.fullName,
          bookingEmail: formData.email,
          bookingPhone: formData.phone
        });

        toast.success("Pembayaran berhasil! Tiket telah dikirim ke email Anda.");
        navigate("/profile");
      } catch (dbError: any) {
        console.error('Error creating ticket:', dbError);
        if (dbError.code === '42P01') {
          toast.error("Database error: Tabel 'tickets' tidak ditemukan. Silakan hubungi administrator.");
        } else if (dbError.code === '23503') {
          toast.error("Database error: Referensi tidak valid. Silakan coba lagi.");
        } else {
          toast.error(`Terjadi kesalahan: ${dbError.message || 'Unknown error'}`);
        }
        throw dbError;
      }
      
    } catch (error) {
      console.error('Error processing ticket:', error);
      if (error instanceof Error) {
        toast.error(`Kesalahan: ${error.message}`);
      } else {
        toast.error("Terjadi kesalahan saat memproses pembayaran");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-8">Selesaikan pemesanan tiket Anda</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Data Pengunjung
                </CardTitle>
                <CardDescription>
                  Masukkan informasi pengunjung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal Kunjungan</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      min={minDate}
                      max={maxDateStr}
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Informasi Pembayaran
                </CardTitle>
                <CardDescription>
                  Masukkan informasi kartu untuk pembayaran
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Nomor Kartu</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nama pada Kartu</Label>
                  <Input
                    id="cardName"
                    name="cardName"
                    placeholder="NAMA LENGKAP"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Tanggal Kadaluarsa</Label>
                    <Input
                      id="cardExpiry"
                      name="cardExpiry"
                      placeholder="MM/YY"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      autoComplete="off"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardCvv">CVV</Label>
                    <Input
                      id="cardCvv"
                      name="cardCvv"
                      placeholder="123"
                      value={formData.cardCvv}
                      onChange={handleInputChange}
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Memproses Pembayaran...
                </span>
              ) : (
                <>
                  Bayar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
        
        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src={destination.image} 
                  alt={destination.name} 
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-semibold">{destination.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {destination.location.city}, {destination.location.province}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Durasi: {destination.duration} menit</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Jam Buka: {destination.hours.open} - {destination.hours.close}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="font-medium mb-2">Detail Pesanan</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tiket x {quantity}</span>
                    <span>Rp {destination.price.toLocaleString('id-ID')} x {quantity}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
