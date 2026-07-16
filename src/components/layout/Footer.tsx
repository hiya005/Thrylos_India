import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const location = useLocation();

  // Hide footer on dashboard and admin routes
  const hiddenRoutes = ['/dashboard', '/coordinator-admin', '/pm/'];
  const shouldHide = hiddenRoutes.some(route => location.pathname.startsWith(route));
  if (shouldHide) return null;

  return (
    <div className="bg-card border-t border-border py-10 sm:py-12 col-span-full">
      <div className="container mx-auto px-5 sm:px-6 text-center">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 flex-wrap">
            <span className="text-sm sm:text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>A</span>
            <span className="text-sm sm:text-lg font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Merlin', cursive" }}>misterutsav</span>
            <span className="text-sm sm:text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>PRODUCT</span>
            <Heart className="h-4 w-4 sm:h-4 sm:w-4 text-red-500 fill-red-500 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-xs sm:text-sm">
          {[
            { href: '/', label: t('home') },
            { href: '/about', label: t('about') },
            { href: '/services', label: t('services') },
            { href: '/portfolio', label: t('portfolio') },
            { href: '/contact', label: t('contact') },
          ].map((link, i) => (
            <span key={link.href} className="flex items-center gap-3 sm:gap-6">
              {i > 0 && <span className="text-foreground/40 hidden sm:inline">|</span>}
              <Link to={link.href} className="text-foreground/60 hover:text-primary transition-colors">{link.label}</Link>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-xs sm:text-sm">
          {[
            { href: '/privacy-policy', label: t('privacy_policy') },
            { href: '/terms-and-conditions', label: t('terms_conditions') },
            { href: '/payment-policy', label: t('payment_policy') },
            { href: '/refund-policy', label: t('refund_policy') },
          ].map((link, i) => (
            <span key={link.href} className="flex items-center gap-3 sm:gap-6">
              {i > 0 && <span className="text-foreground/40 hidden sm:inline">|</span>}
              <Link to={link.href} className="text-foreground/60 hover:text-primary transition-colors">{link.label}</Link>
            </span>
          ))}
        </div>

        <div className="border-t border-border pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm text-muted-foreground">© {new Date().getFullYear()} THRYLOS INDIA. {t('all_rights')}</p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
