
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Calendar, ChevronLeft, ChevronRight, Search, X, SlidersHorizontal, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDestinations } from "@/contexts/DestinationsContext";
import { useMap } from "@/contexts/MapContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import WishlistButton from "@/components/wishlist/WishlistButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ITEMS_PER_PAGE = 9; // 3x3 grid

// Helper function to calculate distance (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const DestinationsPage = () => {
  const { destinations, loading } = useDestinations();
  const { userLocation } = useMap();
  const { t } = useTranslation();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<"nearest" | "cheapest" | "highest-rating" | "default">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Calculate price range from destinations
  const maxPrice = useMemo(() => {
    if (destinations.length === 0) return 500000;
    return Math.max(...destinations.map(d => d.price));
  }, [destinations]);

  // Filter and sort destinations
  const filteredDestinations = useMemo(() => {
    if (destinations.length === 0) return [];
    
    let filtered = [...destinations];
    
    // Search filter (nama, lokasi, kategori)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (dest) =>
          dest.name.toLowerCase().includes(search) ||
          dest.location.city.toLowerCase().includes(search) ||
          dest.location.province.toLowerCase().includes(search) ||
          dest.type.toLowerCase().includes(search) ||
          dest.description?.toLowerCase().includes(search)
      );
    }
    
    // Province filter
    if (provinceFilter !== "all") {
      filtered = filtered.filter(
        (dest) => dest.location.province === provinceFilter
      );
    }
    
    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (dest) => dest.type === typeFilter
      );
    }
    
    // Price range filter
    filtered = filtered.filter(
      (dest) => dest.price >= priceRange[0] && dest.price <= priceRange[1]
    );
    
    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(
        (dest) => (dest.rating || 0) >= minRating
      );
    }
    
    // Sorting
    if (sortBy === "nearest" && userLocation) {
      filtered = filtered
        .map(dest => ({
          ...dest,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            dest.coordinates.latitude,
            dest.coordinates.longitude
          )
        }))
        .sort((a, b) => a.distance - b.distance);
    } else if (sortBy === "cheapest") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "highest-rating") {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    return filtered;
  }, [destinations, searchTerm, provinceFilter, typeFilter, priceRange, minRating, sortBy, userLocation]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, provinceFilter, typeFilter, priceRange, minRating, sortBy]);

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

  const clearAllFilters = () => {
    setSearchTerm("");
    setProvinceFilter("all");
    setTypeFilter("all");
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setSortBy("default");
  };

  const hasActiveFilters = searchTerm || provinceFilter !== "all" || typeFilter !== "all" || 
    priceRange[0] !== 0 || priceRange[1] !== maxPrice || minRating > 0 || sortBy !== "default";

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('destinations.title')}</h1>
          <p className="text-lg max-w-2xl">
            {t('destinations.subtitle')}
          </p>
        </div>
      </section>

      {/* Advanced Filters Section */}
      <section className="py-6 bg-muted border-b">
        <div className="container mx-auto px-4">
          {/* Search and Sort Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            {/* Search Bar */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama, lokasi, atau kategori destinasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Sort By */}
            <div className="md:col-span-3">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Urutkan berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="nearest" disabled={!userLocation}>
                    <div className="flex items-center">
                      <Navigation className="h-4 w-4 mr-2" />
                      Terdekat {!userLocation && "(Aktifkan Lokasi)"}
                    </div>
                  </SelectItem>
                  <SelectItem value="cheapest">Termurah</SelectItem>
                  <SelectItem value="highest-rating">Rating Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Filters Button */}
            <div className="md:col-span-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    Aktif
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Advanced Filters (Collapsible) */}
          <Collapsible open={showFilters}>
            <CollapsibleContent>
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Province Filter */}
                  <div className="space-y-2">
                    <Label>{t('destinations.filterByProvince')}</Label>
                    <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('destinations.all')}</SelectItem>
                        {provinces.filter(p => p !== "all").map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <Label>{t('destinations.filterByType')}</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('destinations.all')}</SelectItem>
                        {types.filter(t => t !== "all").map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <Label>Rentang Harga</Label>
                    <div className="pt-4">
                      <Slider
                        min={0}
                        max={maxPrice}
                        step={10000}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>Rp {priceRange[0].toLocaleString('id-ID')}</span>
                        <span>Rp {priceRange[1].toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-2">
                    <Label>Rating Minimum</Label>
                    <Select value={minRating.toString()} onValueChange={(val) => setMinRating(Number(val))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Semua Rating</SelectItem>
                        <SelectItem value="1">⭐ 1+</SelectItem>
                        <SelectItem value="2">⭐ 2+</SelectItem>
                        <SelectItem value="3">⭐ 3+</SelectItem>
                        <SelectItem value="4">⭐ 4+</SelectItem>
                        <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button variant="outline" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Reset Semua Filter
                    </Button>
                  </div>
                )}
              </Card>
            </CollapsibleContent>
          </Collapsible>
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
              <h3 className="text-xl font-semibold mb-2">{t('destinations.noResults')}</h3>
              <p className="text-muted-foreground mb-4">
                Coba ubah kriteria pencarian atau filter Anda
              </p>
              <Button onClick={clearAllFilters}>
                Reset Semua Filter
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
                            {destination.reviewCount} {t('destinations.card.reviews')}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg flex-1">{destination.name}</h3>
                          <div onClick={(e) => e.preventDefault()}>
                            <WishlistButton
                              destinationId={destination.id}
                              variant="icon"
                              size="sm"
                            />
                          </div>
                        </div>
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
                            {t('common.viewDetails')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
                    {t('common.previous')}
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
                    {t('common.next')}
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
