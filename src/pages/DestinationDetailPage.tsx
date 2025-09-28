
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, Clock, Star, Users, Ticket, ArrowRight, Bus, Car, Train } from "lucide-react";
import { useDestinations } from "@/contexts/DestinationsContext";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

const DestinationDetailPage = () => {
  const { id } = useParams();
  const { getDestinationById } = useDestinations();
  const [quantity, setQuantity] = useState(1);
  
  // Get the destination by ID
  const destination = getDestinationById(Number(id));

  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Destinasi tidak ditemukan</h1>
        <Link to="/destinations">
          <Button>Kembali ke Destinasi</Button>
        </Link>
      </div>
    );
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const totalPrice = destination.price * quantity;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={destination.image} 
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">{destination.name}</h1>
            <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-1" />
                <span>
                  {destination.location.city}, {destination.location.province}
                </span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{destination.rating}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
              <div className="text-lg font-medium">
                Tiket Masuk: Rp {destination.price.toLocaleString('id-ID')} / orang
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Destination Info */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
                  <TabsTrigger value="details">Detail</TabsTrigger>
                  <TabsTrigger value="transportation">Transportasi</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-bold mb-4">Tentang {destination.name}</h2>
                    <p className="text-muted-foreground mb-6">
                      {destination.description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4 flex gap-4 items-center">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Jam Operasional</h3>
                            <p className="text-muted-foreground">
                              {destination.hours.open} - {destination.hours.close}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 flex gap-4 items-center">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <Clock className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Durasi Kunjungan</h3>
                            <p className="text-muted-foreground">
                              {destination.duration} menit
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4">Jenis Budaya</h2>
                    <p className="text-muted-foreground mb-6">
                      {destination.type}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="mt-6">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-bold mb-4">Informasi Detail</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Lokasi</h3>
                        <p className="text-muted-foreground">
                          Koordinat: {destination.coordinates.latitude}, {destination.coordinates.longitude}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Fasilitas</h3>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          <li>Tempat Parkir</li>
                          <li>Toilet</li>
                          <li>Area Makan</li>
                          <li>Pusat Informasi</li>
                          <li>Toko Suvenir</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Tips Berkunjung</h3>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          <li>Kenakan pakaian yang nyaman dan sopan</li>
                          <li>Bawa air minum yang cukup</li>
                          <li>Datang lebih awal untuk menghindari keramaian</li>
                          <li>Hormati tradisi dan budaya setempat</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="transportation" className="mt-6">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-bold mb-4">Akses Transportasi</h2>
                    
                    <div className="space-y-6">
                      {destination.transportation.includes("Bus") && (
                        <div className="flex gap-4 items-start">
                          <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Bus className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">Bus</h3>
                            <p className="text-muted-foreground">
                              Tersedia layanan bus umum yang berhenti di dekat lokasi. 
                              Cek jadwal dan rute bus lokal untuk informasi lebih lanjut.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {destination.transportation.includes("Taksi") && (
                        <div className="flex gap-4 items-start">
                          <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Car className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">Taksi</h3>
                            <p className="text-muted-foreground">
                              Taksi tersedia dan merupakan cara yang nyaman untuk mencapai destinasi.
                              Gunakan aplikasi transportasi online untuk kemudahan pemesanan.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {destination.transportation.includes("Kereta ke Cirebon") && (
                        <div className="flex gap-4 items-start">
                          <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Train className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">Kereta</h3>
                            <p className="text-muted-foreground">
                              Stasiun kereta terdekat berada di Cirebon. Dari stasiun, 
                              Anda dapat menggunakan taksi atau transportasi lokal menuju destinasi.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {destination.transportation.includes("Rental Mobil") && (
                        <div className="flex gap-4 items-start">
                          <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Car className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">Rental Mobil</h3>
                            <p className="text-muted-foreground">
                              Menyewa mobil adalah pilihan yang baik untuk fleksibilitas perjalanan.
                              Tersedia berbagai penyedia layanan rental mobil di kota terdekat.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Booking */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Pesan Tiket</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Jumlah Tiket</label>
                      <div className="flex items-center">
                        <button
                          className="bg-muted rounded-l-md px-3 py-2 border border-input"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <div className="px-4 py-2 border-t border-b border-input bg-white text-center min-w-[50px]">
                          {quantity}
                        </div>
                        <button
                          className="bg-muted rounded-r-md px-3 py-2 border border-input"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= 10}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1">Detail Harga</label>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between mb-2">
                          <span>Tiket x {quantity}</span>
                          <span>Rp {destination.price.toLocaleString('id-ID')} x {quantity}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Link to={`/checkout/${destination.id}?quantity=${quantity}`}>
                      <Button className="w-full">
                        Lanjut ke Pembayaran <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      Dengan menekan tombol di atas, Anda menyetujui syarat dan ketentuan kami.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DestinationDetailPage;
