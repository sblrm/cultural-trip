
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Clock, Star, Users, Ticket, ArrowRight, Bus, Car, Train } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDestinations } from "@/contexts/DestinationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import WishlistButton from "@/components/wishlist/WishlistButton";
import BeenHerePhoto from "@/components/social/BeenHerePhoto";
import ShareButton from "@/components/social/ShareButton";
import type { ReviewWithProfile, DestinationRating } from "@/types/review";
import {
  getDestinationReviews,
  getDestinationRating,
  getUserReview,
  createReview,
  updateReview,
  deleteReview,
} from "@/services/reviews";

const DestinationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDestinationById } = useDestinations();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [visitDate, setVisitDate] = useState("");
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [rating, setRating] = useState<DestinationRating | null>(null);
  const [userReview, setUserReview] = useState<ReviewWithProfile | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Get the destination by ID
  const destination = getDestinationById(Number(id));

  // Load reviews on mount
  useEffect(() => {
    if (destination) {
      loadReviews();
    }
  }, [destination?.id, user?.id]);

  const loadReviews = async () => {
    if (!destination) return;
    
    setLoadingReviews(true);
    try {
      const [reviewsData, ratingData, userReviewData] = await Promise.all([
        getDestinationReviews(destination.id),
        getDestinationRating(destination.id),
        user ? getUserReview(destination.id, user.id) : Promise.resolve(null),
      ]);
      
      setReviews(reviewsData);
      setRating(ratingData);
      setUserReview(userReviewData ? reviewsData.find(r => r.id === userReviewData.id) || null : null);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Gagal memuat review');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (reviewRating: number, comment: string) => {
    if (!destination || !user) {
      toast.error('Anda harus login untuk memberikan review');
      return;
    }

    try {
      if (isEditingReview && userReview) {
        await updateReview(userReview.id, { rating: reviewRating, comment });
        toast.success('Review berhasil diupdate!');
      } else {
        await createReview({
          destination_id: destination.id,
          rating: reviewRating,
          comment,
        });
        toast.success('Review berhasil dikirim!');
      }
      
      setIsEditingReview(false);
      await loadReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Anda sudah memberikan review untuk destinasi ini');
      } else {
        toast.error('Gagal mengirim review');
      }
      throw error;
    }
  };

  const handleEditReview = (review: ReviewWithProfile) => {
    setIsEditingReview(true);
    setUserReview(review);
    // Scroll to review form
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await deleteReview(reviewId);
      toast.success('Review berhasil dihapus');
      await loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Gagal menghapus review');
    }
  };

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

  const handleBuyTicket = () => {
    // Validate visit date
    if (!visitDate) {
      toast.error(t('booking.selectDateError'));
      document.getElementById('visit-date-input')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error(t('booking.pastDateError'));
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      toast.error(t('auth.login.required'));
      // Save booking data to sessionStorage
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        destinationId: destination.id,
        quantity,
        visitDate,
        returnUrl: window.location.pathname
      }));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // Navigate to checkout with booking details
    navigate(`/checkout/${destination.id}?quantity=${quantity}&visitDate=${visitDate}`);
  };

  const totalPrice = destination.price * quantity;

  // Calculate minimum and maximum visit dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

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
                <span>
                  {destination.rating > 0 
                    ? `${destination.rating.toFixed(1)} (${destination.reviewCount} review)` 
                    : 'Belum ada rating'}
                </span>
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
                  <TabsTrigger value="overview">{t('destinationDetail.about')}</TabsTrigger>
                  <TabsTrigger value="details">{t('common.viewDetails')}</TabsTrigger>
                  <TabsTrigger value="transportation">{t('destinationDetail.transportation')}</TabsTrigger>
                  <TabsTrigger value="reviews">
                    {t('destinationDetail.reviews')} ({rating?.review_count || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-bold mb-4">{t('destinationDetail.about')} {destination.name}</h2>
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
                            <h3 className="font-medium">{t('destinationDetail.hours')}</h3>
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
                            <h3 className="font-medium">{t('destinationDetail.duration')}</h3>
                            <p className="text-muted-foreground">
                              {destination.duration} {t('destinationDetail.hour')}
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
                    <h2 className="text-2xl font-bold mb-4">{t('destinationDetail.detailedInfo')}</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('destinationDetail.location')}</h3>
                        <p className="text-muted-foreground">
                          {t('destinationDetail.coordinates')}: {destination.coordinates.latitude}, {destination.coordinates.longitude}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('destinationDetail.facilities')}</h3>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          <li>{t('destinationDetail.parking')}</li>
                          <li>{t('destinationDetail.toilet')}</li>
                          <li>{t('destinationDetail.diningArea')}</li>
                          <li>{t('destinationDetail.infoCenter')}</li>
                          <li>{t('destinationDetail.souvenirShop')}</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('destinationDetail.visitingTips')}</h3>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          <li>{t('destinationDetail.tip1')}</li>
                          <li>{t('destinationDetail.tip2')}</li>
                          <li>{t('destinationDetail.tip3')}</li>
                          <li>{t('destinationDetail.tip4')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="transportation" className="mt-6">
                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-2xl font-bold mb-4">{t('destinationDetail.transportation')}</h2>
                    
                    <div className="space-y-6">
                      {destination.transportation.includes("Bus") && (
                        <div className="flex gap-4 items-start">
                          <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Bus className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{t('destinationDetail.bus')}</h3>
                            <p className="text-muted-foreground">
                              {t('destinationDetail.busInfo')}
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
                            <h3 className="text-xl font-semibold mb-2">{t('destinationDetail.taxi')}</h3>
                            <p className="text-muted-foreground">
                              {t('destinationDetail.taxiInfo')}
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
                            <h3 className="text-xl font-semibold mb-2">{t('destinationDetail.train')}</h3>
                            <p className="text-muted-foreground">
                              {t('destinationDetail.trainInfo')}
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
                
                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-8">
                    {/* Review Form (only for logged in users) */}
                    {user && (
                      <div id="review-form">
                        {!userReview || isEditingReview ? (
                          <ReviewForm
                            destinationName={destination.name}
                            existingRating={isEditingReview && userReview ? userReview.rating : 0}
                            existingComment={isEditingReview && userReview ? userReview.comment || '' : ''}
                            onSubmit={handleSubmitReview}
                            onCancel={isEditingReview ? () => setIsEditingReview(false) : undefined}
                            isEdit={isEditingReview}
                          />
                        ) : (
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-muted-foreground mb-4">
                                Anda sudah memberikan review untuk destinasi ini
                              </p>
                              <Button onClick={() => setIsEditingReview(true)} variant="outline">
                                Edit Review Saya
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {!user && (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground mb-4">
                            Login untuk memberikan review
                          </p>
                          <Link to="/login">
                            <Button>Login</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}

                    {/* Reviews List */}
                    {loadingReviews ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Memuat review...</p>
                      </div>
                    ) : (
                      <ReviewList
                        reviews={reviews}
                        rating={rating}
                        currentUserId={user?.id}
                        onEditReview={handleEditReview}
                        onDeleteReview={handleDeleteReview}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Booking */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">{t('destinationDetail.bookNow')}</h2>
                  
                  <div className="space-y-4">
                    {/* Visit Date Picker */}
                    <div>
                      <Label htmlFor="visit-date-input" className="block text-sm mb-2">
                        {t('booking.visitDate')}
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="visit-date-input"
                          type="date"
                          min={minDate}
                          max={maxDateStr}
                          value={visitDate}
                          onChange={(e) => setVisitDate(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('booking.selectDateInfo')}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div>
                      <Label className="block text-sm mb-2">{t('booking.ticketQuantity')}</Label>
                      <div className="flex items-center">
                        <button
                          className="bg-muted rounded-l-md px-3 py-2 border border-input hover:bg-muted/80 transition-colors"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <div className="px-4 py-2 border-t border-b border-input bg-white text-center min-w-[50px] font-medium">
                          {quantity}
                        </div>
                        <button
                          className="bg-muted rounded-r-md px-3 py-2 border border-input hover:bg-muted/80 transition-colors"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= 10}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('booking.maxTickets')}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    {/* Price Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('booking.pricePerTicket')}</span>
                        <span>Rp {destination.price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('booking.ticketQuantity')}</span>
                        <span>× {quantity}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>{t('booking.total')}</span>
                        <span className="text-primary">Rp {totalPrice.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    
                    {/* Buy Button */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleBuyTicket}
                      disabled={!visitDate}
                    >
                      {!visitDate ? (
                        t('booking.selectDateButton')
                      ) : !isAuthenticated ? (
                        <>Login & Beli Tiket <ArrowRight className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>{t('booking.proceedToPayment')} <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>

                    {/* Wishlist Button */}
                    <WishlistButton
                      destinationId={destination.id}
                      variant="default"
                      size="lg"
                      className="w-full"
                    />

                    {/* Been Here Photo */}
                    <BeenHerePhoto
                      destinationId={destination.id}
                      destinationName={destination.name}
                      onUploadSuccess={loadReviews}
                    />

                    {/* Share Button */}
                    <div className="w-full">
                      <ShareButton
                        data={{
                          title: `${destination.name} - TravoMate`,
                          description: `Kunjungi ${destination.name} di ${destination.location.city}, ${destination.location.province}. ${destination.description}`,
                          url: window.location.href,
                          image: destination.image,
                        }}
                        variant="outline"
                        size="lg"
                        showLabel={true}
                      />
                    </div>

                    {/* Info */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>✓ {t('booking.securePayment')}</p>
                      <p>✓ {t('booking.eTicketEmail')}</p>
                      <p>✓ {t('booking.downloadTicket')}</p>
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
