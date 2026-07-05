import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, Users, UserPlus, UserCheck, Star, MessageSquare, Mail, Phone, ArrowLeft, BadgeCheck, Copy, Check, ChevronRight, Search as SearchIcon, Shield, CreditCard, Eye, FolderOpen } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { load } from '@cashfreepayments/cashfree-js';

interface UserProfileData {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  account_id: string | null;
  company: string | null;
  is_verified: boolean;
  verification_type?: string | null;
  created_at: string;
}

interface Review {
  id: string;
  review_text: string;
  rating: number;
  created_at: string;
  review_images?: string[];
}

interface UserProject {
  id: string;
  title: string;
  status: string;
  service_type: string | null;
  created_at: string;
  show_on_profile: boolean;
  profile_showcase_requested: boolean;
  project_url: string | null;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [followers, setFollowers] = useState<UserProfileData[]>([]);
  const [following, setFollowing] = useState<UserProfileData[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [buyingVerification, setBuyingVerification] = useState(false);
  const [verificationSub, setVerificationSub] = useState<any>(null);

  useEffect(() => {
    if (username) loadProfile();
  }, [username, user]);

  const loadProfile = async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('user_id, full_name, username, avatar_url, account_id, company, is_verified, verification_type, created_at');
    
    const { data: byUsername } = await q.eq('username', username).maybeSingle();
    let prof = byUsername;
    if (!prof) {
      const { data: byId } = await supabase.from('profiles').select('user_id, full_name, username, avatar_url, account_id, company, is_verified, verification_type, created_at').eq('account_id', username).maybeSingle();
      prof = byId;
    }

    if (!prof) { setLoading(false); return; }
    setProfile(prof as any);

    const userId = prof.user_id;
    const [projectsRes, reviewsRes, followersRes, followingRes, userProjectsRes] = await Promise.all([
      supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reviews').select('id, review_text, rating, created_at, review_images').eq('user_id', userId).eq('is_approved', true).order('created_at', { ascending: false }),
      supabase.from('follows').select('follower_id').eq('following_id', userId),
      supabase.from('follows').select('following_id').eq('follower_id', userId),
      supabase.from('service_requests').select('id, title, status, service_type, created_at, show_on_profile, profile_showcase_requested, project_url').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    ]);

    setProjectCount(projectsRes.count || 0);
    setReviews((reviewsRes.data || []) as Review[]);
    setFollowerCount(followersRes.data?.length || 0);
    setFollowingCount(followingRes.data?.length || 0);
    setProjects((userProjectsRes.data || []) as UserProject[]);

    if (user && user.id !== userId) {
      const [followCheck, contactCheck] = await Promise.all([
        supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle(),
        supabase.from('contact_requests').select('status').or(`and(from_user_id.eq.${user.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${user.id})`).maybeSingle(),
      ]);
      setIsFollowing(!!followCheck.data);
      setContactStatus(contactCheck.data?.status || null);
    }

    // Check verification subscription for own profile
    if (user && user.id === userId) {
      const { data: sub } = await supabase.from('verification_subscriptions').select('*').eq('user_id', userId).maybeSingle();
      setVerificationSub(sub);
    }

    setLoading(false);
  };

  const loadFollowersList = async () => {
    if (!profile) return;
    const { data: fIds } = await supabase.from('follows').select('follower_id').eq('following_id', profile.user_id);
    if (fIds && fIds.length > 0) {
      const ids = fIds.map(f => f.follower_id);
      const { data } = await supabase.from('profiles').select('user_id, full_name, username, avatar_url, account_id, company, is_verified, verification_type, created_at').in('user_id', ids);
      setFollowers((data || []) as UserProfileData[]);
    } else {
      setFollowers([]);
    }
    setShowFollowers(true);
  };

  const loadFollowingList = async () => {
    if (!profile) return;
    const { data: fIds } = await supabase.from('follows').select('following_id').eq('follower_id', profile.user_id);
    if (fIds && fIds.length > 0) {
      const ids = fIds.map(f => f.following_id);
      const { data } = await supabase.from('profiles').select('user_id, full_name, username, avatar_url, account_id, company, is_verified, verification_type, created_at').in('user_id', ids);
      setFollowing((data || []) as UserProfileData[]);
    } else {
      setFollowing([]);
    }
    setShowFollowing(true);
  };

  const handleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.user_id);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
      toast({ title: 'Unfollowed' });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.user_id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
      // Send notification to the followed user
      const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        type: 'new_follower',
        title: 'New Follower',
        message: `${myProfile?.full_name || 'Someone'} started following you`,
        related_user_id: user.id,
      });
      toast({ title: 'Following!' });
    }
    setFollowLoading(false);
  };

  const handleContactRequest = async () => {
    if (!user || !profile) return;
    setContactLoading(true);
    const { error } = await supabase.from('contact_requests').insert({ from_user_id: user.id, to_user_id: profile.user_id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setContactStatus('pending');
      // Send notification
      const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        type: 'contact_request',
        title: 'Contact Request',
        message: `${myProfile?.full_name || 'Someone'} wants to connect with you`,
        related_user_id: user.id,
      });
      toast({ title: 'Contact request sent!' });
    }
    setContactLoading(false);
  };

  const handleBuyVerification = async () => {
    if (!user) return;
    setBuyingVerification(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Create a special payment request for verification
      const { data: payReq, error: payErr } = await supabase.from('verification_subscriptions').insert({
        user_id: user.id,
        status: 'pending',
        amount: 99,
      }).select().single();
      
      if (payErr) {
        if (payErr.code === '23505') {
          toast({ title: 'Already subscribed', description: 'You already have a verification subscription.' });
        } else {
          toast({ title: 'Error', description: payErr.message, variant: 'destructive' });
        }
        setBuyingVerification(false);
        return;
      }

      // For now, mark as verified directly (since Cashfree subscription API requires additional setup)
      // In production, this would go through the payment gateway
      toast({ title: 'Verification Purchase', description: 'Verification badge will be activated by the admin after payment verification. Contact support for payment details.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to process', variant: 'destructive' });
    }
    setBuyingVerification(false);
  };

  const copyId = () => {
    if (!profile?.account_id) return;
    navigator.clipboard.writeText(profile.account_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderUserCard = (u: UserProfileData, onClose: () => void) => (
    <Link
      key={u.user_id}
      to={`/user/${u.username || u.account_id}`}
      onClick={onClose}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 border border-transparent hover:border-border/50 transition-all group"
    >
      <div className="flex-shrink-0">
        {u.avatar_url ? (
          <img src={u.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary ring-2 ring-border">
            {(u.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate flex items-center gap-1.5">
          {u.full_name || 'Anonymous'}
          {u.is_verified && <VerifiedBadge verificationType={u.verification_type} className="w-3.5 h-3.5" />}
        </p>
        {u.username && <p className="text-xs text-primary font-mono">@{u.username}</p>}
        {u.company && <p className="text-xs text-muted-foreground">{u.company}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition flex-shrink-0" />
    </Link>
  );

  if (loading) return <MainLayout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></MainLayout>;
  if (!profile) return <MainLayout><div className="min-h-screen flex items-center justify-center flex-col gap-4"><p className="text-xl text-muted-foreground">User not found</p><Link to="/search"><Button variant="outline">Search Users</Button></Link></div></MainLayout>;

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-6" onClick={() => window.history.back()}><ArrowLeft className="w-4 h-4 mr-2" />Go Back</Button>

          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary ring-4 ring-primary/20">
                    {(profile.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  {profile.full_name || 'Anonymous'}
                  {profile.is_verified && <VerifiedBadge verificationType={profile.verification_type} className="w-5 h-5" />}
                </h1>
                {profile.username && <p className="text-sm text-primary font-mono">@{profile.username}</p>}
                {profile.company && <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">{profile.company}</p>}
                {profile.account_id && (
                  <button onClick={copyId} className="mt-1 inline-flex items-center gap-1.5 text-xs font-mono bg-muted/30 px-3 py-1 rounded-lg border border-border/50 hover:bg-muted/50 transition">
                    {profile.account_id}
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                )}
                <p className="text-xs text-muted-foreground pt-1">Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 rounded-xl bg-muted/20 border border-border/30">
                <p className="text-2xl font-bold text-primary">{projectCount}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <button onClick={loadFollowersList} className="text-center p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/40 transition">
                <p className="text-2xl font-bold text-primary">{followerCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </button>
              <button onClick={loadFollowingList} className="text-center p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-primary/40 transition">
                <p className="text-2xl font-bold text-primary">{followingCount}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </button>
            </div>

            {/* Actions */}
            {user && !isOwnProfile && (
              <div className="flex gap-3 mt-6">
                <Button onClick={handleFollow} disabled={followLoading} variant={isFollowing ? 'outline' : 'default'} className="flex-1">
                  {isFollowing ? <><UserCheck className="w-4 h-4 mr-2" />Following</> : <><UserPlus className="w-4 h-4 mr-2" />Follow</>}
                </Button>
                {contactStatus === 'accepted' ? (
                  <Button variant="outline" className="flex-1 text-emerald-400 border-emerald-400/30">
                    <Mail className="w-4 h-4 mr-2" />Contact Shared
                  </Button>
                ) : contactStatus === 'pending' ? (
                  <Button variant="outline" disabled className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />Request Pending
                  </Button>
                ) : (
                  <Button onClick={handleContactRequest} disabled={contactLoading} variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />Get Contact
                  </Button>
                )}
              </div>
            )}
            {isOwnProfile && (
              <div className="mt-6 space-y-3">
                <Link to="/settings"><Button variant="outline" className="w-full">Edit Profile</Button></Link>
                {!profile.is_verified && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Get Verified</p>
                        <p className="text-xs text-muted-foreground">Starting at ₹99/year</p>
                      </div>
                      <Link to="/verification-plans">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                          View Plans
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
                {profile.is_verified && verificationSub && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified until {new Date(verificationSub.expires_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Projects Showcase - visible to all if approved, own profile shows all with request options */}
          {(() => {
            const visibleProjects = isOwnProfile ? projects : projects.filter(p => p.show_on_profile);
            if (visibleProjects.length === 0 && !isOwnProfile) return null;
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><FolderOpen className="w-5 h-5 text-primary" />Projects with THRYLOS ({isOwnProfile ? projects.length : visibleProjects.length})</h2>
                {visibleProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No projects to display yet</p>
                ) : (
                  <div className="space-y-3">
                    {visibleProjects.map(project => (
                      <div key={project.id} className="p-3 rounded-xl bg-muted/10 border border-border/30 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {project.show_on_profile && project.project_url ? (
                            <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate text-primary hover:underline block">{project.title}</a>
                          ) : (
                            <p className="text-sm font-medium truncate">{project.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {project.service_type && <span className="text-xs text-primary">{project.service_type}</span>}
                            <span className="text-xs text-muted-foreground">{new Date(project.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOwnProfile && !project.show_on_profile && !project.profile_showcase_requested && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                              if (!project.project_url || !project.project_url.startsWith('http')) {
                                toast({ title: 'Project URL required', description: 'Ask your coordinator to add a valid project URL before requesting showcase.', variant: 'destructive' });
                                return;
                              }
                              const { error } = await supabase.from('service_requests').update({ profile_showcase_requested: true } as any).eq('id', project.id);
                              if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
                              else { toast({ title: 'Showcase request sent!' }); loadProfile(); }
                            }}>
                              <Eye className="w-3 h-3 mr-1" />Show on Profile
                            </Button>
                          )}
                          {isOwnProfile && project.profile_showcase_requested && !project.show_on_profile && (
                            <span className="text-xs text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10">Pending Approval</span>
                          )}
                          {project.show_on_profile && (
                            <span className="text-xs text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">Showcased</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            project.status === 'completed' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                            project.status === 'in_progress' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                            project.status === 'cancelled' ? 'text-destructive border-destructive/30 bg-destructive/10' :
                            'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          } capitalize`}>{project.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Reviews */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Star className="w-5 h-5 text-yellow-400" />Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-4 rounded-xl bg-muted/10 border border-border/30">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-foreground/90">{review.review_text}</p>
                    {review.review_images && review.review_images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.review_images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-border/30" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Followers ({followerCount})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto -mx-2 px-2">
            {followers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No followers yet</p>
              </div>
            ) : followers.map(f => renderUserCard(f, () => setShowFollowers(false)))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Following ({followingCount})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto -mx-2 px-2">
            {following.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Not following anyone</p>
              </div>
            ) : following.map(f => renderUserCard(f, () => setShowFollowing(false)))}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default UserProfile;
