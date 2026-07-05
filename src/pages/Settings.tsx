import { useEffect, useState, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Phone, User, Lock, Eye, EyeOff, KeyRound, Mail, Bell, Trash2, LogOut, Shield, Globe, Info, Copy, Check, Monitor, Smartphone, AtSign, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, languageLabels, type Language } from '@/contexts/LanguageContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface SessionData {
  id: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  last_seen_at: string;
}

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ full_name: '', phone: '', avatar_url: '', account_id: '', username: '', username_changed_at: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('thrylos_notifications') !== 'disabled';
  });

  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdStep, setChangePwdStep] = useState<'send' | 'otp' | 'password'>('send');
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      trackSession();
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    if (profile.username && !originalUsername) setOriginalUsername(profile.username);
  }, [profile.username]);

  const toggleNotifications = () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    localStorage.setItem('thrylos_notifications', newVal ? 'enabled' : 'disabled');
    toast({ title: newVal ? 'Notifications enabled' : 'Notifications disabled' });
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('full_name, phone, avatar_url, account_id, username, username_changed_at').eq('user_id', user.id).maybeSingle();
    if (data) setProfile({
      full_name: data.full_name || '',
      phone: data.phone || '',
      avatar_url: data.avatar_url || '',
      account_id: (data as any).account_id || '',
      username: (data as any).username || '',
      username_changed_at: (data as any).username_changed_at || '',
    });
    setLoading(false);
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    const deviceName = isMobile ? 'Mobile Device' : 'Desktop';

    return { browser, os, device_name: deviceName };
  };

  const trackSession = async () => {
    if (!user) return;
    const { browser, os, device_name } = getBrowserInfo();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${SUPABASE_URL}/functions/v1/track-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ device_name, browser, os }),
      });
    } catch (e) { console.error('Session tracking error:', e); }
  };

  const loadSessions = async () => {
    if (!user) return;
    setSessionsLoading(true);
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false })
      .limit(5);
    setSessions((data || []) as SessionData[]);
    setSessionsLoading(false);
  };

  const validateUsername = async (value: string) => {
    if (!value) { setUsernameError(''); return; }
    if (value.length < 5) { setUsernameError('Minimum 5 characters'); return; }
    if (value.length > 25) { setUsernameError('Maximum 25 characters'); return; }
    if (!/^[a-zA-Z0-9._]+$/.test(value)) { setUsernameError('Only letters, numbers, dots, and underscores'); return; }
    
    setCheckingUsername(true);
    const { data } = await supabase.from('profiles').select('user_id').eq('username', value).neq('user_id', user?.id || '').maybeSingle();
    if (data) setUsernameError('Username already taken');
    else setUsernameError('');
    setCheckingUsername(false);
  };

  const canChangeUsername = () => {
    if (!profile.username_changed_at) return true;
    const lastChanged = new Date(profile.username_changed_at);
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 30;
  };

  const daysUntilUsernameChange = () => {
    if (!profile.username_changed_at) return 0;
    const lastChanged = new Date(profile.username_changed_at);
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(30 - daysSince));
  };


  const handleSaveProfile = async () => {
    if (!user) return;
    if (profile.username && (profile.username.length < 5 || profile.username.length > 25)) {
      toast({ title: 'Error', description: 'Username must be 5-25 characters', variant: 'destructive' }); return;
    }
    if (usernameError) { toast({ title: 'Error', description: usernameError, variant: 'destructive' }); return; }
    
    const usernameChanged = profile.username !== originalUsername && profile.username !== '';
    if (usernameChanged && !canChangeUsername()) {
      toast({ title: 'Error', description: `You can change your username in ${daysUntilUsernameChange()} days`, variant: 'destructive' }); return;
    }

    setSaving(true);
    const updateData: any = { full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url };
    if (profile.username) {
      updateData.username = profile.username.toLowerCase();
      if (usernameChanged) updateData.username_changed_at = new Date().toISOString();
    }
    
    const { error } = await supabase.from('profiles').update(updateData).eq('user_id', user.id);
    if (error) {
      if (error.message.includes('unique')) toast({ title: 'Error', description: 'Username already taken', variant: 'destructive' });
      else toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile Updated!', description: 'Your changes have been saved' });
      if (usernameChanged) {
        setOriginalUsername(profile.username);
        setProfile(prev => ({ ...prev, username_changed_at: new Date().toISOString() }));
      }
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    toast({ title: 'Photo Updated!' });
    setUploading(false);
  };

  const copyAccountId = () => {
    navigator.clipboard.writeText(profile.account_id);
    setCopiedId(true);
    toast({ title: 'Copied!' });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const sendChangeOtp = async () => {
    if (!user?.email) return;
    setChangingPwd(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, isSignup: false, isPasswordReset: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email' });
      setChangePwdStep('otp');
    } catch (error: unknown) { toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' }); }
    finally { setChangingPwd(false); }
  };

  const verifyChangeOtp = () => { if (otp.length !== 6) { toast({ title: 'Error', description: 'Enter 6-digit code', variant: 'destructive' }); return; } setChangePwdStep('password'); };

  const submitNewPassword = async () => {
    if (!newPwd || newPwd.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    if (newPwd !== confirmPwd) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    setChangingPwd(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user?.email, otp, newPassword: newPwd }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Password Changed!' });
      setChangePwdOpen(false);
      resetChangePwd();
    } catch (error: unknown) { toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' }); }
    finally { setChangingPwd(false); }
  };

  const resetChangePwd = () => { setChangePwdStep('send'); setOtp(''); setNewPwd(''); setConfirmPwd(''); };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 flex-wrap">
          <Link to="/dashboard"><Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3"><ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">{t('back_to_dashboard')}</span><span className="sm:hidden">Back</span></Button></Link>
          <h1 className="text-base sm:text-lg font-semibold">{t('account_settings')}</h1>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/contacts"><Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2" />Contacts</Button></Link>
            <Link to="/search"><Button variant="outline" size="sm"><Users className="w-4 h-4 mr-2" />Find People</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border-2 border-border">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-muted-foreground" /></div>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              {profile.account_id && (
                <button onClick={copyAccountId} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group">
                  <span className="text-xs font-mono font-bold text-primary">{profile.account_id}</span>
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />}
                </button>
              )}
              {profile.username && (
                <Link to={`/user/${profile.username}`} className="text-sm text-primary hover:underline">View Public Profile →</Link>
              )}
            </div>

            {/* Profile Info */}
            <div className="glass-card rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5" /> {t('profile_info')}</h2>
              <div><Label>{t('full_name')}</Label><Input value={profile.full_name} onChange={e => setProfile(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Your Name" /></div>
              
              {/* Username */}
              <div>
                <Label className="flex items-center gap-2"><AtSign className="w-4 h-4" />Username</Label>
                {!canChangeUsername() ? (
                  <>
                    <Input value={profile.username} disabled className="opacity-60" />
                    <p className="text-xs text-muted-foreground mt-1">You can change your username in {daysUntilUsernameChange()} days</p>
                  </>
                ) : (
                  <>
                    <Input
                      value={profile.username}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
                        setProfile(prev => ({ ...prev, username: val }));
                        validateUsername(val);
                      }}
                      placeholder="your_username (5-25 characters)"
                      maxLength={25}
                      className={usernameError ? 'border-destructive' : ''}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {usernameError ? (
                        <p className="text-xs text-destructive">{usernameError}</p>
                      ) : profile.username && profile.username.length >= 5 ? (
                        <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />Available</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Min 5, max 25 characters. Letters, numbers, dots, underscores</p>
                      )}
                      {checkingUsername && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label>{t('email')}</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={user.email || ''} disabled className="pl-10 opacity-60" /></div>
                <p className="text-xs text-muted-foreground mt-1">{t('email_cannot_change')}</p>
              </div>
              <div>
                <Label>{t('phone_number')}</Label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={profile.phone} onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="pl-10" /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving || !!usernameError} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('loading')}</> : t('save_changes')}
              </Button>
            </div>

            {/* Notifications */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5" /> {t('notifications')}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('push_notifications')}</p>
                  <p className="text-xs text-muted-foreground">{t('receive_notifications')}</p>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
              </div>
            </div>

            {/* Language */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5" /> {t('language')}</h2>
              <p className="text-xs text-muted-foreground">{t('select_language')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(languageLabels) as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); toast({ title: `${languageLabels[lang]} selected ✓` }); }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      language === lang
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                        : 'bg-card/50 text-foreground border-border/50 hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Info className="w-5 h-5" /> {t('account_info')}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('account_id')}</p>
                  <p className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">{profile.account_id || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('member_since')}</p>
                  <p className="text-sm">{new Date(user.created_at || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('last_sign_in')}</p>
                  <p className="text-sm">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Active Sessions - Real */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Monitor className="w-5 h-5" /> {t('active_sessions')}</h2>
              {sessionsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : sessions.length === 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {/Mobi|Android/i.test(navigator.userAgent) ? <Smartphone className="w-5 h-5 text-primary" /> : <Monitor className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('current_device')}</p>
                    <p className="text-xs text-muted-foreground">Current session</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/40">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {s.device_name === 'Mobile Device' ? <Smartphone className="w-5 h-5 text-primary" /> : <Monitor className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.device_name || 'Unknown'} • {s.browser || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{s.os || 'Unknown OS'} • {s.ip_address || 'Unknown IP'}</p>
                        <p className="text-xs text-muted-foreground">{s.city && s.city !== 'Unknown' ? `${s.city}, ${s.country}` : s.country || 'Unknown location'}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5" /> {t('security')}</h2>
              <p className="text-sm text-muted-foreground">{t('change_pwd_desc')}</p>
              <Button variant="outline" onClick={() => { setChangePwdOpen(true); resetChangePwd(); }} className="w-full">
                <Lock className="w-4 h-4 mr-2" /> {t('change_password')}
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-xl p-6 space-y-4 border-destructive/20">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" /> {t('danger_zone')}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('sign_out')}</p>
                  <p className="text-xs text-muted-foreground">{t('sign_out_desc')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />{t('sign_out')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Change Password Dialog */}
      <Dialog open={changePwdOpen} onOpenChange={open => { setChangePwdOpen(open); if (!open) resetChangePwd(); }}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> {t('change_password')}</DialogTitle></DialogHeader>
          {changePwdStep === 'send' && (
            <div className="space-y-4 mt-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"><Mail className="w-7 h-7 text-primary" /></div>
              <p className="text-sm text-muted-foreground">We'll send a code to <span className="font-medium text-foreground">{user?.email}</span></p>
              <Button onClick={sendChangeOtp} className="w-full" disabled={changingPwd}>{changingPwd ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Verification Code'}</Button>
            </div>
          )}
          {changePwdStep === 'otp' && (
            <div className="space-y-5 mt-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3"><KeyRound className="w-7 h-7 text-primary" /></div>
                <p className="text-sm text-muted-foreground mb-1">Code sent to</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-lg border-2 rounded-lg" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-lg border-2 rounded-lg" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-lg border-2 rounded-lg" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="w-12 h-14 text-lg border-2 rounded-lg" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-lg border-2 rounded-lg" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-lg border-2 rounded-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={verifyChangeOtp} className="w-full" disabled={otp.length !== 6}>Verify & Continue</Button>
              <button onClick={sendChangeOtp} disabled={changingPwd} className="w-full text-center text-sm text-primary hover:underline disabled:opacity-50">Resend Code</button>
            </div>
          )}
          {changePwdStep === 'password' && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" className="pl-10 pr-10" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm Password</Label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="password" placeholder="Confirm password" className="pl-10" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} /></div>
              </div>
              <Button onClick={submitNewPassword} className="w-full" disabled={changingPwd}>{changingPwd ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Changing...</> : t('change_password')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
