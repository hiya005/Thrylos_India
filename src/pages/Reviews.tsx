import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Send, Loader2, Quote, BadgeCheck, Sparkles, X, ChevronLeft, ChevronRight, CheckCircle2, ImageIcon, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: string;
  user_id: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  reviewer_role: string | null;
  review_text: string;
  rating: number;
  created_at: string;
  is_approved: boolean;
  review_images?: string[];
  profile_username?: string | null;
  profile_account_id?: string | null;
}

const Reviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; company: string | null; is_verified: boolean } | null>(null);
  const [current, setCurrent] = useState(0);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Detail dialog
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
    if (user) fetchProfile();
  }, [user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    if (data) {
      // Fetch usernames for all reviewers
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, account_id')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      setReviews(data.map(r => ({
        ...r,
        profile_username: profileMap.get(r.user_id)?.username || null,
        profile_account_id: profileMap.get(r.user_id)?.account_id || null,
      })) as Review[]);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, company, is_verified')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setProfile(data as any);
      setReviewerName(data.full_name || '');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || reviewImages.length >= 3) return;
    
    const remaining = 3 - reviewImages.length;
    const filesToUpload = Array.from(files).slice(0, remaining);
    
    setUploadingImage(true);
    const newUrls: string[] = [];
    
    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop();
      const fileName = `reviews/${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
        newUrls.push(publicUrl);
      }
    }
    
    setReviewImages(prev => [...prev, ...newUrls]);
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reviewText.trim() || !user) return;
    const name = reviewerName.trim() || profile?.full_name || user.email || 'Anonymous';
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      reviewer_name: name,
      reviewer_avatar_url: profile?.avatar_url || null,
      reviewer_role: profile?.company ? `Client at ${profile.company}` : null,
      review_text: reviewText.trim(),
      rating,
      review_images: reviewImages.length > 0 ? reviewImages : [],
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review submitted! ✨', description: 'Thank you! It will appear after approval.' });
      setReviewText('');
      setRating(5);
      setReviewImages([]);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const next = () => { if (reviews.length > 0) setCurrent(c => (c + 1) % reviews.length); };
  const prev = () => { if (reviews.length > 0) setCurrent(c => (c - 1 + reviews.length) % reviews.length); };
  const [hasExistingReview, setHasExistingReview] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('reviews').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
        setHasExistingReview(!!data);
      });
    }
  }, [user]);

  useEffect(() => {
    if (reviews.length <= 1 || selectedReview) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [reviews.length, selectedReview]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 blur-[140px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-8"
            >
              {[
                { label: 'Average Rating', value: avgRating, icon: Star, accent: 'text-yellow-400', detail: 'Verified client score' },
                { label: 'Total Reviews', value: reviews.length, icon: Users, accent: 'text-primary', detail: 'Approved public stories' },
              ].map((stat) => (
                <div key={stat.label} className="relative group min-w-[230px]">
                  <div className="absolute -inset-[1px] git commit -m "style: update statistics card radius" bg-gradient-to-br from-primary/35 via-muted/20 to-emerald-500/25 blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="relative glass-card git commit -m "style: update statistics card radius" px-6 py-5 flex items-center gap-4 border-primary/20 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                    <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center">
                      <stat.icon className={`w-5 h-5 ${stat.accent} ${stat.label === 'Average Rating' ? 'fill-yellow-400' : ''}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-bold leading-none">{stat.value}</p>
                      <p className="text-xs uppercase text-muted-foreground font-medium mt-1">{stat.label}</p>
                      <p className="text-[11px] text-muted-foreground/70">{stat.detail}</p>
                    </div>
                    <ShieldCheck className="absolute right-3 bottom-3 w-10 h-10 text-primary/5" />
                  </div>
                </div>
              ))}
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight leading-tight">
              What Our <span className="gradient-text">Clients Say</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-muted-foreground max-w-2xl mx-auto mb-10 text-base sm:text-lg">
              Read genuine feedback from businesses and clients who partnered with Thrylos India.
            </motion.p>
          </div>
        </section>

        {reviews.length > 0 && (
          <div className="relative overflow-hidden border-y border-border/30 bg-card/20 py-3">
            <motion.div className="flex gap-3 whitespace-nowrap" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
              {[...reviews, ...reviews].map((r, i) => (
                <span key={`${r.id}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {r.reviewer_name}: “{r.review_text.slice(0, 54)}...”
                </span>
              ))}
            </motion.div>
          </div>
        )}

        {/* Reviews Carousel — scroll-based like homepage */}
        <section className="py-12 sm:py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <Quote className="w-16 h-16 text-muted-foreground/20 mx-auto mb-5" />
                <p className="text-lg text-muted-foreground">No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto relative">
                <button onClick={prev} className="absolute left-0 sm:-left-14 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-card border-border/60 flex items-center justify-center hover:border-primary/50 hover:scale-105 transition-all">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <button onClick={next} className="absolute right-0 sm:-right-14 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-card border-border/60 flex items-center justify-center hover:border-primary/50 hover:scale-105 transition-all">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <div
                  className="glass-card rounded-3xl p-6 sm:p-10 mx-8 sm:mx-0 relative overflow-hidden border-primary/20 cursor-pointer"
                  onClick={() => setSelectedReview(selectedReview?.id === reviews[current].id ? null : reviews[current])}
                >
                  <motion.div key={`progress-${current}`} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5.8, ease: 'linear' }} className="absolute top-0 left-0 h-[2px] bg-primary/60" />
                  <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/10" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={reviews[current].id}
                      initial={{ opacity: 0, y: 28, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.38 }}
                      className="text-center"
                    >
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < reviews[current].rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <p className="text-base sm:text-lg md:text-xl font-medium italic leading-relaxed mb-6 text-foreground/90 line-clamp-4">
                        "{reviews[current].review_text}"
                      </p>

                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          {reviews[current].reviewer_avatar_url ? (
                            <img src={reviews[current].reviewer_avatar_url!} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/40 shadow-lg" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary border-2 border-primary/40">
                              {reviews[current].reviewer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-emerald-400 fill-background" />
                        </div>
                        <div>
                          {(reviews[current].profile_username || reviews[current].profile_account_id) ? (
                            <Link to={`/user/${reviews[current].profile_username || reviews[current].profile_account_id}`} className="font-semibold text-foreground hover:text-primary transition">{reviews[current].reviewer_name}</Link>
                          ) : (
                            <p className="font-semibold text-foreground">{reviews[current].reviewer_name}</p>
                          )}
                          {reviews[current].reviewer_role && <p className="text-sm text-primary mt-0.5">{reviews[current].reviewer_role}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground/50 mt-3">{selectedReview?.id === reviews[current].id ? 'Click to collapse' : 'Click to view full review'}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Inline expanded detail below the card */}
                <AnimatePresence>
                  {selectedReview && selectedReview.id === reviews[current].id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mx-8 sm:mx-0 overflow-hidden"
                    >
                      <div className="glass-card git commit -m "style: update statistics card radius" p-6 sm:p-8 mt-4 border-primary/10 space-y-5">
                        <div className="flex items-center gap-4">
                          {selectedReview.reviewer_avatar_url ? (
                            <img src={selectedReview.reviewer_avatar_url} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary ring-2 ring-primary/30">
                              {selectedReview.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            {(selectedReview.profile_username || selectedReview.profile_account_id) ? (
                              <Link to={`/user/${selectedReview.profile_username || selectedReview.profile_account_id}`} className="font-bold text-lg hover:text-primary transition">{selectedReview.reviewer_name}</Link>
                            ) : (
                              <p className="font-bold text-lg">{selectedReview.reviewer_name}</p>
                            )}
                            {selectedReview.reviewer_role && <p className="text-sm text-primary">{selectedReview.reviewer_role}</p>}
                            <p className="text-xs text-muted-foreground mt-1">{new Date(selectedReview.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{selectedReview.review_text}</p>
                        {selectedReview.review_images && selectedReview.review_images.length > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            {selectedReview.review_images.map((img, i) => (
                              <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                <img src={img} alt="" className="w-full aspect-square rounded-xl object-cover border border-border/50 hover:opacity-80 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-center gap-2 mt-6">
                  {reviews.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-9 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Write Review Section */}
        <section id="write-review" className="py-20 sm:py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-3"><span className="gradient-text">Share Your Experience</span></h2>
                <p className="text-sm sm:text-base text-muted-foreground">{user ? 'Your feedback helps us grow' : 'Sign in to write a review'}</p>
              </motion.div>

              {user ? (
                hasExistingReview ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
                    <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-emerald-500/20 to-primary/10 blur-sm" />
                    <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-10 text-center border border-border/30">
                      <CheckCircle2 className="w-14 h-14 text-emerald-400/50 mx-auto mb-5" />
                      <p className="text-lg font-semibold mb-2">You've already submitted a review</p>
                      <p className="text-muted-foreground text-sm">Thank you for your feedback! Each user can submit one review.</p>
                    </div>
                  </motion.div>
                ) :
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} className="relative">
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary/30 via-blue-500/10 to-cyan-500/20 blur-sm" />
                  <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-7 sm:p-9 space-y-6 border border-border/30">
                    {/* Profile preview */}
                    <div className="flex items-center gap-3.5 bg-muted/20 p-4 git commit -m "style: update statistics card radius" border border-border/30">
                      <div className="relative flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-blue-500/20 flex items-center justify-center text-base font-bold text-primary">
                            {(reviewerName || 'U').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="Your name" className="h-8 text-sm bg-transparent border-none p-0 font-semibold focus-visible:ring-0" />
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {profile?.is_verified ? <span className="flex items-center gap-1 text-emerald-400"><BadgeCheck className="w-3.5 h-3.5" /> Verified Client</span> : 'Client'}
                        </p>
                      </div>
                    </div>

                    {/* Star rating */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-3 block">Rating</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <motion.button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)} whileHover={{ scale: 1.2, rotate: 10 }} whileTap={{ scale: 0.9 }} className="p-1">
                            <Star className={`w-9 h-9 transition-all duration-200 ${s <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-muted-foreground/25'}`} />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Textarea placeholder="Share your experience working with Thrylos India..." value={reviewText} onChange={e => setReviewText(e.target.value)} rows={5} maxLength={500} className="rounded-xl resize-none border-border/40 focus:border-primary/50 bg-muted/10" />
                      <p className="text-xs text-muted-foreground text-right mt-1.5">{reviewText.length}/500</p>
                    </div>

                    {/* Image upload */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Screenshots (optional, max 3)</Label>
                      <div className="flex gap-3 flex-wrap">
                        {reviewImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt="" className="w-20 h-20 rounded-xl object-cover border border-border/50" />
                            <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {reviewImages.length < 3 && (
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                          >
                            {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /><span className="text-[10px] mt-1">Upload</span></>}
                          </button>
                        )}
                      </div>
                      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </div>

                    <Button onClick={handleSubmit} className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20" disabled={submitting || !reviewText.trim()}>
                      {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                      Submit Review
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary/20 to-blue-500/10 blur-sm" />
                  <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-10 text-center border border-border/30">
                    <Star className="w-14 h-14 text-primary/25 mx-auto mb-5" />
                    <p className="text-muted-foreground mb-5 text-base">Please sign in to write a review</p>
                    <a href="/auth"><Button size="lg" className="rounded-xl px-8">Sign In</Button></a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>

    </MainLayout>
  );
};

export default Reviews;