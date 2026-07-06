import { motion } from 'framer-motion';
import { Rocket, HeartHandshake, Clock, Headphones } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WhyChooseUs = () => {
  const { t } = useLanguage();

  const reasons = [
    { icon: Rocket, title: t('fast_delivery'), description: t('fast_delivery_desc') },
    { icon: HeartHandshake, title: t('client_first'), description: t('client_first_desc') },
    { icon: Clock, title: t('on_time_support'), description: t('on_time_desc') },
    { icon: Headphones, title: t('availability'), description: t('availability_desc') },
  ];

  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            {t('why_choose_us').split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t('why_choose_us').split(' ').slice(-1)}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">{t('why_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {reasons.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.02 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.1,
                duration: 0.3,
                ease: "easeOut",
              }}
              className="glass-card rounded-2xl p-5 sm:p-6 text-center group hover:border-primary/40 transition-all duration-300"
            >
          ))}
            </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
