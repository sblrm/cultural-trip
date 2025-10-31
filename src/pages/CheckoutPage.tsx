
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Mail, Phone, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GuestRestrictionModal } from "@/components/GuestRestrictionModal";
import {
  createTransaction,
  showSnapPayment,
  generateOrderId,
  loadMidtransScript,
  type CustomerDetails,
  type TransactionItem,
  type PaymentMetadata,
} from "@/services/paymentService";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const quantity = parseInt(searchParams.get("quantity") || "1", 10);
  const visitDate = searchParams.get("visitDate") || "";
  const { getDestinationById } = useDestinations();
  const { user, isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [profilePhones, setProfilePhones] = useState<string[]>([]);
  const [useCustomPhone, setUseCustomPhone] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);

  const destination = getDestinationById(Number(id));

  // Check if guest user tries to access checkout
  useEffect(() => {
    if (isGuest) {
      setShowGuestModal(true);
    }
  }, [isGuest]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (isAuthenticated && user) {
        // Load basic user data
        setFormData(prev => ({
          ...prev,
          fullName: user.name,
          email: user.email
        }));

        // Load phone numbers from profile
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('phone_numbers, primary_phone')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            const phones = data.phone_numbers || [];
            setProfilePhones(phones);
            
            // Auto-select primary phone or first phone
            if (data.primary_phone) {
              setSelectedPhone(data.primary_phone);
              setFormData(prev => ({ ...prev, phone: data.primary_phone }));
            } else if (phones.length > 0) {
              setSelectedPhone(phones[0]);
              setFormData(prev => ({ ...prev, phone: phones[0] }));
            } else {
              // No saved phone numbers, show custom input
              setUseCustomPhone(true);
            }
          }
        } catch (error) {
          console.error('Error loading phone numbers:', error);
        }
      }
    };

    loadProfileData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Load Midtrans Snap script on component mount
    loadMidtransScript()
      .then(() => {
        setIsLoadingScript(false);
        console.log('Midtrans Snap ready');
      })
      .catch((error) => {
        console.error('Failed to load Midtrans:', error);
        toast.error(t('booking.paymentLoadError'));
        setIsLoadingScript(false);
      });
  }, []);

  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">{t('destinations.notFound')}</h1>
        <Button onClick={() => navigate("/destinations")}>
          {t('common.backToDestinations')}
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
    
    // Validate form data and visitDate from URL
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error(t('booking.fillAllFields'));
      setIsSubmitting(false);
      return;
    }
    
    if (!visitDate) {
      toast.error(t('booking.invalidDate'));
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Check if user is logged in
      if (!user?.id) {
        toast.error(t('auth.login.required'));
        navigate("/login");
        return;
      }

      // Generate unique order ID
      const orderId = generateOrderId('TICKET');

      // Prepare customer details
      const customerDetails: CustomerDetails = {
        firstName: formData.fullName.split(' ')[0],
        lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phone: formData.phone,
      };

      // Prepare item details
      const itemDetails: TransactionItem[] = [
        {
          id: `DEST-${destination.id}`,
          name: `${t('booking.ticket')} ${destination.name}`,
          price: destination.price,
          quantity: quantity,
        },
      ];

      // Prepare metadata - include destination_id AND visit_date for booking creation
      const metadata: PaymentMetadata = {
        userId: user.id,
        bookingType: 'ticket',
        tripDataId: destination.id, // Store destination ID for auto-booking
        visitDate: visitDate, // Store visit date for booking
      };

      // Create Midtrans transaction
      toast.loading(t('booking.processingPayment'), { id: 'payment' });
      
      const { token, orderId: createdOrderId } = await createTransaction({
        orderId,
        grossAmount: totalPrice,
        customerDetails,
        itemDetails,
        metadata,
      });

      toast.success(t('booking.redirectingPayment'), { id: 'payment' });

      // Show Midtrans Snap payment popup
      await showSnapPayment(token, {
        onSuccess: async (result) => {
          console.log('Payment success:', result);
          toast.success(t('booking.paymentSuccess'));
          
          // Redirect to payment finish page with order_id
          navigate(`/payment/finish?order_id=${result.order_id || createdOrderId}&transaction_status=settlement&status_code=200`);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          toast.info(t('booking.paymentPending'));
          
          // Redirect to payment pending page
          navigate(`/payment/pending?order_id=${result.order_id || createdOrderId}&transaction_status=pending&status_code=201`);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          toast.error(t('booking.paymentFailed'));
          
          // Redirect to payment error page
          navigate(`/payment/error?order_id=${result.order_id || createdOrderId}&transaction_status=failed&status_code=400`);
        },
        onClose: () => {
          console.log('Payment popup closed');
          toast.info(t('booking.paymentCancelled'));
        },
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      if (error instanceof Error) {
        toast.error(`${t('common.error')}: ${error.message}`);
      } else {
        toast.error(t('booking.paymentProcessError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('booking.checkout')}</h1>
      <p className="text-muted-foreground mb-8">{t('booking.completeBooking')}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  {t('booking.visitorData')}
                </CardTitle>
                <CardDescription>
                  {t('booking.verifyData')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('booking.fullName')}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder={t('booking.fullNamePlaceholder')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('booking.email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder={t('booking.emailPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('booking.eTicketInfo')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('booking.phone')}</Label>
                    
                    {profilePhones.length > 0 && !useCustomPhone ? (
                      <div className="space-y-3">
                        <RadioGroup 
                          value={selectedPhone} 
                          onValueChange={(value) => {
                            setSelectedPhone(value);
                            setFormData(prev => ({ ...prev, phone: value }));
                          }}
                        >
                          {profilePhones.map((phone, index) => (
                            <div key={phone} className="flex items-center space-x-2">
                              <RadioGroupItem value={phone} id={`phone-${index}`} />
                              <Label htmlFor={`phone-${index}`} className="flex-1 cursor-pointer">
                                {phone}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setUseCustomPhone(true)}
                          className="w-full"
                        >
                          {t('booking.useOtherPhone')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="+62812XXXXXXXX"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                        {profilePhones.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUseCustomPhone(false);
                              if (selectedPhone) {
                                setFormData(prev => ({ ...prev, phone: selectedPhone }));
                              }
                            }}
                            className="w-full"
                          >
                            {t('booking.selectSavedPhone')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Visit Date Display (Read-only) */}
                  <div className="space-y-2">
                    <Label>Tanggal Kunjungan</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(visitDate).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {t('booking.paymentMethod')}
                </CardTitle>
                <CardDescription>
                  {t('booking.securePaymentMidtrans')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Midtrans Payment Gateway</span>
                    <img 
                      src="https://midtrans.com/assets/images/midtrans-logo.svg" 
                      alt="Midtrans" 
                      className="h-6"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('booking.availablePaymentMethods')}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-background px-2 py-1 rounded">💳 {t('booking.creditCard')}</span>
                    <span className="bg-background px-2 py-1 rounded">🏦 {t('booking.bankTransfer')}</span>
                    <span className="bg-background px-2 py-1 rounded">🏪 {t('booking.convenience')}</span>
                    <span className="bg-background px-2 py-1 rounded">📱 GoPay</span>
                    <span className="bg-background px-2 py-1 rounded">📱 ShopeePay</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || isLoadingScript}
            >
              {isLoadingScript ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('booking.loadingPaymentSystem')}
                </span>
              ) : isSubmitting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('booking.processingPayment')}
                </span>
              ) : (
                <>
                  {t('booking.proceedToPayment')} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
        
        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t('booking.orderSummary')}</CardTitle>
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
                  <span>{t('destinationDetail.duration')}: {destination.duration} {t('destinationDetail.hour')}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{t('destinationDetail.hours')}: {destination.hours.open} - {destination.hours.close}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="font-medium mb-2">{t('booking.orderDetails')}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('booking.visitDate')}</span>
                    <span className="font-medium">
                      {new Date(visitDate).toLocaleDateString('id-ID', { 
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('booking.ticketQuantity')}</span>
                    <span>× {quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('booking.pricePerTicket')}</span>
                    <span>Rp {destination.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>{t('booking.total')}</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guest Restriction Modal */}
      <GuestRestrictionModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          navigate(-1);
        }}
        feature={t('guest.features.booking') || 'Pemesanan Tiket'}
      />
    </div>
  );
};

export default CheckoutPage;
