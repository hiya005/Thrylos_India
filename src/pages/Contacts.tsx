import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, Users, Mail, Phone, Check, X, ArrowLeft, UserPlus, Inbox, ChevronRight } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';

interface ContactRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  profile?: {
    user_id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
    phone: string | null;
    is_verified: boolean;
    verification_type?: string | null;
    account_id: string | null;
  };
}

const Contacts = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [pendingReceived, setPendingReceived] = useState<ContactRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadContacts();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('contacts-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' }, () => loadContacts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    const { data: allRequests } = await supabase
      .from('contact_requests')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!allRequests) { setLoading(false); return; }

    // Get all related user IDs
    const userIds = new Set<string>();
    allRequests.forEach(r => {
      userIds.add(r.from_user_id);
      userIds.add(r.to_user_id);
    });
    userIds.delete(user.id);

    const { data: profiles } = await supabase
      .rpc('get_contact_profiles', { _user_ids: Array.from(userIds) });

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched = allRequests.map(r => ({
      ...r,
      profile: profileMap.get(r.from_user_id === user.id ? r.to_user_id : r.from_user_id) as any,
    }));

    setContacts(enriched.filter(r => r.status === 'accepted'));
    setPendingReceived(enriched.filter(r => r.status === 'pending' && r.to_user_id === user.id));
    setPendingSent(enriched.filter(r => r.status === 'pending' && r.from_user_id === user.id));
    setLoading(false);
  };

  const handleAccept = async (id: string) => {
    const req = pendingReceived.find(r => r.id === id);
    await supabase.from('contact_requests').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id);
    // Notify the sender that their request was accepted
    if (req) {
      const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('user_id', user!.id).maybeSingle();
      await supabase.from('notifications').insert({
        user_id: req.from_user_id,
        type: 'contact_accepted',
        title: 'Contact Request Accepted',
        message: `${myProfile?.full_name || 'Someone'} accepted your contact request`,
        related_user_id: user!.id,
      });
    }
    toast({ title: 'Contact accepted! ✅' });
    loadContacts();
  };

  const handleReject = async (id: string) => {
    const req = pendingReceived.find(r => r.id === id);
    await supabase.from('contact_requests').delete().eq('id', id);
    // Notify the sender
    if (req) {
      const { data: myProfile } = await supabase.from('profiles').select('full_name').eq('user_id', user!.id).maybeSingle();
      await supabase.from('notifications').insert({
        user_id: req.from_user_id,
        type: 'contact_rejected',
        title: 'Contact Request Declined',
        message: `${myProfile?.full_name || 'Someone'} declined your contact request`,
        related_user_id: user!.id,
      });
    }
    toast({ title: 'Request declined' });
    loadContacts();
  };

  if (authLoading) return <MainLayout><div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></MainLayout>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link to="/dashboard"><Button variant="ghost" size="sm" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Button></Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">My Contacts</h1>
            <p className="text-muted-foreground text-sm">Manage your contact requests and shared contacts</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Tabs defaultValue="contacts" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
                  <TabsTrigger value="received">
                    Requests ({pendingReceived.length})
                    {pendingReceived.length > 0 && <span className="ml-1 w-2 h-2 rounded-full bg-primary inline-block" />}
                  </TabsTrigger>
                  <TabsTrigger value="sent">Sent ({pendingSent.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="space-y-3">
                  {contacts.length === 0 ? (
                    <div className="text-center py-12 glass-card rounded-2xl">
                      <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">Start building your network by connecting with other professionals.</p>
                      <Link to="/search"><Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Find People</Button></Link>
                    </div>
                  ) : contacts.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <Link to={`/user/${c.profile?.username || c.profile?.account_id}`} className="flex-shrink-0">
                          {c.profile?.avatar_url ? (
                            <img src={c.profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                              {(c.profile?.full_name || '?').charAt(0)}
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/user/${c.profile?.username || c.profile?.account_id}`} className="font-semibold hover:text-primary transition truncate flex items-center gap-1.5">
                            {c.profile?.full_name || 'Anonymous'}
                            {c.profile?.is_verified && <VerifiedBadge verificationType={c.profile?.verification_type} className="w-4 h-4" />}
                          </Link>
                          {c.profile?.username && <p className="text-xs text-primary font-mono">@{c.profile.username}</p>}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {c.profile?.email && (
                              <a href={`mailto:${c.profile.email}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition">
                                <Mail className="w-3 h-3" />{c.profile.email}
                              </a>
                            )}
                            {c.profile?.phone && (
                              <a href={`tel:${c.profile.phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition">
                                <Phone className="w-3 h-3" />{c.profile.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="received" className="space-y-3">
                  {pendingReceived.length === 0 ? (
                    <div className="text-center py-12 glass-card rounded-2xl">
                      <Inbox className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground">No pending requests</p>
                    </div>
                  ) : pendingReceived.map(r => (
                    <div key={r.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                      <Link to={`/user/${r.profile?.username || r.profile?.account_id}`} className="flex-shrink-0">
                        {r.profile?.avatar_url ? (
                          <img src={r.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{(r.profile?.full_name || '?').charAt(0)}</div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.profile?.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">wants to connect</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(r.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(r.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="sent" className="space-y-3">
                  {pendingSent.length === 0 ? (
                    <div className="text-center py-12 glass-card rounded-2xl">
                      <Inbox className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground">No sent requests</p>
                    </div>
                  ) : pendingSent.map(r => (
                    <div key={r.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                      <Link to={`/user/${r.profile?.username || r.profile?.account_id}`} className="flex-shrink-0">
                        {r.profile?.avatar_url ? (
                          <img src={r.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{(r.profile?.full_name || '?').charAt(0)}</div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.profile?.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">Pending...</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
                      >Pending</Badge>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
          )}
            </div>
      </div>
    </MainLayout>
  );
};

export default Contacts;
