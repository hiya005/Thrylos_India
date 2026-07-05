import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Zap, Crown, Check, X, Loader2, ArrowLeft, Shield, Rocket, Star, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { load } from '@cashfreepayments/cashfree-js';

const VerificationPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const plans = [
    {
      id: 'basic',
      name: t('plan_basic'),
      price: 99,
      period: t('per_year'),
      icon: BadgeCheck,
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      btnClass: 'bg-blue-500 hover:bg-blue-600',
      tickType: 'basic' as const,
      features: [
        { text: 'Blue Verified Badge ✓', included: true },
        { text: t('feature_profile_highlight'), included: true },
        { text: 'Search Priority Boost', included: true },
        { text: t('feature_priority_support'), included: false },
        { text: t('feature_fast_delivery'), included: false },
        { text: t('feature_dedicated_pm'), included: false },
        { text: t('feature_priority_queue'), included: false },
      ],
    },
    {
      id: 'pro',
      name: t('plan_pro'),
      price: 299,
      period: t('per_year'),
      icon: Crown,
      color: 'from-emerald-500/20 to-green-500/20',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      btnClass: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600',
      tickType: 'pro' as const,
      popular: true,
      features: [
        { text: 'Green Verified Badge ✓', included: true },
        { text: t('feature_profile_highlight'), included: true },
        { text: 'Search Priority Boost', included: true },
        { text: t('feature_priority_support'), included: true },
        { text: t('feature_fast_delivery'), included: true },
        { text: t('feature_dedicated_pm'), included: true },
        { text: t('feature_priority_queue'), included: true },
      ],
    },
  ];

  const handleBuyPlan = async (planId: string, amount: number) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setBuyingPlan(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Check existing subscription
      const { data: existing } = await supabase
        .from('verification_subscriptions')
        .select('id, status, plan_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing && existing.status === 'active') {
        toast({ title: t('already_subscribed'), description: t('already_subscribed_desc') });
        setBuyingPlan(null);
        return;
      }

      // Create or update subscription record (standalone - no service_request needed)
      let subId: string;
      if (existing) {
        const { data: updated, error } = await supabase
          .from('verification_subscriptions')
          .update({ plan_type: planId, amount, status: 'pending' })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        subId = updated.id;
      } else {
        const { data: created, error } = await supabase
          .from('verification_subscriptions')
          .insert({ user_id: user.id, plan_type: planId, amount, status: 'pending' })
          .select()
          .single();
        if (error) throw error;
        subId = created.id;
      }

      // Call dedicated verification order edge function (no payment_requests needed)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cashfree-verification-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ subscription_id: subId, amount, plan_type: planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      const cashfree = await load({ mode: 'production' });
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err: any) {
      console.error('Plan purchase error:', err);
      toast({ title: t('error'), description: err.message || 'Payment failed', variant: 'destructive' });
    }
    setBuyingPlan(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <Button variant="ghost" size="sm" className="mb-6" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />{t('go_back')}
            </Button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
                <BadgeCheck className="w-4 h-4" />
                {t('get_verified')}
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold mb-4">
                {t('choose_your')} <span className="gradient-text">{t('plan')}</span>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                {t('plans_subtitle')}
              </p>
            </motion.div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={`relative glass-card rounded-2xl p-6 sm:p-8 border ${plan.borderColor} hover:border-opacity-60 transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold">
                      {t('most_popular')}
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-5`}>
                    <plan.icon className={`w-7 h-7 ${plan.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl sm:text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        {f.included ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={f.included ? 'text-foreground' : 'text-muted-foreground/50'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${plan.btnClass} text-white`}
                    size="lg"
                    onClick={() => handleBuyPlan(plan.id, plan.price)}
                    disabled={buyingPlan === plan.id}
                  >
                    {buyingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {buyingPlan === plan.id ? t('processing') : t('subscribe_now')}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Benefits */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
                {t('why_get_verified')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Shield, title: t('trust_credibility'), desc: t('trust_desc') },
                  { icon: Rocket, title: t('feature_fast_delivery'), desc: t('fast_delivery_plan_desc') },
                  { icon: Star, title: t('stand_out'), desc: t('stand_out_desc') },
                  { icon: Headphones, title: t('feature_priority_support'), desc: t('priority_support_desc') },
                ].map((b, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 text-center hover:border-primary/30 transition">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold mb-1">{b.title}</h4>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default VerificationPlans;
