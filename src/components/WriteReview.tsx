import { useState, useEffect } from 'react';
import { Star, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const WriteReview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; company: string | null; is_verified: boolean } | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, avatar_url, company, is_verified')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as any);
      });
    supabase.from('reviews').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setHasReview(!!data);
    });
  }, [user]);

  if (!user || hasReview) return null;

  const handleSubmit = async () => {
    if (!reviewText.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      reviewer_name: profile?.full_name || user.email || 'Anonymous',
      reviewer_avatar_url: profile?.avatar_url,
      reviewer_role: profile?.company ? `Client at ${profile.company}` : null,
      review_text: reviewText.trim(),
      rating,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review submitted! ✨', description: 'Thank you for your feedback.' });
      setReviewText('');
      setRating(5);
      setOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
          <Star className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Write a Review
            {profile?.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {(profile?.full_name || 'U').charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-sm flex items-center gap-1">
                {profile?.full_name || user.email}
                {profile?.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </p>
              <p className="text-xs text-muted-foreground">{profile?.is_verified ? 'Verified Client' : 'Client'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Share your experience working with Thrylos India..."
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{reviewText.length}/500</p>

          <Button onClick={handleSubmit} className="w-full" disabled={submitting || !reviewText.trim()}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WriteReview;
