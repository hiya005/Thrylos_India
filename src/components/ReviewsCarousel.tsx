import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  reviewer_role: string | null;
  review_text: string;
  rating: number;
  created_at: string;
}

const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setReviews(data as Review[]);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const next = useCallback(() => {
    if (reviews.length > 0) setCurrent(c => (c + 1) % reviews.length);
  }, [reviews.length]);

  const prev = useCallback(() => {
    if (reviews.length > 0) setCurrent(c => (c - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  const [paused, setPaused] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    if (reviews.length <= 1 || paused || expandedReview) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, reviews.length, paused, expandedReview]);

  if (loading || reviews.length === 0) return null;

  const review = reviews[current];

  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-56 h-56 bg-primary/10 blur-[110px] rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-56 h-56 bg-accent/10 blur-[110px] rounded-full" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">{t('featured_reviews')}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            {t('featured_reviews_desc')}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          <button
            onClick={prev}
            className="absolute left-0 sm:-left-14 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-card border-border/60 flex items-center justify-center hover:border-primary/50 hover:scale-105 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 sm:-right-14 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-card border-border/60 flex items-center justify-center hover:border-primary/50 hover:scale-105 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="glass-card rounded-3xl p-6 sm:p-10 mx-8 sm:mx-0 relative overflow-hidden border-primary/20 cursor-pointer" onClick={() => { const id = review.id; if (expandedReview === id) { setExpandedReview(null); } else { setExpandedReview(id); } }}>
            <motion.div
              key={`progress-${current}`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 4.8, ease: 'linear' }}
              className="absolute top-0 left-0 h-[2px] bg-primary/60"
            />

            <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/10" />

            <AnimatePresence mode="wait">
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 28, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.38 }}
                className="text-center"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>

                <p className="text-base sm:text-lg md:text-xl font-medium italic leading-relaxed mb-8 text-foreground/90 line-clamp-4">
                  "{review.review_text}"
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">{expandedReview === review.id ? t('click_collapse') : t('click_expand')}</p>

                <div className="flex flex-col items-center gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} className="relative">
                    {review.reviewer_avatar_url ? (
                      <img
                        src={review.reviewer_avatar_url}
                        alt={review.reviewer_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/40 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary border-2 border-primary/40">
                        {review.reviewer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-emerald-400 fill-background" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-foreground">{review.reviewer_name}</p>
                    {review.reviewer_role && (
                      <p className="text-sm text-primary mt-0.5">{review.reviewer_role}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Expanded full review */}
          <AnimatePresence>
            {expandedReview === review.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-8 sm:mx-0 overflow-hidden"
              >
                <div className="glass-card rounded-2xl p-6 mt-3 border-primary/10">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{review.review_text}</p>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
                    {review.reviewer_avatar_url ? (
                      <img src={review.reviewer_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {review.reviewer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{review.reviewer_name}</p>
                      {review.reviewer_role && <p className="text-xs text-primary">{review.reviewer_role}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-9 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsCarousel;
