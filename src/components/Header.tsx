
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Shield, Home, Calendar, MapIcon, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      checkAdmin();
    } else {
      setUserIsAdmin(false);
    }
  }, [isAuthenticated, user]);

  const checkAdmin = async () => {
    try {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
    } catch (error) {
      setUserIsAdmin(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-teal-500"
            >
              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
              <path d="M4 12H2" />
              <path d="M10 12H8" />
              <path d="M16 12h-2" />
              <path d="M22 12h-2" />
            </svg>
            <div>
              <h1 className="text-xl font-bold gradient-text">TravoMate</h1>
              <p className="text-xs text-muted-foreground">Temukan Indonesia</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-accent-foreground font-medium">
              Beranda
            </Link>
            <Link to="/destinations" className="text-foreground hover:text-accent-foreground font-medium">
              Destinasi
            </Link>
            <Link to="/planner" className="text-foreground hover:text-accent-foreground font-medium">
              Rute Wisata
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User size={16} />
                    <span>{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User size={16} className="mr-2" /> Profil Saya
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer">
                      <Heart size={16} className="mr-2" /> Wishlist Saya
                    </Link>
                  </DropdownMenuItem>
                  {userIsAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield size={16} className="mr-2" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut size={16} className="mr-2" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Masuk</Button>
                </Link>
                <Link to="/register">
                  <Button>Daftar</Button>
                </Link>
              </>
            )}
          </div>

          {/* Menu Button */}
          <button className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              to="/"
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <Home size={18} />
              <span>Beranda</span>
            </Link>
            <Link
              to="/destinations"
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <Calendar size={18} />
              <span>Destinasi</span>
            </Link>
            <Link
              to="/planner"
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <MapIcon size={18} />
              <span>Rute Wisata</span>
            </Link>

            <div className="pt-2 border-t">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                    onClick={toggleMenu}
                  >
                    <User size={18} />
                    <span>Profil Saya</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                    onClick={toggleMenu}
                  >
                    <Heart size={18} />
                    <span>Wishlist Saya</span>
                  </Link>
                  {userIsAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                      onClick={toggleMenu}
                    >
                      <Shield size={18} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md w-full text-left"
                  >
                    <LogOut size={18} />
                    <span>Keluar</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" onClick={toggleMenu}>
                    <Button variant="outline" className="w-full">
                      Masuk
                    </Button>
                  </Link>
                  <Link to="/register" onClick={toggleMenu}>
                    <Button className="w-full">Daftar</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
