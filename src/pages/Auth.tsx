import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { Mail, User, Loader2, ArrowLeft, Lock, Eye, EyeOff, KeyRound, AlertCircle, RotateCcw } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AuthStep = 'form' | 'otp' | 'forgot' | 'forgot-otp' | 'reset-password';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('form');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthRetrying, setOauthRetrying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, session } = useAuth();

  const oauthErrorCode = useMemo(() => searchParams.get('oauth_error') || searchParams.get('error'), [searchParams]);
  const oauthErrorDescription = useMemo(() => searchParams.get('oauth_error_description') || searchParams.get('error_description'), [searchParams]);

  useEffect(() => {
    const authMode = searchParams.get('auth');
    if (authMode === 'signup') setIsSignup(true);
    if (authMode === 'login') setIsSignup(false);
  }, [searchParams]);

  useEffect(() => {
    if (!oauthErrorCode && !oauthErrorDescription) return;

    const message = oauthErrorDescription
      ? decodeURIComponent(oauthErrorDescription)
      : oauthErrorCode === 'domain_not_configured'
        ? 'Google sign-in is not yet connected to this production domain.'
        : 'Google sign-in could not be completed. Please try again.';

    setOauthError(message);
    toast({ title: 'Google sign-in failed', description: message, variant: 'destructive' });

    const next = new URLSearchParams(searchParams);
    next.delete('oauth_error');
    next.delete('oauth_error_description');
    next.delete('error');
    next.delete('error_description');
    setSearchParams(next, { replace: true });
  }, [oauthErrorCode, oauthErrorDescription, searchParams, setSearchParams, toast]);

  // OAuth uses native /~oauth/initiate proxy on whatever origin the user is on (works on
  // both .lovable.app and the custom domain thrylosindia.in once DNS is connected).

  const handleLogin = async () => {
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (!password) {
      toast({ title: 'Error', description: 'Please enter your password', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Welcome back!', description: 'You have been logged in' });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendSignupOtp = async () => {
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' });
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9._]{5,25}$/;
    if (!usernameRegex.test(username)) {
      toast({ title: 'Error', description: 'Username must be 5-25 characters (letters, numbers, . or _)', variant: 'destructive' });
      return;
    }
    if (!password || password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, isSignup: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email for the verification code' });
      setStep('otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, fullName, password, username, isSignup: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      toast({ title: 'Account Created!', description: 'You can now login with your password' });
      setStep('form');
      setIsSignup(false);
      setOtp('');
      setFullName('');
      setUsername('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendForgotOtp = async () => {
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isSignup: false, isPasswordReset: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email for the reset code' });
      setStep('forgot-otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }
    setStep('reset-password');
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Password reset failed');
      toast({ title: 'Password Reset!', description: 'You can now login with your new password' });
      setStep('form');
      setIsSignup(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => { setStep('form'); setOtp(''); setNewPassword(''); setConfirmPassword(''); };

  const startGoogleAuth = async (mode: 'login' | 'signup') => {
    setLoading(true);
    setOauthError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?auth=${mode}`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });

      if (error) throw error;
      // OAuth will redirect, so no need to handle response here
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : mode === 'signup' ? 'Google sign-up failed' : 'Google sign-in failed';
      const message = /invalid.*redirect|redirect.*not allowed|not authorized/i.test(rawMessage)
        ? 'Google OAuth configuration issue. Please ensure redirect URIs are correctly registered in Supabase.'
        : /404|not found/i.test(rawMessage)
        ? 'OAuth service temporarily unavailable. Please try again.'
        : /session|redirect|cancel/i.test(rawMessage)
        ? 'OAuth flow was cancelled or redirected. Please try again.'
        : rawMessage;

      console.error('OAuth error:', error);
      setOauthError(message);
      toast({ title: 'Google sign-in failed', description: message, variant: 'destructive' });
      navigate(`/auth?oauth_error=retry_required&oauth_error_description=${encodeURIComponent(message)}`, { replace: true });
    } finally {
      setLoading(false);
      setOauthRetrying(false);
    }
  };

  const retryGoogleAuth = async () => {
    setOauthRetrying(true);
    await startGoogleAuth(isSignup ? 'signup' : 'login');
  };

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                Welcome to <span className="gradient-text">THRYLOS INDIA</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {step === 'form' ? 'Sign in or create an account' :
                 step === 'otp' ? 'Verify your email to create account' :
                 step === 'forgot' ? 'Enter your email to reset password' :
                 step === 'forgot-otp' ? 'Enter the code sent to your email' :
                 'Set your new password'}
              </p>
            </div>

            <div className="glass-card p-5 sm:p-8 rounded-xl">
              {step === 'form' ? (
                <Tabs defaultValue={isSignup ? 'signup' : 'login'} value={isSignup ? 'signup' : 'login'} onValueChange={(v) => { setIsSignup(v === 'signup'); setOauthError(null); }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                    <TabsTrigger value="login" className="text-xs sm:text-sm">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            className="pl-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button onClick={handleLogin} className="w-full" disabled={loading}>
                        {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</>) : 'Sign In'}
                      </Button>
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                      </div>
                      {oauthError && !isSignup && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-left">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive flex-shrink-0" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Google sign-in needs a retry</p>
                              <p className="text-xs text-muted-foreground">{oauthError}</p>
                              <Button type="button" variant="outline" size="sm" onClick={retryGoogleAuth} disabled={loading || oauthRetrying}>
                                {oauthRetrying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Retrying...</> : <><RotateCcw className="w-4 h-4 mr-2" />Retry Google login</>}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="w-full" disabled={loading} onClick={() => startGoogleAuth('login')}>
                        <GoogleIcon className="w-5 h-5 mr-2" />Continue with Google
                      </Button>
                      <div className="text-center">
                        <button
                          onClick={() => setStep('forgot')}
                          className="text-xs sm:text-sm text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="text" placeholder="Your Name" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Username</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                          <Input type="text" placeholder="choose_username" className="pl-8" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} maxLength={25} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">5-25 chars • letters, numbers, . or _</p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 6 characters"
                            className="pl-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendSignupOtp()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button onClick={sendSignupOtp} className="w-full" disabled={loading}>
                        {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending Code...</>) : 'Create Account'}
                      </Button>
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                      </div>
                      {oauthError && isSignup && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-left">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive flex-shrink-0" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Google sign-up needs a retry</p>
                              <p className="text-xs text-muted-foreground">{oauthError}</p>
                              <Button type="button" variant="outline" size="sm" onClick={retryGoogleAuth} disabled={loading || oauthRetrying}>
                                {oauthRetrying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Retrying...</> : <><RotateCcw className="w-4 h-4 mr-2" />Retry Google sign-up</>}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="w-full" disabled={loading} onClick={() => startGoogleAuth('signup')}>
                        <GoogleIcon className="w-5 h-5 mr-2" />Sign up with Google
                      </Button>
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">We'll send a verification code to your email</p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : step === 'otp' || step === 'forgot-otp' ? (
                <div className="space-y-4 sm:space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-1 sm:mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />Back
                  </Button>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Code sent to</p>
                    <p className="font-medium text-sm sm:text-base break-all">{email}</p>
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
                  <Button
                    onClick={step === 'otp' ? verifySignupOtp : verifyForgotOtp}
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>) : 'Verify & Continue'}
                  </Button>
                  <div className="text-center">
                    <button
                      onClick={step === 'otp' ? sendSignupOtp : sendForgotOtp}
                      disabled={loading}
                      className="text-xs sm:text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </div>
              ) : step === 'forgot' ? (
                <div className="space-y-4 sm:space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-1 sm:mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />Back
                  </Button>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-1">Reset Password</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Enter your email to receive a reset code</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendForgotOtp()} />
                    </div>
                  </div>
                  <Button onClick={sendForgotOtp} className="w-full" disabled={loading}>
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending Code...</>) : 'Send Reset Code'}
                  </Button>
                </div>
              ) : step === 'reset-password' ? (
                <div className="space-y-4 sm:space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-1 sm:mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />Back
                  </Button>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-1">Set New Password</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Choose a strong password for your account</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        className="pl-10 pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        className="pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && resetPassword()}
                      />
                    </div>
                  </div>
                  <Button onClick={resetPassword} className="w-full" disabled={loading}>
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>) : 'Reset Password'}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;
