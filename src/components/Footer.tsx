
import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">{t('common.appName')}</h3>
            <p className="text-gray-400 mb-4">
              {t('footer.aboutText')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-indonesia-gold">
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
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-indonesia-gold">
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
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-indonesia-gold">
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
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">{t('home.destinations.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/destinations/7" className="text-gray-400 hover:text-white">
                  Candi Borobudur
                </Link>
              </li>
              <li>
                <Link to="/destinations/1" className="text-gray-400 hover:text-white">
                  Candi Prambanan
                </Link>
              </li>
              <li>
                <Link to="/destinations/3" className="text-gray-400 hover:text-white">
                  Tana Toraja
                </Link>
              </li>
              <li>
                <Link to="/destinations/2" className="text-gray-400 hover:text-white">
                  Desa Adat Penglipuran
                </Link>
              </li>
              <li>
                <Link to="/destinations/6" className="text-gray-400 hover:text-white">
                  Desa Adat Wae Rebo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/destinations" className="text-gray-400 hover:text-white">
                  {t('nav.destinations')}
                </Link>
              </li>
              <li>
                <Link to="/planner" className="text-gray-400 hover:text-white">
                  {t('nav.planner')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-white">
                  {t('nav.register')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white">
                  {t('nav.login')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 text-indonesia-gold" />
                <span className="text-gray-400">
                  Jl. Pasir Kaliki No. 123, Kota Bandung, Indonesia
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-5 w-5 text-indonesia-gold" />
                <span className="text-gray-400">+62 21 1234 5678</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-5 w-5 text-indonesia-gold" />
                <span className="text-gray-400">info@travomate.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
