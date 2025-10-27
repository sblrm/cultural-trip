
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Calendar } from "lucide-react";
import { useDestinations } from "@/contexts/DestinationsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const DestinationsPage = () => {
  const { t } = useTranslation();
  const { destinations, loading } = useDestinations();
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
    }
  }, [destinations, searchTerm, provinceFilter, typeFilter]);

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('destinations.title')}</h1>
          <p className="text-lg max-w-2xl">
            {t('destinations.subtitle')}
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
                placeholder={t('destinations.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('destinations.filterProvince')} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province === "all" ? t('destinations.allProvinces') : province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('destinations.filterType')} />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? t('destinations.allTypes') : type}
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
              <h3 className="text-xl font-semibold mb-2">{t('destinations.noResults')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('destinations.changeFilters')}
              </p>
              <Button onClick={() => {
                setSearchTerm("");
                setProvinceFilter("all");
                setTypeFilter("all");
              }}>
                {t('destinations.resetFilters')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDestinations.map((destination) => (
                <Link key={destination.id} to={`/destinations/${destination.id}`}>
                  <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={destination.image || getDestinationImage(destination.id)}
                        alt={destination.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 bg-black/70 text-white py-1 px-2 rounded-full text-sm flex items-center">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {destination.rating}
                      </div>
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
                          {t('common.detail')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
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
