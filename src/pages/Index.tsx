import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Code, Smartphone, Cloud, Cpu, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import WriteReview from '@/components/WriteReview';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import FAQ from '@/components/home/FAQ';
import { useRef, useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, useInView } from "framer-motion";
import handPhone from "@/assets/thhands.webp";

const Index = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });
  const { t } = useLanguage();

  const [indianTime, setIndianTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      time = time.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
      setIndianTime(time);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Code, title: t('web_dev'), description: t('web_dev_desc') },
    { icon: Smartphone, title: t('mobile_apps'), description: t('mobile_apps_desc') },
    { icon: Cloud, title: t('cloud_solutions'), description: t('cloud_desc') },
    { icon: Cpu, title: t('ai_integration'), description: t('ai_desc') },
    { icon: Shield, title: t('cybersecurity'), description: t('cyber_desc') },
    { icon: Zap, title: t('digital_strategy'), description: t('digital_desc') },
  ];
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFeatureClick = (featureTitle: string) => {
    const param = encodeURIComponent(featureTitle);
    if (user) {
      navigate(`/dashboard?service=${param}`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section
        ref={sectionRef}
        className="relative min-h-screen sm:min-h-[90vh] flex flex-col items-center justify-between sm:justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 blur-3xl rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-blue-600/10 blur-3xl rounded-full" />
        </div>
        
        {/* Particles */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const size = 1 + Math.floor(Math.random() * 8);
            const left = Math.random() * 100;
            const delay = Math.random() * 1.2;
            const duration = 1.2 + Math.random() * 1.6;
            const opacity = 0.4 + Math.random() * 0.6;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  bottom: `${-10 - Math.random() * 20}%`,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(173,216,230,0.9))',
                  opacity,
                  filter: 'blur(0.6px)',
                }}
                animate={{ translateY: [-10, -1200] }}
                transition={{ duration, delay, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
              />
            );
          })}
        </div>

        {/* Mobile: stacked layout | Desktop: overlapping layout */}
        {/* BEYOND TECH title - top on mobile */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -40 }}
          transition={{ duration: 1 }}
          className="relative z-20 pt-8 sm:pt-0 sm:absolute sm:top-[10%] sm:left-0 sm:px-6"
        >
          <h1 className="text-center sm:text-left">
            <span className="block sm:hidden text-[2.8rem] font-black text-white leading-none tracking-tight">
              BEYOND TECH
            </span>
            <span className="hidden sm:block text-[6rem] md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tight">
              BEYOND
            </span>
          </h1>
        </motion.div>

        {/* Phone - full width on mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-30 flex-1 sm:flex-none flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute top-[2.6%] sm:top-[3.5%] left-[61%] -translate-x-1/2 z-40">
              <span className="text-white text-[5px] sm:text-[8px] font-medium">
                {indianTime}
              </span>
            </div>
            <img
              src={handPhone}
              alt="Phone"
              className="w-80 sm:w-72 md:w-96 lg:w-[28rem] h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            />
          </div>
        </motion.div>

        {/* TECH - desktop only */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
          className="hidden sm:block absolute bottom-[8%] right-0 px-6"
        >
          <h1 className="text-[6rem] md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tight text-right">
            TECH
          </h1>
        </motion.div>

        {/* Get Started button - mobile only */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-20 pb-10 sm:hidden w-full px-6"
        >
          <Link to="/auth" className="block">
            <Button size="lg" className="w-full text-base font-semibold rounded-xl h-14">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              <span className="gradient-text">{t('our_services')}</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              {t('services_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => handleFeatureClick(feature.title)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFeatureClick(feature.title); }}
                className="glass-card p-4 sm:p-6 rounded-xl hover:border-primary/50 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: '10+', label: t('projects_completed') },
              { value: '5+', label: t('happy_clients') },
              { value: '2+', label: t('years_experience') },
              { value: '24/7', label: t('support') },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <WhyChooseUs />

      {/* REVIEWS CAROUSEL */}
      <ReviewsCarousel />

      {/* FAQ */}
      <FAQ />

      {/* ABOUT THRYLOS INDIA */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              About <span className="gradient-text">THRYLOS INDIA</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              THRYLOS INDIA is a technology company specializing in web development, mobile apps, cloud solutions, AI integration, cybersecurity, and digital strategy. We help businesses and individuals transform their ideas into powerful digital products — from concept to launch and beyond.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/about">
                <Button variant="outline" size="sm">Learn More About Us</Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="sm">Explore Our Services</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Ready to <span className="gradient-text">{t('start_project')}</span>?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Let's discuss how THRYLOS INDIA can help transform your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">{t('contact_us')}</Button>
              </Link>
              <Link to="/portfolio">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">{t('view_our_work')}</Button>
              </Link>
              <WriteReview />
            </div>
            <p className="text-xs text-muted-foreground pt-4">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors underline">Privacy Policy</Link>
              {' · '}
              <Link to="/terms-and-conditions" className="hover:text-primary transition-colors underline">Terms & Conditions</Link>
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
