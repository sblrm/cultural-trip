
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { GuestBanner } from "./GuestBanner";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const { isGuest } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {isGuest && <GuestBanner />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
