
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Star, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDestinations } from "@/contexts/DestinationsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const HomePage = () => {
  const { destinations, loading } = useDestinations();
  const { t } = useTranslation();
  const [featuredDestinations, setFeaturedDestinations] = useState([]);

  useEffect(() => {
    if (destinations.length > 0) {
      const topDestinations = [...destinations]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      setFeaturedDestinations(topDestinations);
    }
  }, [destinations]);

  const culturalImages = [
    '/culture-uploads/Desa Adat Wae Rebo.jpg', 
    '/culture-uploads/Tana Toraja.png', 
    '/culture-uploads/Candi Borobudur.png', 
    '/culture-uploads/Candi Prambanan.jpg', 
    '/culture-uploads/Keraton Yogyakarta.jpg', 
    '/culture-uploads/Kampung Naga.jpg', 
    '/culture-uploads/Batik Trusmi.png', 
    '/culture-uploads/Istana Maimun.png', 
    '/culture-uploads/Desa Adat Penglipuran.jpeg', 
    '/culture-uploads/Desa Tenganan Pegringsingan.jpg'  
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/culture-uploads/Gunung Bromo.jpg" 
            alt="Gunung Bromo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-white">
          <div className="max-w-3xl mx-auto text-center hero-animation">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('home.hero.title')}</h1>
            <p className="text-xl md:text-2xl mb-8">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/destinations">
                <Button size="lg" className="bg-indonesia-red hover:bg-indonesia-red/90 text-white">
                  {t('home.hero.cta')}
                </Button>
              </Link>
              <Link to="/planner">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/20">
                  {t('planner.title')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-secondary/30 batik-pattern">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">{t('home.destinations.title')}</h2>
            <Link to="/destinations" className="text-primary flex items-center hover:underline">
              {t('home.destinations.viewAll')} <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Carousel className="w-full">
              <CarouselContent>
                {featuredDestinations.map((destination, index) => (
                  <CarouselItem key={destination.id} className="md:basis-1/2 lg:basis-1/3">
                    <Link to={`/destinations/${destination.id}`}>
                      <Card className="overflow-hidden h-full transition-all hover:shadow-lg">
                        <div className="relative h-64 overflow-hidden">
                          <img
                            src={culturalImages[index % culturalImages.length]}
                            alt={destination.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-white py-1 px-2 rounded-full text-sm flex items-center">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {destination.rating > 0 ? destination.rating.toFixed(1) : t('destinations.card.rating')}
                          </div>
                          {destination.reviewCount > 0 && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white py-1 px-2 rounded-full text-xs">
                              {destination.reviewCount} {t('destinations.card.reviews')}
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
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {destination.duration} {t('destinationDetail.hour')}
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
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('home.features.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('footer.aboutText')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">{t('home.features.smartPlanner')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.smartPlannerDesc')}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M7 7h.01" />
                  <path d="M10 7h7" />
                  <path d="M7 11h.01" />
                  <path d="M10 11h7" />
                  <path d="M7 15h.01" />
                  <path d="M10 15h7" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">{t('home.features.realTime')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.realTimeDesc')}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.95 1 4.8a.2.2 0 0 1-.2.258H2a.2.2 0 0 1-.2-.199C1.79 13 1.1 12.3 1 11.6 0.670 9.2 1.67 6.5 3.5 4.8m1.7 15.2-3 .3m19-4-19 2" />
                  <path d="M5.2 8.2S7 9 8.8 8.5m6.7-3.1c-.7.07-1.5 1.06-1.5 2.3v1.3c0 1.1.4 2.2 1.5 2.2h2.2c.9 0 1.3-.3 1.3-1.3V6.5c0-.9-.6-1.3-1.3-1.3h-7" />
                  <path d="m12.2 8.2.01-.2M14 8.2l.01-.2M16 8.2l.01-.2" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">{t('home.features.aiPowered')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.aiPoweredDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{t('home.hero.title')}</h2>
            <p className="text-xl mb-8">
              {t('home.hero.subtitle')}
            </p>
            <Link to="/planner">
              <Button size="lg" variant="secondary" className="bg-background dark:bg-card text-primary hover:bg-muted dark:hover:bg-muted/80">
                {t('planner.title')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
