import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
  ];

  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-14">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">{t('faq')}</span>
          </motion.h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{t('faq_desc')}</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <AccordionItem value={`faq-${i}`} className="glass-card rounded-xl border border-border/40 px-5 overflow-hidden transition-all duration-300 hover:border-primary/30">
                  <AccordionTrigger className="text-sm sm:text-base font-medium py-4 hover:no-underline text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
