import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setSending(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name,
      email: form.email,
      message: form.message,
      subject: 'Live Chat Message',
    });
    if (error) {
      toast({ title: 'Failed to send', variant: 'destructive' });
    } else {
      setStep('sent');
    }
    setSending(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[320px] sm:w-[360px] glass-card rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="bg-primary p-4 flex items-center justify-between">
              <div>
                <p className="text-primary-foreground font-semibold text-sm">THRYLOS Support</p>
                <p className="text-primary-foreground/70 text-xs">We typically reply within hours</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {step === 'form' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">👋 Hi there! Send us a message and we'll get back to you.</p>
                  <Input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="text-sm" />
                  <Input placeholder="Your email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="text-sm" />
                  <textarea
                    placeholder="How can we help?"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <Button onClick={handleSend} disabled={sending} className="w-full" size="sm">
                    <Send className="w-4 h-4 mr-2" />{sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Message sent!</p>
                  <p className="text-xs text-muted-foreground mb-4">We'll get back to you at {form.email}</p>
                  <Button variant="outline" size="sm" onClick={() => { setStep('form'); setForm({ name: '', email: '', message: '' }); }}>
                    Send another
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-primary/30 hover:shadow-xl transition-shadow"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

export default ChatWidget;
