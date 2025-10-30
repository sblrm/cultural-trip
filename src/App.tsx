
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { MapProvider } from "@/contexts/MapContext";
import { DestinationsProvider } from "@/contexts/DestinationsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DestinationsPage from "./pages/DestinationsPage";
import DestinationDetailPage from "./pages/DestinationDetailPage";
import PlannerPage from "./pages/PlannerPage";
import LiveMapPage from "./pages/LiveMapPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfileLayout from "./components/profile/ProfileLayout";
import MyAccount from "./pages/profile/MyAccount";
import MyBooking from "./pages/profile/MyBooking";
import PurchaseList from "./pages/profile/PurchaseList";
import Refund from "./pages/profile/Refund";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentFinishPage from "./pages/PaymentFinishPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DestinationForm from "./pages/admin/DestinationForm";
import WishlistsPage from "./pages/WishlistsPage";
import WishlistDetailPage from "./pages/WishlistDetailPage";
import WishlistFormPage from "./pages/WishlistFormPage";
import SharedWishlistPage from "./pages/SharedWishlistPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DestinationsProvider>
            <MapProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Analytics />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="destinations" element={<DestinationsPage />} />
                  <Route path="destinations/:id" element={<DestinationDetailPage />} />
                  <Route path="planner" element={<PlannerPage />} />
                  <Route path="live-map" element={<LiveMapPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="profile" element={<ProfileLayout />}>
                    <Route index element={<MyAccount />} />
                    <Route path="myaccount" element={<MyAccount />} />
                    <Route path="mybooking" element={<MyBooking />} />
                    <Route path="purchase">
                      <Route path="list" element={<PurchaseList />} />
                    </Route>
                    <Route path="refund" element={<Refund />} />
                  </Route>
                  <Route path="checkout/:id" element={<CheckoutPage />} />
                  <Route path="payment/finish" element={<PaymentFinishPage />} />
                  <Route path="payment/error" element={<PaymentFinishPage />} />
                  <Route path="payment/pending" element={<PaymentFinishPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="admin/destinations/new" element={<DestinationForm />} />
                  <Route path="admin/destinations/edit/:id" element={<DestinationForm />} />
                  
                  {/* Wishlist Routes */}
                  <Route path="wishlist" element={<WishlistsPage />} />
                  <Route path="wishlist/new" element={<WishlistFormPage />} />
                  <Route path="wishlist/edit/:id" element={<WishlistFormPage />} />
                  <Route path="wishlist/shared/:token" element={<SharedWishlistPage />} />
                  <Route path="wishlist/:id" element={<WishlistDetailPage />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </TooltipProvider>
          </MapProvider>
        </DestinationsProvider>
      </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
