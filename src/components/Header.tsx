
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Shield, Home, Calendar, MapIcon, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Helper to check if link is active
  const isActiveLink = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-sm transition-all duration-300">
      {/* Scroll Progress Bar */}
      <div 
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 transition-all duration-150 rounded-full"
        style={{ width: `${scrollProgress}%` }}
      />
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 group transition-transform duration-300 hover:scale-105"
          >
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
              className="text-teal-500 transition-all duration-300 group-hover:rotate-12 group-hover:text-teal-400"
            >
              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
              <path d="M4 12H2" />
              <path d="M10 12H8" />
              <path d="M16 12h-2" />
              <path d="M22 12h-2" />
            </svg>
            <div>
              <h1 className="text-xl font-bold gradient-text transition-all duration-300 group-hover:tracking-wide">
                {t('common.appName')}
              </h1>
              <p className="text-xs text-muted-foreground">{t('common.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              to="/" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActiveLink("/") 
                  ? "text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-400" 
                  : "text-foreground hover:text-teal-600 hover:bg-muted"
              }`}
            >
              <span className="relative z-10">{t('nav.home')}</span>
              {isActiveLink("/") && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-teal-500 rounded-full animate-pulse" />
              )}
            </Link>
            <Link 
              to="/destinations" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActiveLink("/destinations") 
                  ? "text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-400" 
                  : "text-foreground hover:text-teal-600 hover:bg-muted"
              }`}
            >
              <span className="relative z-10">{t('nav.destinations')}</span>
              {isActiveLink("/destinations") && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-teal-500 rounded-full animate-pulse" />
              )}
            </Link>
            <Link 
              to="/planner" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActiveLink("/planner") 
                  ? "text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-400" 
                  : "text-foreground hover:text-teal-600 hover:bg-muted"
              }`}
            >
              <span className="relative z-10">{t('nav.planner')}</span>
              {isActiveLink("/planner") && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-teal-500 rounded-full animate-pulse" />
              )}
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="animate-fade-in">
              <LanguageSwitcher />
            </div>
            <div className="animate-fade-in animation-delay-100">
              <ThemeToggle />
            </div>
            {isAuthenticated ? (
              <div className="animate-fade-in animation-delay-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 transition-all duration-300 hover:shadow-md hover:scale-105"
                    >
                      <User size={16} className="transition-transform duration-300 group-hover:rotate-12" />
                      <span className="font-medium">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 animate-in slide-in-from-top-2">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors">
                        <User size={16} className="mr-2" /> {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors">
                        <Heart size={16} className="mr-2" /> {t('nav.wishlist')}
                      </Link>
                    </DropdownMenuItem>
                    {userIsAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors">
                          <Shield size={16} className="mr-2" /> {t('nav.admin')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
                    >
                      <LogOut size={16} className="mr-2" /> {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login" className="animate-fade-in animation-delay-200">
                  <Button 
                    variant="outline"
                    className="hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 transition-all duration-300 hover:shadow-md hover:scale-105"
                  >
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register" className="animate-fade-in animation-delay-300">
                  <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-all duration-300 hover:scale-110 active:scale-95" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={24} className="animate-in spin-in-90" />
            ) : (
              <Menu size={24} className="animate-in spin-in-90" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu with Slide Animation */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-background/95 backdrop-blur-lg border-b shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-2 animate-in slide-in-from-top-4">
            <Link
              to="/"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                isActiveLink("/")
                  ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "hover:bg-muted hover:translate-x-1"
              }`}
              onClick={toggleMenu}
            >
              <Home size={20} className={isActiveLink("/") ? "animate-pulse" : ""} />
              <span className="font-medium">{t('nav.home')}</span>
            </Link>
            <Link
              to="/destinations"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                isActiveLink("/destinations")
                  ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "hover:bg-muted hover:translate-x-1"
              }`}
              onClick={toggleMenu}
            >
              <Calendar size={20} className={isActiveLink("/destinations") ? "animate-pulse" : ""} />
              <span className="font-medium">{t('nav.destinations')}</span>
            </Link>
            <Link
              to="/planner"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                isActiveLink("/planner")
                  ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "hover:bg-muted hover:translate-x-1"
              }`}
              onClick={toggleMenu}
            >
              <MapIcon size={20} className={isActiveLink("/planner") ? "animate-pulse" : ""} />
              <span className="font-medium">{t('nav.planner')}</span>
            </Link>

            <div className="pt-2 border-t space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isActiveLink("/profile")
                        ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm"
                        : "hover:bg-muted hover:translate-x-1"
                    }`}
                    onClick={toggleMenu}
                  >
                    <User size={20} />
                    <span className="font-medium">{t('nav.profile')}</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isActiveLink("/wishlist")
                        ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm"
                        : "hover:bg-muted hover:translate-x-1"
                    }`}
                    onClick={toggleMenu}
                  >
                    <Heart size={20} />
                    <span className="font-medium">{t('nav.wishlist')}</span>
                  </Link>
                  {userIsAdmin && (
                    <Link
                      to="/admin"
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                        isActiveLink("/admin")
                          ? "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-sm"
                          : "hover:bg-muted hover:translate-x-1"
                      }`}
                      onClick={toggleMenu}
                    >
                      <Shield size={20} />
                      <span className="font-medium">{t('nav.admin')}</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-all duration-300 hover:translate-x-1"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" onClick={toggleMenu}>
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-300"
                    >
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={toggleMenu}>
                    <Button className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 transition-all duration-300">
                      {t('nav.register')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Language and Theme Toggle in Mobile Menu */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{t('language.select')}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{t('profile.theme')}</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
