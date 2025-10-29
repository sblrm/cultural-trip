
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useDestinations } from "@/contexts/DestinationsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WishlistButton from "@/components/wishlist/WishlistButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 9; // 3x3 grid

const DestinationsPage = () => {
  const { destinations, loading } = useDestinations();
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (destinations.length > 0) {
      let filtered = [...destinations];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (dest) =>
            dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dest.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dest.location.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dest.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (provinceFilter !== "all") {
        filtered = filtered.filter(
          (dest) => dest.location.province === provinceFilter
        );
      }
      
      if (typeFilter !== "all") {
        filtered = filtered.filter(
          (dest) => dest.type === typeFilter
        );
      }
      
      setFilteredDestinations(filtered);
      setCurrentPage(1); // Reset to page 1 when filters change
    }
  }, [destinations, searchTerm, provinceFilter, typeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDestinations = filteredDestinations.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const provinces = destinations.length > 0
    ? ["all", ...new Set(destinations.map(dest => dest.location.province))].sort()
    : ["all"];
  
  const types = destinations.length > 0
    ? ["all", ...new Set(destinations.map(dest => dest.type))].sort()
    : ["all"];

  return (
    <div>
      {/* Header with Kepulauan Widi background */}
      <section className="relative bg-primary/90 text-white py-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="/culture-uploads/kepulauan widi.jpg" 
            alt="Kepulauan Widi" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Destinasi Budaya Indonesia</h1>
          <p className="text-lg max-w-2xl">
            Jelajahi keindahan dan kekayaan budaya Indonesia melalui berbagai destinasi wisata 
            budaya yang menakjubkan.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Cari destinasi, kota, atau provinsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter berdasarkan provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province === "all" ? "Semua Provinsi" : province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter berdasarkan jenis" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "Semua Jenis" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Tidak ada destinasi yang ditemukan</h3>
              <p className="text-muted-foreground mb-4">
                Coba ubah filter pencarian Anda
              </p>
              <Button onClick={() => {
                setSearchTerm("");
                setProvinceFilter("all");
                setTypeFilter("all");
              }}>
                Reset Filter
              </Button>
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="mb-6 flex justify-between items-center">
                <p className="text-muted-foreground">
                  Menampilkan <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredDestinations.length)}</span> dari <span className="font-semibold text-foreground">{filteredDestinations.length}</span> destinasi
                </p>
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </p>
              </div>

              {/* Destinations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentDestinations.map((destination) => (
                <div key={destination.id} className="relative">
                  <Link to={`/destinations/${destination.id}`}>
                    <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={destination.image || getDestinationImage(destination.id)}
                          alt={destination.name}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white py-1 px-2 rounded-full text-sm flex items-center">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {destination.rating > 0 ? destination.rating.toFixed(1) : 'N/A'}
                        </div>
                        {destination.reviewCount > 0 && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white py-1 px-2 rounded-full text-xs">
                            {destination.reviewCount} review
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-2">{destination.name}</h3>
                        <div className="flex items-center text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {destination.location.city}, {destination.location.province}
                          </span>
                        </div>
                        <div className="flex items-center text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {destination.hours.open} - {destination.hours.close}
                          </span>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="font-semibold text-primary">
                            Rp {destination.price.toLocaleString('id-ID')}
                          </div>
                          <Button size="sm" variant="outline">
                            Detail
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {/* Wishlist Button Overlay */}
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
                    <WishlistButton
                      destinationId={destination.id}
                      variant="icon"
                      size="default"
                    />
                  </div>
                </div>
              ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Sebelumnya
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className="w-10 h-10"
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const getDestinationImage = (id: number) => {
  const images = [
    '/culture-uploads/Candi Prambanan.jpg',
    '/culture-uploads/Desa Adat Penglipuran.jpeg',
    '/culture-uploads/Tana Toraja.png',
    '/culture-uploads/Batik Trusmi.png',
    '/culture-uploads/Keraton Yogyakarta.jpg',
    '/culture-uploads/Desa Adat Wae Rebo.jpg',
    '/culture-uploads/Candi Borobudur.png',
    '/culture-uploads/Kampung Naga.jpg',
    '/culture-uploads/Istana Maimun.jpg',
    '/culture-uploads/Desa Tenganan Pegringsingan.jpg',
  ];
  
  return images[id % images.length];
};

export default DestinationsPage;
