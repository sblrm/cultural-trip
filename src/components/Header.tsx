
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Map, Navigation, Home, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

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
              <h1 className="text-xl font-bold gradient-text">{t('common.appName')}</h1>
              <p className="text-xs text-muted-foreground">{t('common.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-accent-foreground font-medium">
              {t('nav.home')}
            </Link>
            <Link to="/destinations" className="text-foreground hover:text-accent-foreground font-medium">
              {t('nav.destinations')}
            </Link>
            <Link to="/planner" className="text-foreground hover:text-accent-foreground font-medium">
              {t('nav.planner')}
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            
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
                      <User size={16} className="mr-2" /> {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut size={16} className="mr-2" /> {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button>{t('nav.register')}</Button>
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
              <span>{t('nav.home')}</span>
            </Link>
            <Link
              to="/destinations"
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <Calendar size={18} />
              <span>{t('nav.destinations')}</span>
            </Link>
            <Link
              to="/planner"
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <Map size={18} />
              <span>{t('nav.planner')}</span>
            </Link>

            <div className="px-2">
              <LanguageSwitcher />
            </div>

            <div className="pt-2 border-t">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                    onClick={toggleMenu}
                  >
                    <User size={18} />
                    <span>{t('nav.profile')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md w-full text-left"
                  >
                    <LogOut size={18} />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" onClick={toggleMenu}>
                    <Button variant="outline" className="w-full">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={toggleMenu}>
                    <Button className="w-full">{t('nav.register')}</Button>
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
