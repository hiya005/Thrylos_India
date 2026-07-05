import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Clock, CheckCircle, AlertCircle, Loader2, FileText, LogOut, IndianRupee, QrCode, CreditCard, Settings, Download, Receipt, Image as ImageIcon, Activity, TrendingUp, Eye, BadgeCheck, Bell, Inbox, MessageSquare, Search, Users, UserPlus, Target, User, Home, Edit, Crown, Zap, Flame, BarChart3 } from 'lucide-react';
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';
import { load } from '@cashfreepayments/cashfree-js';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { generateInvoicePNG, generateInvoicePDF } from '@/utils/generateInvoice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectManager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
}

interface PaymentRequest {
  id: string;
  service_request_id: string;
  amount: number;
  status: string;
  qr_code_url: string | null;
  upi_id: string | null;
  transaction_id: string | null;
  payment_note: string | null;
  created_at: string;
  paid_at: string | null;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  payment_method: string | null;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  service_id: string | null;
  service_type: string | null;
  color_theme: string | null;
  budget_range: string | null;
  timeline: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  assigned_pm_id: string | null;
  pm_assigned_at: string | null;
  project_manager?: ProjectManager | null;
  payments?: PaymentRequest[];
}

interface Profile {
  full_name: string | null;
  email: string | null;
  company: string | null;
  avatar_url: string | null;
  is_verified?: boolean;
  username?: string | null;
  account_id?: string | null;
}

interface Service {
  id: string;
  title: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionIds, setTransactionIds] = useState<Record<string, string>>({});
  const [submittingPayment, setSubmittingPayment] = useState<string | null>(null);
  const [payingWithCashfree, setPayingWithCashfree] = useState<string | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState<{ payment: PaymentRequest; title: string } | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; time: string; is_read: boolean }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'payments'>('projects');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [prioritySort, setPrioritySort] = useState<'recent' | 'priority_desc' | 'priority_asc'>('recent');
  const [milestones, setMilestones] = useState<Record<string, { id: string; title: string; status: string; due_date: string | null }[]>>({});
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: '', budget_range: '', timeline: '', company_name: '', contact_email: '', contact_phone: '', service_type: '', color_theme: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast } = useToast();

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium',
    service_type: '',
    color_theme: '',
    budget_range: '',
    timeline: '',
    company_name: '',
    contact_email: '',
    contact_phone: '',
    coupon_code: '',
  });
  const [couponApplied, setCouponApplied] = useState<{ discount_type: string; discount_value: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!user) return;

    void fetchData();
    void fetchNotifications();

    const requestsUnsub = subscribeToRequests();
    const paymentsUnsub = subscribeToPayments();
    const notificationsUnsub = subscribeToNotifications();

    return () => {
      requestsUnsub?.();
      paymentsUnsub?.();
      notificationsUnsub?.();
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        time: new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        is_read: n.is_read,
      })));
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, (payload: any) => {
        const n = payload.new;
        setNotifications(prev => [{
          id: n.id,
          type: n.type,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          is_read: false,
        }, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications([]);
  };

  // Auto-verify payment when returning from Cashfree
  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');
    if (paymentId && orderId && user) {
      verifyCashfreePayment(paymentId, orderId);
      // Clean up URL params
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, user]);

  const verifyCashfreePayment = async (paymentId: string, orderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cashfree-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ payment_id: paymentId, order_id: orderId }),
      });
      const data = await res.json();
      if (data.status === 'paid') {
        toast({ title: 'Payment Successful! ✅', description: 'Your payment has been verified and recorded.' });
      } else {
        toast({ title: 'Payment Status', description: `Status: ${data.order_status || 'Pending'}. Please check back later.` });
      }
      fetchData();
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  };

  const handleCashfreePay = async (paymentId: string) => {
    setPayingWithCashfree(paymentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cashfree-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ payment_id: paymentId }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Load Cashfree JS and open checkout
      const cashfree = await load({ mode: 'production' });
      
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      };

      await cashfree.checkout(checkoutOptions);
    } catch (error) {
      console.error('Cashfree payment error:', error);
      toast({ 
        title: 'Payment Error', 
        description: error instanceof Error ? error.message : 'Failed to initiate payment', 
        variant: 'destructive' 
      });
    }
    setPayingWithCashfree(null);
  };

  const openReceiptPreview = (payment: PaymentRequest, requestTitle: string) => {
    setInvoicePayment({ payment, title: requestTitle });
    setInvoiceDialog(true);
  };

  const handleDownloadPNG = async () => {
    if (!invoiceRef.current) return;
    await generateInvoicePNG(invoiceRef.current, `thrylos-receipt-${invoicePayment?.payment.id.substring(0, 8)}`);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    await generateInvoicePDF(invoiceRef.current, `thrylos-receipt-${invoicePayment?.payment.id.substring(0, 8)}`);
  };

  const getInvoiceData = () => {
    if (!invoicePayment) return null;
    const { payment, title } = invoicePayment;
    return {
      invoiceNo: `REC-${payment.id.substring(0, 8).toUpperCase()}`,
      date: new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      customerName: profile?.full_name || user?.email || 'N/A',
      customerEmail: profile?.email || user?.email || 'N/A',
      customerPhone: undefined,
      companyName: profile?.company || undefined,
      projectTitle: title,
      amount: Number(payment.amount),
      status: payment.status,
      transactionId: payment.transaction_id || payment.cashfree_payment_id || undefined,
      paymentMethod: payment.payment_method || undefined,
      paidAt: payment.paid_at ? new Date(payment.paid_at).toLocaleString('en-IN') : undefined,
      paymentNote: payment.payment_note || undefined,
    };
  };

  const fetchData = async () => {
    if (!user) return;

    const [requestsRes, profileRes, servicesRes, pmRes, paymentsRes, milestonesRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('full_name, email, company, avatar_url, is_verified, username, account_id')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('services')
        .select('id, title')
        .eq('is_active', true),
      supabase
        .from('project_managers')
        .select('*'),
      supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('project_milestones' as any)
        .select('*')
        .order('due_date', { ascending: true }),
    ]);

    const pmMap = new Map(pmRes.data?.map((pm: ProjectManager) => [pm.id, pm]) || []);
    const paymentsByRequest = new Map<string, PaymentRequest[]>();
    paymentsRes.data?.forEach((p: PaymentRequest) => {
      const arr = paymentsByRequest.get(p.service_request_id) || [];
      arr.push(p);
      paymentsByRequest.set(p.service_request_id, arr);
    });
    
    if (requestsRes.data) {
      const enrichedRequests = requestsRes.data.map((req: ServiceRequest) => ({
        ...req,
        project_manager: req.assigned_pm_id ? pmMap.get(req.assigned_pm_id) : null,
        payments: paymentsByRequest.get(req.id) || [],
      }));
      setRequests(enrichedRequests as ServiceRequest[]);
    }
    if (profileRes.data) setProfile(profileRes.data);
    if (servicesRes.data) setServices(servicesRes.data);

    // Group milestones by request
    const msMap: Record<string, { id: string; title: string; status: string; due_date: string | null }[]> = {};
    (milestonesRes.data || []).forEach((m: any) => {
      if (!msMap[m.service_request_id]) msMap[m.service_request_id] = [];
      msMap[m.service_request_id].push({ id: m.id, title: m.title, status: m.status, due_date: m.due_date });
    });
    setMilestones(msMap);

    setLoading(false);
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('user-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPayments = () => {
    const channel = supabase
      .channel('user-payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload: any) => {
          const p = payload.new;
          setNotifications(prev => [{
            id: p.id,
            type: 'payment',
            message: `New payment request: ₹${Number(p.amount).toLocaleString('en-IN')}`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            is_read: false,
          }, ...prev].slice(0, 20));
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload: any) => {
          const r = payload.new;
          if (r.admin_response) {
            setNotifications(prev => [{
              id: r.id + '-resp',
              type: 'response',
              message: `Admin responded to "${r.title}"`,
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              is_read: false,
            }, ...prev].slice(0, 20));
          }
          fetchData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const submitTransactionId = async (paymentId: string) => {
    const txnId = transactionIds[paymentId];
    if (!txnId?.trim()) return;
    setSubmittingPayment(paymentId);
    const { error } = await supabase
      .from('payment_requests')
      .update({ transaction_id: txnId.trim(), status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to submit transaction', variant: 'destructive' });
    } else {
      toast({ title: 'Payment submitted!', description: 'Transaction ID recorded successfully' });
      fetchData();
    }
    setSubmittingPayment(null);
  };

  const formatBudget = (budget: string | null) => {
    if (!budget) return null;
    const num = parseFloat(budget);
    if (!isNaN(num)) return `₹${num.toLocaleString('en-IN')}`;
    return budget;
  };

  const formatDuration = (hours: number | null) => {
    if (hours === null) return 'Awaiting first response';
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = hours / 24;
    if (days < 7) return `${Math.round(days)}d`;
    return `${(days / 7).toFixed(1)}w`;
  };

  const getInsightTone = (hours: number | null) => {
    if (hours === null) return 'text-muted-foreground';
    if (hours <= 24) return 'text-success';
    if (hours <= 72) return 'text-warning';
    return 'text-destructive';
  };

  const getProjectInsights = (request: ServiceRequest) => {
    const requestMilestones = milestones[request.id] || [];
    const completedMilestones = requestMilestones.filter(m => m.status === 'completed').length;
    const totalMilestones = requestMilestones.length;
    const burnDown = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const firstTouchIso = request.pm_assigned_at || request.admin_response ? request.updated_at : null;
    const firstResponseHours = firstTouchIso
      ? Math.max(0.5, (new Date(firstTouchIso).getTime() - new Date(request.created_at).getTime()) / 3600000)
      : null;

    const timelineEvents = [
      {
        id: 'submitted',
        label: 'Request submitted',
        detail: new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        complete: true,
      },
      {
        id: 'assigned',
        label: request.project_manager ? `PM assigned · ${request.project_manager.name}` : 'PM assignment pending',
        detail: request.pm_assigned_at
          ? new Date(request.pm_assigned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Waiting for coordinator',
        complete: Boolean(request.pm_assigned_at),
      },
      {
        id: 'milestones',
        label: totalMilestones ? `${completedMilestones}/${totalMilestones} milestones delivered` : 'Milestones being prepared',
        detail: totalMilestones ? `${burnDown}% burn-down complete` : 'No milestones published yet',
        complete: completedMilestones > 0,
      },
      {
        id: 'update',
        label: request.admin_response ? 'Latest admin update received' : 'Next update pending',
        detail: request.admin_response ? 'Response posted to this project' : 'We will notify you when there is movement',
        complete: Boolean(request.admin_response),
      },
    ];

    return { firstResponseHours, burnDown, totalMilestones, completedMilestones, timelineEvents };
  };

  const generateUpiQrUrl = (upiId: string, amount: number, note?: string) => {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amount}&cu=INR${note ? `&tn=${encodeURIComponent(note)}` : ''}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
  };

  const openEditDialog = (request: ServiceRequest) => {
    setEditingRequest(request);
    setEditForm({
      title: request.title || '', description: request.description || '', priority: request.priority || 'medium',
      budget_range: request.budget_range || '', timeline: request.timeline || '', company_name: request.company_name || '',
      contact_email: request.contact_email || '', contact_phone: request.contact_phone || '',
      service_type: request.service_type || '', color_theme: request.color_theme || '',
    });
    setEditDialogOpen(true);
  };

  const saveRequestEdit = async () => {
    if (!editingRequest || !user) return;
    setSavingEdit(true);
    const { error } = await supabase.from('service_requests').update({
      title: editForm.title, description: editForm.description, priority: editForm.priority,
      budget_range: editForm.budget_range || null, timeline: editForm.timeline || null,
      company_name: editForm.company_name || null, contact_email: editForm.contact_email || null,
      contact_phone: editForm.contact_phone || null, service_type: editForm.service_type || null,
      color_theme: editForm.color_theme || null,
    }).eq('id', editingRequest.id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    } else {
      toast({ title: 'Request updated successfully' });
      setEditDialogOpen(false);
      fetchData();
    }
    setSavingEdit(false);
  };

  const applyCoupon = async () => {
    if (!newRequest.coupon_code.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        _coupon_code: newRequest.coupon_code.trim().toUpperCase(),
      });

      if (error || !Array.isArray(data) || data.length === 0) {
        toast({ title: 'Invalid coupon code', variant: 'destructive' });
        setCouponApplied(null);
        return;
      }

      const result = data[0] as { valid: boolean; message: string; discount_type: string | null; discount_value: number | null };

      if (!result.valid || !result.discount_type || result.discount_value === null) {
        toast({ title: result.message || 'Coupon is not valid', variant: 'destructive' });
        setCouponApplied(null);
        return;
      }

      setCouponApplied({ discount_type: result.discount_type, discount_value: Number(result.discount_value) });
      toast({ title: `Coupon applied! ${result.discount_type === 'percentage' ? `${result.discount_value}% off` : `₹${result.discount_value} off`}` });
    } catch {
      toast({ title: 'Error applying coupon', variant: 'destructive' });
      setCouponApplied(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('service_requests')
      .insert([{
        user_id: user.id,
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        service_type: newRequest.service_type || null,
        color_theme: newRequest.color_theme || null,
        budget_range: newRequest.budget_range || null,
        timeline: newRequest.timeline || null,
        company_name: newRequest.company_name || null,
        contact_email: newRequest.contact_email || user.email,
        contact_phone: newRequest.contact_phone || null,
        coupon_code: newRequest.coupon_code || null,
        discount_amount: couponApplied && newRequest.budget_range ? (
          couponApplied.discount_type === 'percentage'
            ? (parseFloat(newRequest.budget_range) * couponApplied.discount_value / 100)
            : couponApplied.discount_value
        ) : null,
        status: 'pending',
      }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to create request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Service request created successfully' });
      // Notify admin via email
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'service_request_admin',
            data: {
              title: newRequest.title,
              description: newRequest.description,
              user_name: profile?.full_name || user.email,
              contact_email: newRequest.contact_email || user.email,
              budget_range: newRequest.budget_range,
              timeline: newRequest.timeline,
            },
          },
        });
      } catch (e) { console.error('Notification error:', e); }
      setNewRequest({
        title: '',
        description: '',
        priority: 'medium',
        service_type: '',
        color_theme: '',
        budget_range: '',
        timeline: '',
        company_name: '',
        contact_email: '',
        contact_phone: '',
        coupon_code: '',
      });
      setCouponApplied(null);
      setDialogOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30";
      
    case "in_progress":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse";

    case "completed":
      return "bg-green-500/10 text-green-400 border border-green-500/30";

    case "cancelled":
      return "bg-red-500/20 text-red-400 border border-red-500/40 animate-bounce";

    default:
      return "bg-muted text-muted-foreground";
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }


  const allPayments = requests.flatMap(r => (r.payments || []).map(p => ({ ...p, projectTitle: r.title })));
  const totalPaid = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    totalPaid,
    totalPending,
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/thrylosindia.png" alt="Thrylos logo" className="w-6 h-6 object-contain" />
            <div
              className="text-xl sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Nixmat', sans-serif" }}
            >
              THRYLOS INDIA
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground hidden md:flex items-center gap-2">
              {profile?.avatar_url && (
                <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-border" />
              )}
              Welcome, <span className="text-foreground inline-flex items-center gap-1">{profile?.full_name || user.email}{profile?.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-400" />}</span>
            </div>
            {profile?.is_verified && (
              <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-semibold" title="Priority support enabled — premium members get faster response times">
                <Zap className="w-3 h-3 fill-amber-400" />
                Priority Support
              </div>
            )}
            {/* Notification Bell - desktop only */}
            <div className="relative hidden md:block">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl border border-border/50 shadow-2xl z-50 max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-border/50 flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAllNotifications}>Clear all</Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'payment' ? 'bg-amber-400' : 'bg-primary'}`} />
                          <div>
                            <p className="text-sm">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/user/${profile?.username || profile?.account_id}`)} className="hidden md:flex">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:flex">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground">Manage your service requests and track progress</p>
        </div>

        {/* Stats / Quick Links / Widgets moved to bottom */}
        <div className="grid grid-cols-2 gap-2 mb-6 border-b border-border pb-3">
          <Button
            variant={activeTab === 'projects' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('projects')}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />Projects
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('payments')}
            className="w-full"
          >
            <Receipt className="w-4 h-4 mr-2" />Payment History
          </Button>
        </div>

        {activeTab === 'payments' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payment History</h2>
            {allPayments.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No payments yet</h3>
                  <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              allPayments.map((payment) => (
                <Card key={payment.id} className={`glass-card ${payment.status === 'paid' ? 'border-green-500/20' : 'border-amber-500/20'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{payment.projectTitle}</p>
                        <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                        <Badge variant="outline" className={`text-[10px] ${payment.status === 'paid' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                          {payment.status === 'paid' ? '✓ Paid' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    {payment.payment_note && <p className="text-xs text-muted-foreground mb-2">{payment.payment_note}</p>}
                    {payment.status === 'paid' && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                        <div className="space-y-0.5">
                          {payment.transaction_id && <p className="text-[10px] text-muted-foreground">Txn: <span className="font-mono">{payment.transaction_id}</span></p>}
                          {payment.payment_method && <p className="text-[10px] text-muted-foreground">Via: <span className="capitalize">{payment.payment_method}</span></p>}
                          {payment.paid_at && <p className="text-[10px] text-emerald-400">Paid {new Date(payment.paid_at).toLocaleDateString('en-IN')}</p>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openReceiptPreview(payment, payment.projectTitle)}>
                          <Eye className="w-3.5 h-3.5 mr-1" />Receipt
                        </Button>
                      </div>
                    )}
                    {payment.status === 'pending' && (
                      <Button
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => handleCashfreePay(payment.id)}
                        disabled={payingWithCashfree === payment.id}
                      >
                        {payingWithCashfree === payment.id ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><CreditCard className="w-4 h-4 mr-2" />Pay Now ₹{Number(payment.amount).toLocaleString('en-IN')}</>}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
        <>
        {/* Requests Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as 'all' | 'low' | 'medium' | 'high')}>
              <SelectTrigger className="h-9 w-[160px] text-xs rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all shadow-sm">
                <Flame className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high"><span className="text-orange-400">🔥 High</span></SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioritySort} onValueChange={(v) => setPrioritySort(v as 'recent' | 'priority_desc' | 'priority_asc')}>
              <SelectTrigger className="h-9 w-[180px] text-xs rounded-full border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all shadow-sm">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="priority_desc">High → Low</SelectItem>
                <SelectItem value="priority_asc">Low → High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Service Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Project Title *</Label>
                    <Input
                      placeholder="e.g., E-commerce Website Development"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Service Type *</Label>
                    <Select
                      value={newRequest.service_type}
                      onValueChange={(value) => setNewRequest({ ...newRequest, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.title}>
                            {service.title}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority *</Label>
                    <Select
                      value={newRequest.priority}
                      onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Budget (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Enter budget amount in ₹"
                      value={newRequest.budget_range}
                      onChange={(e) => setNewRequest({ ...newRequest, budget_range: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label>Expected Timeline</Label>
                    <Select
                      value={newRequest.timeline}
                      onValueChange={(value) => setNewRequest({ ...newRequest, timeline: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_week">Within 1 Week</SelectItem>
                        <SelectItem value="2_weeks">Within 2 Weeks</SelectItem>
                        <SelectItem value="1_month">Within 1 Month</SelectItem>
                        <SelectItem value="2_months">Within 2 Months</SelectItem>
                        <SelectItem value="3_months">Within 3 Months</SelectItem>
                        <SelectItem value="6_months">Within 6 Months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Company/Organization Name</Label>
                    <Input
                      placeholder="Your company name"
                      value={newRequest.company_name}
                      onChange={(e) => setNewRequest({ ...newRequest, company_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      value={newRequest.contact_email}
                      onChange={(e) => setNewRequest({ ...newRequest, contact_email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={newRequest.contact_phone}
                      onChange={(e) => setNewRequest({ ...newRequest, contact_phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={newRequest.coupon_code}
                        onChange={(e) => { setNewRequest({ ...newRequest, coupon_code: e.target.value.toUpperCase() }); setCouponApplied(null); }}
                      />
                      <Button type="button" variant="outline" onClick={applyCoupon} disabled={applyingCoupon || !newRequest.coupon_code.trim()}>
                        {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                    {couponApplied && newRequest.budget_range && (
                      <p className="text-xs text-emerald-500 mt-1">
                        Discount: {couponApplied.discount_type === 'percentage'
                          ? `${couponApplied.discount_value}% off = ₹${(parseFloat(newRequest.budget_range) * couponApplied.discount_value / 100).toLocaleString('en-IN')} saved`
                          : `₹${couponApplied.discount_value.toLocaleString('en-IN')} off`
                        }
                      </p>
                    )}
                    {couponApplied && !newRequest.budget_range && (
                      <p className="text-xs text-muted-foreground mt-1">Enter a budget to see discount amount</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Project Description *</Label>
                    <Textarea
                      placeholder="Describe your project requirements in detail..."
                      rows={5}
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No requests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first service request to get started
              </p>
              <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(() => {
              const rank: Record<string, number> = { high: 3, medium: 2, low: 1 };
              const filtered = priorityFilter === 'all' ? requests : requests.filter(r => (r.priority || 'medium') === priorityFilter);
              const sorted = prioritySort === 'recent'
                ? filtered
                : [...filtered].sort((a, b) => {
                    const ra = rank[a.priority || 'medium'] || 2;
                    const rb = rank[b.priority || 'medium'] || 2;
                    return prioritySort === 'priority_desc' ? rb - ra : ra - rb;
                  });
              return sorted;
            })().map((request) => (
             <Card key={request.id} className="glass-card border border-border/40 hover:border-primary/40 transition-all">
  <CardContent className="p-6 space-y-5">

    {/* Top Row */}
    <div className="flex flex-col md:flex-row justify-between gap-4">

      {/* Left */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{request.title}</h3>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getStatusColor(request.status)}>
            {request.status.replace("_", " ")}
          </Badge>

          <Badge variant="secondary" className="capitalize">
            {request.priority}
          </Badge>
        </div>
      </div>

      {/* Right */}
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        Submitted on
        <div className="text-foreground font-medium">
          {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>

    {/* Progress Tracker */}
    <div className="flex items-center gap-0 w-full">
      {['pending', 'in_progress', 'completed'].map((step, idx) => {
        const steps = ['pending', 'in_progress', 'completed'];
        const currentIdx = request.status === 'cancelled' ? -1 : steps.indexOf(request.status);
        const isActive = idx <= currentIdx;
        const isCurrent = steps[idx] === request.status;
        const labels = ['Submitted', 'In Progress', 'Completed'];
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isActive
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground'
              } ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : ''}`}>
                {isActive ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{labels[idx]}</span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-0.5 mx-1 ${idx < currentIdx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
      {request.status === 'cancelled' && (
        <div className="ml-2">
          <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>
        </div>
      )}
    </div>

    {/* Milestones */}
    {milestones[request.id] && milestones[request.id].length > 0 && (
      <div className="bg-muted/20 border border-border/40 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
            <Target className="w-3 h-3" /> Project Milestones
          </p>
          <Badge variant="outline" className="text-[10px]">
            {milestones[request.id].filter(m => m.status === 'completed').length}/{milestones[request.id].length}
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.round((milestones[request.id].filter(m => m.status === 'completed').length / milestones[request.id].length) * 100)}%` }} />
        </div>
        {milestones[request.id].map(m => (
          <div key={m.id} className="flex items-center gap-2 text-xs">
            {m.status === 'completed' ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
            )}
            <span className={m.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
            {m.due_date && (
              <span className="text-muted-foreground ml-auto">{new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Premium Project Insights */}
    {profile?.is_verified && (() => {
      const insights = getProjectInsights(request);
      return (
        <div className="rounded-lg border border-warning/30 bg-card/70 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-warning uppercase font-semibold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Premium Project Insights
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Response speed, milestone burn-down, and delivery activity for verified members.</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">Verified only</Badge>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/40 border border-border/40 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5 text-primary" /> Time to first response</div>
              <p className={`font-bold ${getInsightTone(insights.firstResponseHours)}`}>{formatDuration(insights.firstResponseHours)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{insights.firstResponseHours !== null ? 'Measured from request creation to first team touch.' : 'Waiting for the first admin or PM update.'}</p>
            </div>
            <div className="rounded-lg bg-background/40 border border-border/40 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><BarChart3 className="w-3.5 h-3.5 text-success" /> Milestone burn-down</div>
              <p className="font-bold text-success">{insights.totalMilestones ? `${insights.burnDown}% complete` : 'No milestones yet'}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{insights.totalMilestones ? `${insights.completedMilestones} of ${insights.totalMilestones} milestones delivered.` : 'Coordinator will publish project milestones once work starts.'}</p>
            </div>
            <div className="rounded-lg bg-background/40 border border-border/40 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Activity className="w-3.5 h-3.5 text-warning" /> PM activity timeline</div>
              <p className="font-bold">{request.project_manager ? 'Active delivery' : request.status === 'pending' ? 'Queued for assignment' : 'Under coordinator review'}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{request.project_manager ? `${request.project_manager.name} is currently attached to this project.` : 'A project manager will appear here as soon as one is assigned.'}</p>
            </div>
          </div>

          <div className="space-y-2">
            {insights.timelineEvents.map((event, idx) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-0.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${event.complete ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  {idx < insights.timelineEvents.length - 1 && <div className="mt-1 h-6 w-px bg-border" />}
                </div>
                <div className="min-w-0 pb-1">
                  <p className={`text-xs font-medium ${event.complete ? 'text-foreground' : 'text-muted-foreground'}`}>{event.label}</p>
                  <p className="text-[11px] text-muted-foreground">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })()}

    {/* Description + Edit */}
    <div className="bg-muted/40 border border-border/40 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground uppercase">Description</p>
        {(request.status === 'pending' || request.status === 'in_progress') && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => openEditDialog(request)}>
            <Edit className="w-3 h-3 mr-1" />Edit
          </Button>
        )}
      </div>
      <p className="text-sm leading-relaxed">{request.description}</p>
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-2 text-xs">
      {request.service_type && (
        <span className="px-2 py-1 rounded bg-muted/50 border border-border/40">
          {request.service_type.replace("_", " ")}
        </span>
      )}
      {request.color_theme && (
        <span className="px-2 py-1 rounded bg-muted/50 border border-border/40">
          Theme: {request.color_theme}
        </span>
      )}
      {request.budget_range && (
        <span className="px-2 py-1 rounded bg-muted/50 border border-border/40 flex items-center gap-1">
          Budget: {formatBudget(request.budget_range)}
        </span>
      )}
      {request.timeline && (
        <span className="px-2 py-1 rounded bg-muted/50 border border-border/40">
          Timeline: {request.timeline.replace("_", " ")}
        </span>
      )}
    </div>

    {/* Assigned Project Manager */}
    {request.assigned_pm_id && request.project_manager && (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p className="text-xs text-green-400 uppercase mb-2 font-semibold">Assigned Project Manager</p>
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{request.project_manager.name}</span></p>
          <p><span className="text-muted-foreground">Email:</span> <a href={`mailto:${request.project_manager.email}`} className="text-primary hover:underline">{request.project_manager.email}</a></p>
          {request.project_manager.phone && (
            <p><span className="text-muted-foreground">Phone:</span> <a href={`tel:${request.project_manager.phone}`} className="text-primary hover:underline">{request.project_manager.phone}</a></p>
          )}
          {request.project_manager.specialization && (
            <p><span className="text-muted-foreground">Specialization:</span> {request.project_manager.specialization}</p>
          )}
        </div>
      </div>
    )}

    {/* Admin Response */}
    {request.admin_response && (
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <p className="text-xs text-blue-400 uppercase mb-1">Admin Response</p>
        <p className="text-sm leading-relaxed">{request.admin_response}</p>
      </div>
    )}

    {/* Payment Requests */}
    {request.payments && request.payments.length > 0 && (
      <div className="space-y-3">
        {request.payments.map((payment: PaymentRequest) => (
          <div key={payment.id} className={`border rounded-lg p-4 ${payment.status === 'paid' ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase font-semibold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                Payment {payment.status === 'paid' ? '✓ Paid' : 'Request'}
              </p>
              <span className="text-lg font-bold">₹{Number(payment.amount).toLocaleString('en-IN')}</span>
            </div>
            {payment.payment_note && (
              <p className="text-sm text-muted-foreground mb-2">{payment.payment_note}</p>
            )}
            {payment.status === 'pending' && (
              <div className="space-y-3 mt-3">
                {/* Cashfree Pay Now Button */}
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  onClick={() => handleCashfreePay(payment.id)}
                  disabled={payingWithCashfree === payment.id}
                >
                  {payingWithCashfree === payment.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now ₹{Number(payment.amount).toLocaleString('en-IN')}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Secure payment via Cashfree • UPI, Cards, Net Banking</p>
              </div>
            )}
            {payment.status === 'paid' && (
              <div className="mt-2 space-y-2">
                {payment.transaction_id && (
                  <p className="text-xs text-muted-foreground">Txn ID: <span className="font-mono">{payment.transaction_id}</span></p>
                )}
                {payment.payment_method && (
                  <p className="text-xs text-muted-foreground">Paid via: <span className="capitalize">{payment.payment_method}</span></p>
                )}
                {payment.paid_at && (
                  <p className="text-xs text-green-500">Paid on {new Date(payment.paid_at).toLocaleDateString('en-IN')}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReceiptPreview(payment, request.title)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View Receipt
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
          </CardContent>
        </Card>
            ))}
          </div>
        )}
        </>
        )}

        {/* ===== Bottom: Stats, Quick Links, Premium Widgets ===== */}
        <div className="mt-10 pt-6 border-t border-border/50">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Overview & Insights</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Total Projects', value: stats.total, icon: FileText, color: 'text-blue-400', borderColor: 'border-blue-500/30', bg: 'bg-blue-500/10' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', borderColor: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-400', borderColor: 'border-green-500/30', bg: 'bg-green-500/10' },
              { label: 'In Progress', value: stats.inProgress, icon: IndianRupee, color: 'text-blue-400', borderColor: 'border-blue-500/30', bg: 'bg-blue-500/10' },
              { label: 'Total Paid', value: `₹${stats.totalPaid.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
              { label: 'Pending Dues', value: `₹${stats.totalPending.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-amber-400', borderColor: 'border-amber-500/30', bg: 'bg-amber-500/10' },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border ${s.borderColor} bg-card/50 backdrop-blur-sm p-4 flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-tight">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Link to="/search" className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-center gap-3 hover:bg-blue-500/10 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Search className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-sm font-semibold group-hover:text-blue-400 transition">Find People</p><p className="text-[11px] text-muted-foreground">Search users</p></div>
            </Link>
            <Link to="/contacts" className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-center gap-3 hover:bg-blue-500/10 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><UserPlus className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-sm font-semibold group-hover:text-blue-400 transition">My Contacts</p><p className="text-[11px] text-muted-foreground">Manage contacts</p></div>
            </Link>
            <Link to="/settings" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3 hover:bg-emerald-500/10 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Settings className="w-5 h-5 text-emerald-400" /></div>
              <div><p className="text-sm font-semibold group-hover:text-emerald-400 transition">Settings</p><p className="text-[11px] text-muted-foreground">Profile & security</p></div>
            </Link>
          </div>

          <DashboardWidgets
            userId={user.id}
            isPremium={!!profile?.is_verified}
            onReorder={(req) => {
              setNewRequest({
                title: `${req.title} (re-order)`,
                description: '',
                priority: 'medium',
                service_type: req.service_type || '',
                color_theme: '',
                budget_range: '',
                timeline: '',
                company_name: profile?.company || '',
                contact_email: profile?.email || user.email || '',
                contact_phone: '',
                coupon_code: '',
              });
              setDialogOpen(true);
            }}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-end justify-around py-2 px-2 relative">
          {/* My Profile */}
          <button
            onClick={() => navigate(`/user/${profile?.username || profile?.account_id || ''}`)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>

          {/* Search */}
          <button
            onClick={() => navigate('/search')}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Center Home button - elevated with blue circle */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center -mt-5 relative"
          >
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-primary mt-0.5">Home</span>
          </button>

          {/* Alerts */}
          <button
            onClick={() => navigate('/notifications')}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className="text-[10px] font-medium">Alerts</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {/* Edit Request Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle>Edit Service Request</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Project Title</Label><Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div><Label>Service Type</Label>
                <Select value={editForm.service_type} onValueChange={v => setEditForm({ ...editForm, service_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>)}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={v => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Budget (₹)</Label><Input type="number" value={editForm.budget_range} onChange={e => setEditForm({ ...editForm, budget_range: e.target.value })} min="0" /></div>
              <div><Label>Timeline</Label>
                <Select value={editForm.timeline} onValueChange={v => setEditForm({ ...editForm, timeline: v })}>
                  <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_week">Within 1 Week</SelectItem><SelectItem value="2_weeks">Within 2 Weeks</SelectItem>
                    <SelectItem value="1_month">Within 1 Month</SelectItem><SelectItem value="2_months">Within 2 Months</SelectItem>
                    <SelectItem value="3_months">Within 3 Months</SelectItem><SelectItem value="6_months">Within 6 Months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Company Name</Label><Input value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} /></div>
              <div><Label>Contact Email</Label><Input type="email" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} /></div>
              <div><Label>Contact Phone</Label><Input type="tel" value={editForm.contact_phone} onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })} /></div>
              <div><Label>Color Theme</Label><Input value={editForm.color_theme} onChange={e => setEditForm({ ...editForm, color_theme: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={4} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
            </div>
            <Button onClick={saveRequestEdit} className="w-full" disabled={savingEdit}>
              {savingEdit ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice/Receipt Preview Dialog */}
      <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
        <DialogContent className="glass-card border-border max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader><DialogTitle className="text-sm sm:text-base">Payment Receipt</DialogTitle></DialogHeader>
          <div className="flex justify-center py-2 sm:py-4 overflow-x-auto">
            {invoicePayment && getInvoiceData() && (
              <div className="transform scale-[0.75] sm:scale-100 origin-top">
                <InvoiceTemplate
                  ref={invoiceRef}
                  data={getInvoiceData()!}
                  type={invoicePayment.payment.status === 'paid' ? 'receipt' : 'invoice'}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 text-xs sm:text-sm" variant="outline" onClick={handleDownloadPNG}>
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />PNG
            </Button>
            <Button className="flex-1 text-xs sm:text-sm bg-primary" onClick={handleDownloadPDF}>
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
