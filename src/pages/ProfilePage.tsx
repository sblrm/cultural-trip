
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Ticket, Calendar, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestRestrictionModal } from "@/components/GuestRestrictionModal";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isGuest, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            destinations (
              name,
              city,
              province,
              image
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error(t('profile.ticketLoadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [isAuthenticated, navigate, user?.id, t]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              {t('profile.userInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">{t('booking.fullName')}</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('booking.email')}</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('profile.userId')}</div>
              <div className="font-medium">{user.id}</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              {t('nav.logout')}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tickets Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ticket className="mr-2 h-5 w-5" />
              {t('profile.myTickets')}
            </CardTitle>
            <CardDescription>
              {t('profile.bookedTickets')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-muted-foreground">{t('profile.loadingTickets')}</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Ticket className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t('profile.noTickets')}</h3>
                <p className="text-muted-foreground">
                  {t('profile.noTicketsDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="overflow-hidden">
                    <div className="flex">
                      <div className="w-24 h-24 sm:w-32 sm:h-32">
                        <img
                          src={ticket.destinations.image}
                          alt={ticket.destinations.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <h3 className="font-semibold">{ticket.destinations.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ticket.destinations.city}, {ticket.destinations.province}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(ticket.visit_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">{t('booking.ticketQuantity')}:</span> {ticket.quantity} {t('profile.tickets')}
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">{t('booking.total')}:</span> Rp {ticket.total_price.toLocaleString('id-ID')}
                        </div>
                        <div className="mt-2">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {ticket.status === 'confirmed' ? t('profile.activeTicket') : t('profile.waitingConfirmation')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/destinations")}>
              {tickets.length > 0 ? t('profile.bookAgain') : t('profile.exploreDestinations')}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Guest Restriction Modal */}
      <GuestRestrictionModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          navigate("/");
        }}
        feature={t('guest.features.profile') || 'Profil & Riwayat'}
      />
    </div>
  );
};

export default ProfilePage;
