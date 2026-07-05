import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Zap, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const { isAdminAuthenticated, loading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAdminAuthenticated) {
      navigate('/coordinator-admin/dashboard');
    }
  }, [isAdminAuthenticated, authLoading, navigate]);

  const sendOtp = async () => {
    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isSignup: false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email for the verification code' });
      setStep('otp');
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      const { error: signInError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });
      if (signInError) throw signInError;

      toast({ title: 'Welcome, Admin!', description: 'Access granted' });
      navigate('/coordinator-admin/dashboard');
    } catch (error: unknown) {
      toast({ title: 'Access Denied', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2"><span className="gradient-text">Admin Access</span></h1>
            <p className="text-muted-foreground">
              {step === 'email' ? 'Enter your admin email to continue' : 'Enter the verification code'}
            </p>
          </div>

          <div className="glass-card p-8 rounded-xl">
            {step === 'email' ? (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter admin email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                    />
                  </div>
                </div>
                <Button onClick={sendOtp} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending OTP...</> : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <Button variant="ghost" size="sm" onClick={() => { setStep('email'); setOtp(''); }} className="-ml-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Code sent to</p>
                  <p className="font-medium">{email}</p>
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
                <Button onClick={verifyOtp} className="w-full bg-primary hover:bg-primary/90" disabled={loading || otp.length !== 6}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : 'Verify & Login'}
                </Button>
                <div className="text-center">
                  <button onClick={sendOtp} disabled={loading} className="text-sm text-primary hover:underline disabled:opacity-50">
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
