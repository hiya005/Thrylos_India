import { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  FileText, Mail, Users, LogOut, Flame, CheckCircle,
  Plus, Edit, AlertTriangle, Trash2, Eye, X, Loader2, MessageSquare, Upload,
  Clock, Phone, UserCheck, UserX, IndianRupee, CreditCard, Download,
  TrendingUp, BarChart3, Activity, Wallet, Search, Filter,
  RefreshCw, Calendar, Star, Globe, Image as ImageIcon, Shield, Ban,
  BadgeCheck, MessageCircle, Newspaper, ListTodo, PhoneCall, Megaphone, GraduationCap
} from 'lucide-react';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import BlogManager from '@/components/admin/BlogManager';
import TaskManager from '@/components/admin/TaskManager';
import CommunicationLog from '@/components/admin/CommunicationLog';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import MilestoneManager from '@/components/admin/MilestoneManager';
import RevenueAnalytics from '@/components/admin/RevenueAnalytics';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { generateInvoicePNG, generateInvoicePDF } from '@/utils/generateInvoice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/adminApi';
import CouponManager from '@/components/admin/CouponManager';
import AdminGlobalSearch from '@/components/admin/AdminGlobalSearch';
import { toCSV, downloadCSV } from '@/lib/csvExport';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Service { id: string; title: string; description: string; icon: string; features: string[]; price_range: string; is_active: boolean; order_index: number; }
interface ServiceRequest { id: string; title: string; description: string; status: string; priority: string; admin_response: string | null; created_at: string; user_id: string; user_name?: string; user_email?: string; service_type?: string; color_theme?: string; budget_range?: string; timeline?: string; company_name?: string; contact_email?: string; contact_phone?: string; assigned_pm_id?: string | null; pm_assigned_at?: string | null; show_on_profile?: boolean; profile_showcase_requested?: boolean; project_url?: string | null; }
interface PortfolioItem { id: string; title: string; description: string; image_url: string; project_url: string; technologies: string[]; category: string; is_featured: boolean; }
interface ContactMessage { id: string; name: string; email: string; phone: string; subject: string; message: string; is_read: boolean; is_replied: boolean; created_at: string; }
interface TeamMember { id: string; name: string; role: string; bio: string; image_url: string; order_index: number; is_active: boolean; }
interface Profile { user_id: string; full_name: string | null; email: string | null; phone: string | null; company: string | null; avatar_url: string | null; is_verified: boolean; is_banned: boolean; verification_type?: string | null; }
interface ProjectManager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  is_available: boolean;
  photo_url?: string | null;
  bio?: string | null;
  education?: string | null;
  portfolio_projects?: string[] | null;
}
interface Review { id: string; user_id: string; reviewer_name: string; reviewer_avatar_url: string | null; reviewer_role: string | null; review_text: string; rating: number; is_approved: boolean; created_at: string; is_featured?: boolean; review_images?: string[]; }
const navItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'requests', label: 'Requests', icon: FileText },
  { id: 'showcase', label: 'Showcase', icon: Globe },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'verifications', label: 'Verifications', icon: BadgeCheck },
  { id: 'reviews', label: 'Reviews', icon: MessageCircle },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'comms', label: 'Comms', icon: PhoneCall },
  { id: 'announcements', label: 'Announce', icon: Megaphone },
  { id: 'project-managers', label: 'PMs', icon: UserCheck },
  { id: 'blog', label: 'Blog', icon: Newspaper },
  { id: 'coupons', label: 'Coupons', icon: CreditCard },
  { id: 'services', label: 'Services', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', icon: Globe },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'activity-log', label: 'Activity', icon: Clock },
];

const AdminDashboard = () => {
  const { isAdminAuthenticated, adminLogout, loading: authLoading } = useAdminAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [pmFilter, setPmFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [prioritySort, setPrioritySort] = useState<'recent' | 'priority_desc' | 'priority_asc'>('recent');
  const [requestSort, setRequestSort] = useState('newest');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('in_progress');
  const [bulkPmId, setBulkPmId] = useState('');
  const [bulkWorking, setBulkWorking] = useState(false);

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verificationSubs, setVerificationSubs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Dialog states
  const [serviceDialog, setServiceDialog] = useState(false);
  const [portfolioDialog, setPortfolioDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [pmDialog, setPmDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamMember | null>(null);
  const [editingPM, setEditingPM] = useState<ProjectManager | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [editRequestDialog, setEditRequestDialog] = useState(false);
  const [confirmEditRequestSaveDialog, setConfirmEditRequestSaveDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [editRequestForm, setEditRequestForm] = useState({ title: '', description: '', priority: '', budget_range: '', timeline: '', company_name: '', contact_email: '', contact_phone: '', service_type: '', color_theme: '', project_url: '' });
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<ServiceRequest | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', upi_id: '', payment_note: '' });
  const [sendingPayment, setSendingPayment] = useState(false);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState<any>(null);

  const [uploading, setUploading] = useState(false);
  const portfolioImageRef = useRef<HTMLInputElement>(null);
  const teamImageRef = useRef<HTMLInputElement>(null);
  const serviceIconRef = useRef<HTMLInputElement>(null);
  const pmImageRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [serviceForm, setServiceForm] = useState({ title: '', description: '', icon: 'Code', features: '', price_range: '', is_active: true, order_index: 0 });
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', image_url: '', project_url: '', technologies: '', category: '', is_featured: false });
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', image_url: '', order_index: 0, is_active: true });
  const [pmForm, setPmForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    is_available: true,
    photo_url: '',
    bio: '',
    education: '',
    portfolio_projects: '',
  });

  useEffect(() => { if (isAdminAuthenticated) fetchAllData(); }, [isAdminAuthenticated]);

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await adminApi('select', 'service_request_audits', { filters: { order: { column: 'created_at', ascending: false } } });
      setAuditLogs(data || []);
    } catch (e) { console.error(e); }
    setAuditLoading(false);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchServices(), fetchRequests(), fetchPortfolio(), fetchMessages(), fetchTeamMembers(), fetchProjectManagers(), fetchPayments(), fetchUsers(), fetchReviews(), fetchVerificationSubs(), fetchAuditLogs()]);
    } catch (error) { console.error('Error:', error); toast({ title: 'Error loading data', variant: 'destructive' }); }
    setLoading(false);
  };

  const fetchUsers = async () => { const data = await adminApi('select', 'profiles', { filters: { order: { column: 'created_at', ascending: false } } }); setUsers(data || []); };
  const fetchReviews = async () => { const data = await adminApi('select', 'reviews', { filters: { order: { column: 'created_at', ascending: false } } }); setReviews(data || []); };
  const fetchVerificationSubs = async () => {
    try {
      const data = await adminApi('select', 'verification_subscriptions', { filters: { order: { column: 'created_at', ascending: false } } });
      const profiles = await adminApi('select', 'profiles', { data: { select: 'user_id, full_name, email' } });
      const profileMap = new Map(profiles?.map((p: Profile) => [p.user_id, p]) || []);
      const enriched = (data || []).map((s: any) => ({
        ...s,
        user_name: (profileMap.get(s.user_id) as Profile | undefined)?.full_name || 'Unknown',
        user_email: (profileMap.get(s.user_id) as Profile | undefined)?.email || '',
      }));
      setVerificationSubs(enriched);
    } catch (error) { console.error('Error fetching verifications:', error); }
  };
  const fetchProjectManagers = async () => { const data = await adminApi('select', 'project_managers', { filters: { order: { column: 'name', ascending: true } } }); setProjectManagers(data || []); };
  const fetchServices = async () => { const data = await adminApi('select', 'services', { filters: { order: { column: 'order_index', ascending: true } } }); setServices(data.map((s: Service) => ({ ...s, features: s.features || [], order_index: s.order_index ?? 0 }))); };
  const fetchPortfolio = async () => { const data = await adminApi('select', 'portfolio_items', { filters: { order: { column: 'order_index', ascending: true } } }); setPortfolio(data.map((p: PortfolioItem) => ({ ...p, technologies: p.technologies || [] }))); };
  const fetchMessages = async () => { const data = await adminApi('select', 'contact_messages', { filters: { order: { column: 'created_at', ascending: false } } }); setMessages(data); };
  const fetchTeamMembers = async () => { const data = await adminApi('select', 'team_members', { filters: { order: { column: 'order_index', ascending: true } } }); setTeamMembers(data); };

  const fetchPayments = async () => {
    try {
      const data = await adminApi('select', 'payment_requests', { filters: { order: { column: 'created_at', ascending: false } } });
      const profiles = await adminApi('select', 'profiles', { data: { select: 'user_id, full_name, email' } });
      const profileMap = new Map(profiles?.map((p: Profile) => [p.user_id, p]) || []);
      const requestMap = new Map(requests.map((r: ServiceRequest) => [r.id, r]));
      const enrichedPayments = (data || []).map((p: any) => ({
        ...p,
        user_name: (profileMap.get(p.user_id) as Profile | undefined)?.full_name || 'Unknown',
        user_email: (profileMap.get(p.user_id) as Profile | undefined)?.email || '',
        request_title: (requestMap.get(p.service_request_id) as ServiceRequest | undefined)?.title || 'Unknown',
        company_name: (requestMap.get(p.service_request_id) as ServiceRequest | undefined)?.company_name || null,
        contact_phone: (requestMap.get(p.service_request_id) as ServiceRequest | undefined)?.contact_phone || null,
      }));
      setPayments(enrichedPayments);
    } catch (error) { console.error('Error fetching payments:', error); }
  };

  const fetchRequests = async () => {
    const data = await adminApi('select', 'service_requests', { filters: { order: { column: 'created_at', ascending: false } } });
    const profiles = await adminApi('select', 'profiles', { data: { select: 'user_id, full_name, email' } });
    const profileMap = new Map(profiles?.map((p: Profile) => [p.user_id, p]) || []);
    setRequests(data.map((req: ServiceRequest) => ({ ...req, user_name: (profileMap.get(req.user_id) as Profile | undefined)?.full_name || 'Unknown', user_email: (profileMap.get(req.user_id) as Profile | undefined)?.email || req.user_id })));
  };

  const assignPM = async (requestId: string, pmId: string) => {
    try {
      await adminApi('update', 'service_requests', { data: { assigned_pm_id: pmId, pm_assigned_at: new Date().toISOString() }, id: requestId });
      const pm = projectManagers.find(p => p.id === pmId);
      const request = requests.find(r => r.id === requestId);
      if (pm && request) {
        try { await fetch(`${SUPABASE_URL}/functions/v1/notify-pm-assignment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managerName: pm.name, managerEmail: pm.email, clientName: request.user_name || 'N/A', projectName: request.title, phone: request.contact_phone || 'N/A' }) }); } catch (e) { console.error(e); }
      }
      toast({ title: 'PM assigned & notified' }); fetchRequests(); fetchProjectManagers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const unassignPM = async (requestId: string, pmId: string) => {
    try {
      await adminApi('update', 'service_requests', { data: { assigned_pm_id: null, pm_assigned_at: null }, id: requestId });
      const otherAssignments = requests.filter(r => r.assigned_pm_id === pmId && r.id !== requestId);
      if (otherAssignments.length === 0) { await adminApi('update', 'project_managers', { data: { is_available: true }, id: pmId }); }
      toast({ title: 'PM unassigned' }); fetchRequests(); fetchProjectManagers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      await adminApi('update', 'service_requests', { data: { status }, id });
      if (status === 'completed' || status === 'cancelled') {
        const request = requests.find(r => r.id === id);
        if (request?.assigned_pm_id) {
          const otherActive = requests.filter(r => r.assigned_pm_id === request.assigned_pm_id && r.id !== id && r.status !== 'completed' && r.status !== 'cancelled');
          if (otherActive.length === 0) { await adminApi('update', 'project_managers', { data: { is_available: true }, id: request.assigned_pm_id }); }
        }
      }
      toast({ title: 'Status updated' }); fetchRequests(); fetchProjectManagers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const toggleRequestSelection = (id: string) => setSelectedRequestIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllRequests = () => setSelectedRequestIds(prev => prev.length === filteredRequests.length ? [] : filteredRequests.map(r => r.id));
  const runBulkRequestAction = async (mode: 'status' | 'pm' | 'delete') => {
    if (!selectedRequestIds.length) return;
    if (mode === 'delete' && !confirm(`Delete ${selectedRequestIds.length} selected request(s)?`)) return;
    setBulkWorking(true);
    try {
      await Promise.all(selectedRequestIds.map(id => mode === 'delete'
        ? adminApi('delete', 'service_requests', { id })
        : adminApi('update', 'service_requests', { id, data: mode === 'pm' ? { assigned_pm_id: bulkPmId || null, pm_assigned_at: bulkPmId ? new Date().toISOString() : null } : { status: bulkStatus } })
      ));
      toast({ title: 'Bulk action completed', description: `${selectedRequestIds.length} request(s) updated.` });
      setSelectedRequestIds([]);
      fetchRequests(); fetchProjectManagers();
    } catch (error) { toast({ title: 'Bulk action failed', description: (error as Error).message, variant: 'destructive' }); }
    setBulkWorking(false);
  };

  const openResponseDialog = (request: ServiceRequest) => { setSelectedRequest(request); setAdminResponseText(request.admin_response || ''); setResponseDialog(true); };
  const sendAdminResponse = async () => { if (!selectedRequest) return; try { await adminApi('update', 'service_requests', { data: { admin_response: adminResponseText }, id: selectedRequest.id }); toast({ title: 'Response sent' }); setResponseDialog(false); fetchRequests(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const openPaymentDialog = (request: ServiceRequest) => { setPaymentRequest(request); setPaymentForm({ amount: '', upi_id: '', payment_note: '' }); setPaymentDialog(true); };
  const openEditRequestDialog = (request: ServiceRequest) => {
    setEditingRequest(request);
    setEditRequestForm({
      title: request.title || '', description: request.description || '', priority: request.priority || 'medium',
      budget_range: request.budget_range || '', timeline: request.timeline || '', company_name: request.company_name || '',
      contact_email: request.contact_email || '', contact_phone: request.contact_phone || '',
      service_type: request.service_type || '', color_theme: request.color_theme || '', project_url: request.project_url || '',
    });
    setEditRequestDialog(true);
  };
  const saveEditRequest = async () => {
    if (!editingRequest) return;
    try {
      const changedFields: Record<string, { from: unknown; to: unknown }> = {};
      const fieldKeys = ['title', 'description', 'priority', 'budget_range', 'timeline', 'company_name', 'contact_email', 'contact_phone', 'service_type', 'color_theme', 'project_url'] as const;
      fieldKeys.forEach(key => {
        const oldVal = (editingRequest as any)[key] || '';
        const newVal = (editRequestForm as any)[key] || '';
        if (oldVal !== newVal) changedFields[key] = { from: oldVal, to: newVal };
      });

      await adminApi('update', 'service_requests', {
        data: {
          title: editRequestForm.title, description: editRequestForm.description, priority: editRequestForm.priority,
          budget_range: editRequestForm.budget_range || null, timeline: editRequestForm.timeline || null,
          company_name: editRequestForm.company_name || null, contact_email: editRequestForm.contact_email || null,
          contact_phone: editRequestForm.contact_phone || null, service_type: editRequestForm.service_type || null,
          color_theme: editRequestForm.color_theme || null, project_url: editRequestForm.project_url || null,
        }, id: editingRequest.id,
      });

      // Write audit log
      if (Object.keys(changedFields).length > 0) {
        try {
          await adminApi('insert', 'service_request_audits', {
            data: {
              service_request_id: editingRequest.id,
              editor_user_id: (await supabase.auth.getUser()).data.user?.id,
              editor_role: 'admin',
              changed_fields: changedFields,
            },
          });
        } catch (e) { console.error('Audit log error:', e); }
      }

      // Send email notification to user about the edit
      if (Object.keys(changedFields).length > 0 && editingRequest.contact_email) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'service_request_edited',
              data: {
                user_email: editingRequest.contact_email,
                user_name: editingRequest.user_name || editingRequest.company_name || '',
                project_title: editingRequest.title,
                changed_fields: changedFields,
              },
            }),
          });
        } catch (e) { console.error('Edit notification error:', e); }
      }

      // Insert in-app notification for the user
      if (Object.keys(changedFields).length > 0) {
        try {
          await adminApi('insert', 'notifications', {
            data: {
              user_id: editingRequest.user_id,
              type: 'request_edited',
              title: 'Service Request Updated',
              message: `Your project "${editingRequest.title}" was updated by admin. Changed: ${Object.keys(changedFields).join(', ')}`,
              related_entity_id: editingRequest.id,
            },
          });
        } catch (e) { console.error('In-app notification error:', e); }
      }

      toast({ title: 'Request updated' }); setEditRequestDialog(false); setConfirmEditRequestSaveDialog(false); fetchRequests(); fetchAuditLogs();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const sendPaymentRequest = async () => {
    if (!paymentRequest || !paymentForm.amount) return;
    setSendingPayment(true);
    try {
      await adminApi('insert', 'payment_requests', {
        data: {
          service_request_id: paymentRequest.id,
          user_id: paymentRequest.user_id,
          amount: parseFloat(paymentForm.amount),
          upi_id: paymentForm.upi_id || null,
          payment_note: paymentForm.payment_note || null,
        },
      });
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_request',
            data: {
              user_email: paymentRequest.contact_email || paymentRequest.user_email,
              user_name: paymentRequest.user_name,
              amount: paymentForm.amount,
              project_title: paymentRequest.title,
              upi_id: paymentForm.upi_id,
              payment_note: paymentForm.payment_note,
            },
          }),
        });
      } catch (e) { console.error('Notification error:', e); }
      toast({ title: 'Payment request sent!' });
      setPaymentDialog(false);
      fetchPayments();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
    setSendingPayment(false);
  };

  const verifyUser = async (userId: string, email: string | null, name: string | null, tickType: 'blue' | 'green' = 'blue') => {
    try {
      const profiles = await adminApi('select', 'profiles', { filters: { eq: { user_id: userId } } });
      if (profiles?.[0]) {
        await adminApi('update', 'profiles', { data: { is_verified: true, verification_type: tickType === 'green' ? 'pro' : 'basic' }, id: profiles[0].id });
      }
      if (email) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'user_verified', data: { user_email: email, user_name: name } }),
          });
        } catch (e) { console.error(e); }
      }
      toast({ title: `User verified with ${tickType === 'green' ? 'Green ✅' : 'Blue 🔵'} tick` }); fetchUsers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const unverifyUser = async (userId: string) => {
    try {
      const profiles = await adminApi('select', 'profiles', { filters: { eq: { user_id: userId } } });
      if (profiles?.[0]) {
        await adminApi('update', 'profiles', { data: { is_verified: false, verification_type: null }, id: profiles[0].id });
      }
      toast({ title: 'Verification removed' }); fetchUsers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const toggleBanUser = async (userId: string, currentlyBanned: boolean) => {
    try {
      const profiles = await adminApi('select', 'profiles', { filters: { eq: { user_id: userId } } });
      if (profiles?.[0]) {
        await adminApi('update', 'profiles', { data: { is_banned: !currentlyBanned }, id: profiles[0].id });
      }
      toast({ title: currentlyBanned ? 'User unbanned' : 'User banned 🚫' }); fetchUsers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try { await adminApi('delete', 'reviews', { id }); toast({ title: 'Review deleted' }); fetchReviews(); }
    catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const toggleReviewApproval = async (id: string, currentlyApproved: boolean) => {
    try { await adminApi('update', 'reviews', { data: { is_approved: !currentlyApproved }, id }); toast({ title: currentlyApproved ? 'Review hidden' : 'Review approved' }); fetchReviews(); }
    catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      await adminApi('update', 'payment_requests', { data: { status: 'paid', paid_at: new Date().toISOString(), payment_method: 'manual' }, id: paymentId });
      toast({ title: 'Payment marked as paid ✅' }); fetchPayments();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const markVerificationPaid = async (subId: string, userId: string, planType: string) => {
    try {
      await adminApi('update', 'verification_subscriptions', { data: { status: 'active', started_at: new Date().toISOString(), expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, id: subId });
      // Also verify the user profile
      const profiles = await adminApi('select', 'profiles', { filters: { eq: { user_id: userId } } });
      if (profiles?.[0]) {
        await adminApi('update', 'profiles', { data: { is_verified: true, verification_type: planType === 'pro' ? 'pro' : 'basic' }, id: profiles[0].id });
      }
      toast({ title: 'Verification activated ✅' }); fetchVerificationSubs(); fetchUsers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };

  const handleSaveService = async () => { try { const features = serviceForm.features.split(',').map(f => f.trim()).filter(Boolean); const payload = { ...serviceForm, features }; if (editingService) { await adminApi('update', 'services', { data: payload, id: editingService.id }); toast({ title: 'Service updated' }); } else { await adminApi('insert', 'services', { data: payload }); toast({ title: 'Service created' }); } setServiceDialog(false); setEditingService(null); setServiceForm({ title: '', description: '', icon: 'Code', features: '', price_range: '', is_active: true, order_index: 0 }); fetchServices(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const handleDeleteService = async (id: string) => { if (!confirm('Delete this service?')) return; try { await adminApi('delete', 'services', { id }); toast({ title: 'Service deleted' }); fetchServices(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const editService = (service: Service) => { setEditingService(service); setServiceForm({ title: service.title, description: service.description || '', icon: service.icon || 'Code', features: service.features.join(', '), price_range: service.price_range || '', is_active: service.is_active, order_index: service.order_index ?? 0 }); setServiceDialog(true); };

  const handleSavePortfolio = async () => { try { const technologies = portfolioForm.technologies.split(',').map(t => t.trim()).filter(Boolean); const payload = { ...portfolioForm, technologies }; if (editingPortfolio) { await adminApi('update', 'portfolio_items', { data: payload, id: editingPortfolio.id }); toast({ title: 'Portfolio item updated' }); } else { await adminApi('insert', 'portfolio_items', { data: payload }); toast({ title: 'Portfolio item created' }); } setPortfolioDialog(false); setEditingPortfolio(null); setPortfolioForm({ title: '', description: '', image_url: '', project_url: '', technologies: '', category: '', is_featured: false }); fetchPortfolio(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const handleDeletePortfolio = async (id: string) => { if (!confirm('Delete this portfolio item?')) return; try { await adminApi('delete', 'portfolio_items', { id }); toast({ title: 'Portfolio item deleted' }); fetchPortfolio(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const editPortfolioItem = (item: PortfolioItem) => { setEditingPortfolio(item); setPortfolioForm({ title: item.title, description: item.description || '', image_url: item.image_url || '', project_url: item.project_url || '', technologies: item.technologies.join(', '), category: item.category || '', is_featured: item.is_featured }); setPortfolioDialog(true); };

  const handleSaveTeam = async () => { try { const payload = { ...teamForm }; if (editingTeam) { await adminApi('update', 'team_members', { data: payload, id: editingTeam.id }); toast({ title: 'Team member updated' }); } else { await adminApi('insert', 'team_members', { data: payload }); toast({ title: 'Team member added' }); } setTeamDialog(false); setEditingTeam(null); setTeamForm({ name: '', role: '', bio: '', image_url: '', order_index: 0, is_active: true }); fetchTeamMembers(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const handleDeleteTeam = async (id: string) => { if (!confirm('Delete this team member?')) return; try { await adminApi('delete', 'team_members', { id }); toast({ title: 'Team member deleted' }); fetchTeamMembers(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const editTeamMember = (member: TeamMember) => { setEditingTeam(member); setTeamForm({ name: member.name, role: member.role, bio: member.bio || '', image_url: member.image_url || '', order_index: member.order_index, is_active: member.is_active }); setTeamDialog(true); };

  const handleSavePM = async () => {
    try {
      const payload = {
        ...pmForm,
        portfolio_projects: pmForm.portfolio_projects ? pmForm.portfolio_projects.split('\n').map(p => p.trim()).filter(Boolean) : [],
      };
      if (editingPM) {
        await adminApi('update', 'project_managers', { data: payload, id: editingPM.id });
        toast({ title: 'PM updated' });
      } else {
        await adminApi('insert', 'project_managers', { data: payload });
        toast({ title: 'PM added' });
      }
      setPmDialog(false); setEditingPM(null);
      setPmForm({ name: '', email: '', phone: '', specialization: '', is_available: true, photo_url: '', bio: '', education: '', portfolio_projects: '' });
      fetchProjectManagers();
    } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); }
  };
  const handleDeletePM = async (id: string) => { if (!confirm('Delete PM?')) return; try { await adminApi('delete', 'project_managers', { id }); toast({ title: 'PM deleted' }); fetchProjectManagers(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };

  const handlePMImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fileName = `pm/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
    setPmForm(prev => ({ ...prev, photo_url: publicUrl }));
    setUploading(false);
  };

  const markMessageAsRead = async (id: string) => { try { await adminApi('update', 'contact_messages', { data: { is_read: true }, id }); toast({ title: 'Marked as read' }); fetchMessages(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };
  const deleteMessage = async (id: string) => { if (!confirm('Delete message?')) return; try { await adminApi('delete', 'contact_messages', { id }); toast({ title: 'Message deleted' }); fetchMessages(); } catch (error) { toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' }); } };

  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const fileName = `portfolio/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: true }); if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); setUploading(false); return; } const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName); setPortfolioForm(prev => ({ ...prev, image_url: publicUrl })); setUploading(false); };
  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const fileName = `team/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: true }); if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); setUploading(false); return; } const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName); setTeamForm(prev => ({ ...prev, image_url: publicUrl })); setUploading(false); };
  const handleServiceIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); const fileName = `services/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: true }); if (error) { toast({ title: 'Upload failed', variant: 'destructive' }); setUploading(false); return; } const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName); setServiceForm(prev => ({ ...prev, icon: publicUrl })); setUploading(false); };

  const formatBudget = (b: string) => { const num = parseFloat(b); return isNaN(num) ? b : `₹${num.toLocaleString('en-IN')}`; };
  const getAssignedPM = (pmId: string | null | undefined) => pmId ? projectManagers.find(p => p.id === pmId) : undefined;

  const handleDownloadPNG = async () => { if (invoiceRef.current) { try { await generateInvoicePNG(invoiceRef.current, `invoice-${invoicePayment?.id?.substring(0, 8)}`); } catch (error) { toast({ title: 'Error generating PNG', variant: 'destructive' }); } } };
  const handleDownloadPDF = async () => { if (invoiceRef.current) { try { await generateInvoicePDF(invoiceRef.current, `invoice-${invoicePayment?.id?.substring(0, 8)}`); } catch (error) { toast({ title: 'Error generating PDF', variant: 'destructive' }); } } };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdminAuthenticated) return <Navigate to="/coordinator-admin" replace />;

  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    inProgressRequests: requests.filter(r => r.status === 'in_progress').length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    activeServices: services.filter(s => s.is_active).length,
    unreadMessages: messages.filter(m => !m.is_read).length,
    teamCount: teamMembers.filter(t => t.is_active).length,
    availablePMs: projectManagers.filter(pm => pm.is_available).length,
    totalPMs: projectManagers.length,
    portfolioCount: portfolio.length,
    totalRevenue: payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0),
    pendingRevenue: payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.amount), 0),
    totalPayments: payments.length,
    paidPayments: payments.filter((p: any) => p.status === 'paid').length,
    totalUsers: users.length,
    verifiedUsers: users.filter(u => u.is_verified).length,
    bannedUsers: users.filter(u => u.is_banned).length,
    totalReviews: reviews.length,
    approvedReviews: reviews.filter(r => r.is_approved).length,
    showcaseRequests: requests.filter(r => r.profile_showcase_requested && !r.show_on_profile).length,
    showcasedProjects: requests.filter(r => r.show_on_profile).length,
  };

  const filteredRequests = (() => {
    const list = requests.filter(r => {
      const isVerification = r.title?.toLowerCase().includes('verification') && (r.title?.toLowerCase().includes('plan') || r.title?.toLowerCase().includes('pro plan') || r.title?.toLowerCase().includes('basic plan'));
      if (isVerification) return false;
      const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || (r.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.id || '').toLowerCase().startsWith(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesService = serviceFilter === 'all' || (r.service_type || 'unspecified') === serviceFilter;
      const matchesPm = pmFilter === 'all' || (pmFilter === 'unassigned' ? !r.assigned_pm_id : r.assigned_pm_id === pmFilter);
      const matchesPriority = priorityFilter === 'all' || (r.priority || 'medium') === priorityFilter;
      const created = new Date(r.created_at).getTime();
      const matchesFrom = !dateFromFilter || created >= new Date(dateFromFilter).getTime();
      const matchesTo = !dateToFilter || created <= new Date(dateToFilter).getTime() + 86_399_999;
      return matchesSearch && matchesStatus && matchesService && matchesPm && matchesPriority && matchesFrom && matchesTo;
    });
    if (prioritySort === 'recent') return list;
    const rank: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return [...list].sort((a, b) => {
      const ra = rank[a.priority || 'medium'] || 2;
      const rb = rank[b.priority || 'medium'] || 2;
      return prioritySort === 'priority_desc' ? rb - ra : ra - rb;
    });
  })();


  const requestServiceOptions = Array.from(new Set(requests.map(r => r.service_type || 'unspecified'))).sort();

  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch = !searchQuery || p.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.request_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paidPayments = payments.filter((p: any) => p.status === 'paid');
  const activeVerifiedSubs = verificationSubs.filter((s: any) => ['active', 'paid', 'verified'].includes(String(s.status || '').toLowerCase()));
  const currentMrr = activeVerifiedSubs.reduce((sum: number, sub: any) => sum + Number(sub.amount || sub.price || (sub.plan_type === 'pro' ? 299 : 99) || 0), 0);
  const premiumConversion = users.length ? Math.round((users.filter(u => u.is_verified).length / users.length) * 100) : 0;
  const churnedSubs = verificationSubs.filter((s: any) => ['cancelled', 'expired'].includes(String(s.status || '').toLowerCase()) || (s.expires_at && new Date(s.expires_at).getTime() < Date.now())).length;
  const churnRate = verificationSubs.length ? Math.round((churnedSubs / verificationSubs.length) * 100) : 0;
  const topServices = Object.entries(requests.reduce((acc: Record<string, number>, r) => { const key = r.service_type || 'Unspecified'; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const activePMs = projectManagers.filter(pm => requests.some(r => r.assigned_pm_id === pm.id && !['completed', 'cancelled'].includes(r.status)));
  const analyticsExportRows = [
    { metric: 'Platform MRR', value: currentMrr },
    { metric: 'Premium conversion %', value: premiumConversion },
    { metric: 'Subscription churn %', value: churnRate },
    { metric: 'Active project managers', value: activePMs.length },
    { metric: 'Paid revenue', value: paidPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) },
    ...topServices.map(([name, count]) => ({ metric: `Top service: ${String(name).replace(/_/g, ' ')}`, value: count })),
  ];

  const getInvoiceData = (payment: any) => ({
    invoiceNo: `INV-${payment.id.substring(0, 8).toUpperCase()}`,
    date: new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    customerName: payment.user_name || 'N/A',
    customerEmail: payment.user_email || 'N/A',
    customerPhone: payment.contact_phone || undefined,
    companyName: payment.company_name || undefined,
    projectTitle: payment.request_title || 'N/A',
    amount: Number(payment.amount),
    status: payment.status,
    transactionId: payment.transaction_id || payment.cashfree_payment_id || undefined,
    paymentMethod: payment.payment_method || undefined,
    paidAt: payment.paid_at ? new Date(payment.paid_at).toLocaleString('en-IN') : undefined,
    paymentNote: payment.payment_note || undefined,
    upiId: payment.upi_id || undefined,
  });

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Projects', value: stats.totalRequests, icon: FileText, color: 'text-primary' },
                { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Pending', value: `₹${stats.pendingRevenue.toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-400' },
              ].map((s, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-4">
                    <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Recent Requests</CardTitle></CardHeader>
                <CardContent>
                  {requests.slice(0, 5).map(req => (
                    <div key={req.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground">{req.user_name}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize ml-2">{req.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
                <CardContent>
                  {payments.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.user_name}</p>
                        <p className="text-xs text-muted-foreground">{p.request_title}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                        <Badge variant="outline" className={`text-[10px] ${p.status === 'paid' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.totalUsers}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{stats.verifiedUsers}</p><p className="text-[10px] text-muted-foreground">Verified</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-destructive">{stats.bannedUsers}</p><p className="text-[10px] text-muted-foreground">Banned</p></CardContent></Card>
            </div>
            {filteredUsers.length === 0 ? (
              <Card className="glass-card"><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No users found</p></CardContent></Card>
            ) : filteredUsers.map(user => (
              <Card key={user.user_id} className={`glass-card transition hover:border-primary/30 ${user.is_banned ? 'border-destructive/30 opacity-60' : user.is_verified ? 'border-emerald-500/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {(user.full_name || 'U').charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm">{user.full_name || 'No Name'}</p>
                          {user.is_verified && <BadgeCheck className={`w-4 h-4 ${user.verification_type === 'pro' ? 'text-emerald-400' : 'text-blue-400'}`} />}
                          {user.is_banned && <Ban className="w-4 h-4 text-destructive" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {user.is_verified ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => unverifyUser(user.user_id)}>
                          <X className="w-3 h-3 mr-1" />Unverify
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-blue-400 border-blue-400/30 hover:bg-blue-400/10" onClick={() => verifyUser(user.user_id, user.email, user.full_name, 'blue')}>
                            <BadgeCheck className="w-3 h-3 mr-1" />Blue ₹99
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10" onClick={() => verifyUser(user.user_id, user.email, user.full_name, 'green')}>
                            <BadgeCheck className="w-3 h-3 mr-1" />Green ₹299
                          </Button>
                        </div>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleBanUser(user.user_id, user.is_banned)}>
                        {user.is_banned ? <><Shield className="w-3 h-3 mr-1" />Unban</> : <><Ban className="w-3 h-3 mr-1" />Ban</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.totalReviews}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{stats.approvedReviews}</p><p className="text-[10px] text-muted-foreground">Approved</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{reviews.filter(r => r.is_featured).length}</p><p className="text-[10px] text-muted-foreground">Featured</p></CardContent></Card>
            </div>
            {reviews.length === 0 ? (
              <Card className="glass-card"><CardContent className="py-12 text-center"><MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No reviews yet</p></CardContent></Card>
            ) : reviews.map(review => (
              <Card key={review.id} className={`glass-card transition ${!review.is_approved ? 'opacity-60' : ''} ${review.is_featured ? 'border-primary/40' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {review.reviewer_avatar_url ? (
                        <img src={review.reviewer_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {review.reviewer_name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm">{review.reviewer_name}</p>
                          {review.reviewer_role && <span className="text-xs text-muted-foreground">• {review.reviewer_role}</span>}
                          {review.is_featured && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">⭐ Featured</Badge>}
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.review_text}</p>
                        {review.review_images && review.review_images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.review_images.map((img, i) => (
                              <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-border/50" />
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" className={`h-7 text-xs ${review.is_featured ? 'border-primary/50 text-primary' : ''}`}
                        onClick={async () => {
                          try {
                            await adminApi('update', 'reviews', { data: { is_featured: !review.is_featured }, id: review.id });
                            toast({ title: review.is_featured ? 'Removed from featured' : 'Added to featured ⭐' });
                            fetchReviews();
                          } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
                        }}>
                        <Star className="w-3 h-3 mr-1" />{review.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleReviewApproval(review.id, review.is_approved)}>
                        {review.is_approved ? <><Eye className="w-3 h-3 mr-1" />Hide</> : <><CheckCircle className="w-3 h-3 mr-1" />Approve</>}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteReview(review.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'requests':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search title, user, or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  {requestServiceOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={pmFilter} onValueChange={setPmFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="PM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All PMs</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectManagers.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={dateFromFilter} onChange={e => setDateFromFilter(e.target.value)} className="h-9 text-xs" placeholder="From" />
              <Input type="date" value={dateToFilter} onChange={e => setDateToFilter(e.target.value)} className="h-9 text-xs" placeholder="To" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">🔥 High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioritySort} onValueChange={(v) => setPrioritySort(v as 'recent' | 'priority_desc' | 'priority_asc')}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="priority_desc">Priority: High → Low</SelectItem>
                  <SelectItem value="priority_asc">Priority: Low → High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(serviceFilter !== 'all' || pmFilter !== 'all' || dateFromFilter || dateToFilter || statusFilter !== 'all' || searchQuery || priorityFilter !== 'all' || prioritySort !== 'recent') && (
              <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setServiceFilter('all'); setPmFilter('all'); setDateFromFilter(''); setDateToFilter(''); setPriorityFilter('all'); setPrioritySort('recent'); }} className="text-xs text-primary hover:underline">Clear all filters</button>
            )}
            <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button onClick={toggleAllRequests} className="text-xs text-primary hover:underline">
                  {selectedRequestIds.length === filteredRequests.length && filteredRequests.length ? 'Clear selection' : 'Select all visible'}
                </button>
                <p className="text-xs text-muted-foreground">{selectedRequestIds.length} selected • {filteredRequests.length} request(s)</p>
              </div>
              {selectedRequestIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 text-xs" disabled={bulkWorking} onClick={() => runBulkRequestAction('status')}>Update status</Button>
                  <Select value={bulkPmId} onValueChange={setBulkPmId}>
                    <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Assign PM" /></SelectTrigger>
                    <SelectContent>{projectManagers.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 text-xs" disabled={bulkWorking || !bulkPmId} onClick={() => runBulkRequestAction('pm')}>Assign PM</Button>
                  <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={bulkWorking} onClick={() => runBulkRequestAction('delete')}>Delete selected</Button>
                </div>
              )}
            </div>
            {filteredRequests.map(req => {
              const assignedPM = getAssignedPM(req.assigned_pm_id);
              return (
                <Card key={req.id} className="glass-card hover:border-primary/30 transition">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={selectedRequestIds.includes(req.id)} onChange={() => toggleRequestSelection(req.id)} className="mt-1 h-4 w-4 accent-primary" aria-label={`Select ${req.title}`} />
                          <h3 className="text-lg font-semibold">{req.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="capitalize bg-muted/40 border">{req.status.replace(/_/g, ' ')}</Badge>
                          <Badge className="capitalize bg-muted/40 border">
                            {req.priority === 'high' && <Flame className="w-3 h-3 mr-1 text-orange-500" />}
                            {req.priority} priority
                          </Badge>
                          {req.budget_range && <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">{formatBudget(req.budget_range)}</Badge>}
                        </div>
                        {assignedPM && (
                          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-2 flex items-center justify-between">
                            <span className="text-sm"><UserCheck className="w-3.5 h-3.5 inline mr-1" />{assignedPM.name}</span>
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={() => unassignPM(req.id, assignedPM.id)}>
                              <X className="w-3 h-3 mr-1" />Remove
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(req.created_at).toLocaleDateString()}</div>
                        {req.user_name && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{req.user_name}</div>}
                        {req.contact_email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{req.contact_email}</div>}
                        {req.contact_phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{req.contact_phone}</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      <Select onValueChange={v => updateRequestStatus(req.id, v)} value={req.status}>
                        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {!assignedPM && (
                        <Select onValueChange={v => assignPM(req.id, v)}>
                          <SelectTrigger className="h-8 w-[140px] text-xs"><UserCheck className="w-3 h-3 mr-1" /><SelectValue placeholder="Assign PM" /></SelectTrigger>
                          <SelectContent>
                            {projectManagers.filter(pm => pm.is_available).map(pm => (
                              <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEditRequestDialog(req)}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openResponseDialog(req)}>
                        <MessageSquare className="w-3 h-3 mr-1" />Respond
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openPaymentDialog(req)}>
                        <IndianRupee className="w-3 h-3 mr-1" />Payment
                      </Button>
                    </div>
                    {/* Milestone Manager */}
                    <div className="pt-3 border-t border-border/50">
                      <MilestoneManager requestId={req.id} requestTitle={req.title} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      case 'showcase':
        {
          const showcaseRequests = requests.filter(r => r.profile_showcase_requested || r.show_on_profile);
          const pendingShowcase = showcaseRequests.filter(r => r.profile_showcase_requested && !r.show_on_profile);
          const approvedShowcase = showcaseRequests.filter(r => r.show_on_profile);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{showcaseRequests.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
                <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{pendingShowcase.length}</p><p className="text-[10px] text-muted-foreground">Pending</p></CardContent></Card>
                <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{approvedShowcase.length}</p><p className="text-[10px] text-muted-foreground">Approved</p></CardContent></Card>
              </div>
              {showcaseRequests.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center"><Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No showcase requests yet</p></CardContent></Card>
              ) : showcaseRequests.map(req => (
                <Card key={req.id} className={`glass-card transition ${req.show_on_profile ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{req.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${req.show_on_profile ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                            {req.show_on_profile ? 'Approved' : 'Pending'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{req.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{req.user_name} • {req.user_email}</p>
                        {req.project_url && <p className="text-xs text-primary mt-0.5 truncate">URL: {req.project_url}</p>}
                        {!req.project_url && <p className="text-xs text-destructive mt-0.5">⚠ No project URL set</p>}
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <Input
                          placeholder="Project URL"
                          defaultValue={req.project_url || ''}
                          className="h-7 text-xs w-[180px]"
                          onBlur={async (e) => {
                            const url = e.target.value.trim();
                            if (url !== (req.project_url || '')) {
                              try {
                                await adminApi('update', 'service_requests', { data: { project_url: url || null }, id: req.id });
                                toast({ title: 'Project URL updated' }); fetchRequests();
                              } catch (err) { toast({ title: 'Error', variant: 'destructive' }); }
                            }
                          }}
                        />
                        {!req.show_on_profile && (
                          <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={async () => {
                            if (!req.project_url) {
                              toast({ title: 'Set project URL first', description: 'A valid project URL is required before approving showcase.', variant: 'destructive' });
                              return;
                            }
                            try {
                              await adminApi('update', 'service_requests', { data: { show_on_profile: true, profile_showcase_requested: true }, id: req.id });
                              toast({ title: 'Project approved for showcase ✅' }); fetchRequests();
                            } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
                          }}>
                            <CheckCircle className="w-3 h-3 mr-1" />Approve
                          </Button>
                        )}
                        {req.show_on_profile && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={async () => {
                            try {
                              await adminApi('update', 'service_requests', { data: { show_on_profile: false, profile_showcase_requested: false }, id: req.id });
                              toast({ title: 'Removed from showcase' }); fetchRequests();
                            } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
                          }}>
                            <X className="w-3 h-3 mr-1" />Remove
                          </Button>
                        )}
                        {!req.show_on_profile && req.profile_showcase_requested && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={async () => {
                            try {
                              await adminApi('update', 'service_requests', { data: { profile_showcase_requested: false }, id: req.id });
                              toast({ title: 'Showcase request rejected' }); fetchRequests();
                            } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
                          }}>
                            <X className="w-3 h-3 mr-1" />Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }

      case 'payments':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.totalPayments}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{stats.paidPayments}</p><p className="text-[10px] text-muted-foreground">Paid</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">₹{stats.totalRevenue.toLocaleString('en-IN')}</p><p className="text-[10px] text-muted-foreground">Collected</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">₹{stats.pendingRevenue.toLocaleString('en-IN')}</p><p className="text-[10px] text-muted-foreground">Pending</p></CardContent></Card>
            </div>
            {filteredPayments.map((payment: any) => (
              <Card key={payment.id} className="glass-card hover:border-primary/30 transition">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{payment.user_name}</p>
                        <Badge variant="outline" className={`text-[10px] ${payment.status === 'paid' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>{payment.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{payment.request_title}</p>
                      {payment.upi_id && <p className="text-xs text-muted-foreground mt-0.5">UPI: {payment.upi_id}</p>}
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-lg font-bold">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                      {payment.status !== 'paid' && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => markPaymentAsPaid(payment.id)}>
                          <CheckCircle className="w-3 h-3 mr-1" />Mark Paid
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setInvoicePayment(payment); setInvoiceDialog(true); }}>
                        <Download className="w-3 h-3 mr-1" />Invoice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'verifications':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{verificationSubs.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{verificationSubs.filter((s: any) => s.status === 'active').length}</p><p className="text-[10px] text-muted-foreground">Active</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{verificationSubs.filter((s: any) => s.status === 'pending').length}</p><p className="text-[10px] text-muted-foreground">Pending</p></CardContent></Card>
            </div>
            {verificationSubs.length === 0 ? (
              <Card className="glass-card"><CardContent className="py-12 text-center"><BadgeCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No verification subscriptions</p></CardContent></Card>
            ) : verificationSubs.map((sub: any) => (
              <Card key={sub.id} className={`glass-card transition ${sub.status === 'active' ? 'border-emerald-500/20' : sub.status === 'pending' ? 'border-amber-500/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{sub.user_name}</p>
                        <Badge variant="outline" className={`text-[10px] ${sub.plan_type === 'pro' ? 'text-emerald-400 border-emerald-500/30' : 'text-blue-400 border-blue-500/30'}`}>
                          {sub.plan_type === 'pro' ? 'Pro ₹299' : 'Basic ₹99'}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${sub.status === 'active' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{sub.user_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created: {new Date(sub.created_at).toLocaleDateString('en-IN')}
                        {sub.status === 'active' && sub.expires_at && ` • Expires: ${new Date(sub.expires_at).toLocaleDateString('en-IN')}`}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {sub.status === 'pending' && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => markVerificationPaid(sub.id, sub.user_id, sub.plan_type)}>
                          <CheckCircle className="w-3 h-3 mr-1" />Activate
                        </Button>
                      )}
                      {sub.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={async () => {
                          try {
                            await adminApi('update', 'verification_subscriptions', { data: { status: 'cancelled' }, id: sub.id });
                            toast({ title: 'Subscription cancelled' }); fetchVerificationSubs();
                          } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
                        }}>
                          <X className="w-3 h-3 mr-1" />Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'project-managers':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={pmDialog} onOpenChange={setPmDialog}>
                <DialogTrigger asChild><Button onClick={() => { setEditingPM(null); setPmForm({ name: '', email: '', phone: '', specialization: '', is_available: true, photo_url: '', bio: '', education: '', portfolio_projects: '' }); }}><Plus className="w-4 h-4 mr-2" />Add PM</Button></DialogTrigger>
                <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingPM ? 'Edit PM' : 'Add PM'}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-4">
                      {pmForm.photo_url ? (
                        <img src={pmForm.photo_url} alt="PM" className="w-16 h-16 rounded-full object-cover ring-2 ring-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                          {pmForm.name ? pmForm.name.charAt(0) : '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <input ref={pmImageRef} type="file" accept="image/*" onChange={handlePMImageUpload} className="hidden" />
                        <Button type="button" variant="outline" size="sm" onClick={() => pmImageRef.current?.click()} disabled={uploading}>
                          {uploading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading...</> : <><Upload className="w-3 h-3 mr-1" />Upload Photo</>}
                        </Button>
                        {pmForm.photo_url && <Button variant="ghost" size="sm" className="ml-1" onClick={() => setPmForm(prev => ({ ...prev, photo_url: '' }))}><X className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                    <div><Label>Name *</Label><Input value={pmForm.name} onChange={e => setPmForm({ ...pmForm, name: e.target.value })} /></div>
                    <div><Label>Email *</Label><Input value={pmForm.email} onChange={e => setPmForm({ ...pmForm, email: e.target.value })} /></div>
                    <div><Label>Phone</Label><Input value={pmForm.phone} onChange={e => setPmForm({ ...pmForm, phone: e.target.value })} /></div>
                    <div><Label>Specialization</Label><Input value={pmForm.specialization} onChange={e => setPmForm({ ...pmForm, specialization: e.target.value })} /></div>
                    <div><Label>Education</Label><Input placeholder="e.g. B.Tech Computer Science, IIT Delhi" value={pmForm.education} onChange={e => setPmForm({ ...pmForm, education: e.target.value })} /></div>
                    <div><Label>Bio</Label><Textarea rows={3} placeholder="Short biography..." value={pmForm.bio} onChange={e => setPmForm({ ...pmForm, bio: e.target.value })} /></div>
                    <div><Label>Portfolio Projects (one per line)</Label><Textarea rows={3} placeholder="Project 1&#10;Project 2&#10;Project 3" value={pmForm.portfolio_projects} onChange={e => setPmForm({ ...pmForm, portfolio_projects: e.target.value })} /></div>
                    <div className="flex items-center gap-2"><Switch checked={pmForm.is_available} onCheckedChange={c => setPmForm({ ...pmForm, is_available: c })} /><Label>Available</Label></div>
                    <Button onClick={handleSavePM} className="w-full" disabled={uploading}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectManagers.map(pm => (
                <Card key={pm.id} className={`glass-card hover:border-primary/30 transition ${pm.is_available ? 'border-emerald-500/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {pm.photo_url ? (
                        <img src={pm.photo_url} alt={pm.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-border flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary-foreground">{pm.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{pm.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{pm.email}</p>
                        {pm.specialization && <p className="text-xs text-primary mt-0.5">{pm.specialization}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPM(pm); setPmForm({ name: pm.name, email: pm.email, phone: pm.phone || '', specialization: pm.specialization || '', is_available: pm.is_available, photo_url: pm.photo_url || '', bio: pm.bio || '', education: pm.education || '', portfolio_projects: (pm.portfolio_projects || []).join('\n') }); setPmDialog(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeletePM(pm.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                    {pm.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{pm.bio}</p>}
                    {pm.education && <p className="text-xs text-muted-foreground mb-2"><GraduationCap className="w-3 h-3 inline mr-1" />{pm.education}</p>}
                    {pm.portfolio_projects && pm.portfolio_projects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pm.portfolio_projects.slice(0, 3).map((p, i) => <Badge key={i} variant="outline" className="text-[9px]">{p}</Badge>)}
                        {pm.portfolio_projects.length > 3 && <Badge variant="outline" className="text-[9px]">+{pm.portfolio_projects.length - 3}</Badge>}
                      </div>
                    )}
                    <Badge variant={pm.is_available ? 'default' : 'secondary'} className="text-[10px]">{pm.is_available ? 'Available' : 'Busy'}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
                <DialogTrigger asChild><Button onClick={() => { setEditingService(null); setServiceForm({ title: '', description: '', icon: 'Code', features: '', price_range: '', is_active: true, order_index: services.length }); }}><Plus className="w-4 h-4 mr-2" />Add Service</Button></DialogTrigger>
                <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Title</Label><Input value={serviceForm.title} onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea rows={3} value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} /></div>
                    <div>
                      <Label>Icon Image</Label>
                      <input ref={serviceIconRef} type="file" accept="image/*" onChange={handleServiceIconUpload} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => serviceIconRef.current?.click()} disabled={uploading} className="w-full">
                        {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload Icon</>}
                      </Button>
                      {serviceForm.icon && serviceForm.icon.startsWith('http') && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={serviceForm.icon} alt="Service icon" className="w-12 h-12 rounded-lg object-cover border border-border" />
                          <Button variant="ghost" size="sm" onClick={() => setServiceForm(prev => ({ ...prev, icon: '' }))}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                    <div><Label>Features (comma separated)</Label><Input value={serviceForm.features} onChange={e => setServiceForm({ ...serviceForm, features: e.target.value })} /></div>
                    <div><Label>Price Range</Label><Input value={serviceForm.price_range} onChange={e => setServiceForm({ ...serviceForm, price_range: e.target.value })} /></div>
                    <div className="flex items-center gap-2"><Switch checked={serviceForm.is_active} onCheckedChange={c => setServiceForm({ ...serviceForm, is_active: c })} /><Label>Active</Label></div>
                    <Button onClick={handleSaveService} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-muted-foreground">Drag services to reorder them. Changes are saved automatically.</p>
            <div className="space-y-2">
              {services.map((service, index) => (
                <Card
                  key={service.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', index.toString()); e.currentTarget.classList.add('opacity-50'); }}
                  onDragEnd={(e) => { e.currentTarget.classList.remove('opacity-50'); }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary');
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    if (fromIndex === toIndex) return;
                    const reordered = [...services];
                    const [moved] = reordered.splice(fromIndex, 1);
                    reordered.splice(toIndex, 0, moved);
                    setServices(reordered);
                    // Save new order
                    try {
                      await Promise.all(reordered.map((s, i) => adminApi('update', 'services', { data: { order_index: i }, id: s.id })));
                      toast({ title: 'Order updated' });
                    } catch (err) { toast({ title: 'Error saving order', variant: 'destructive' }); fetchServices(); }
                  }}
                  className="glass-card hover:border-primary/30 transition cursor-grab active:cursor-grabbing"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center text-muted-foreground select-none">
                      <span className="text-xs font-bold">{index + 1}</span>
                      <span className="text-[10px]">⠿</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{service.title}</h3>
                        <Badge variant={service.is_active ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">{service.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                      {service.price_range && <p className="text-xs text-primary mt-0.5">{service.price_range}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editService(service)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteService(service.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'portfolio':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={portfolioDialog} onOpenChange={setPortfolioDialog}>
                <DialogTrigger asChild><Button onClick={() => { setEditingPortfolio(null); setPortfolioForm({ title: '', description: '', image_url: '', project_url: '', technologies: '', category: '', is_featured: false }); }}><Plus className="w-4 h-4 mr-2" />Add Item</Button></DialogTrigger>
                <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingPortfolio ? 'Edit Portfolio' : 'Add Portfolio'}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Title</Label><Input value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} /></div>
                    <div><Label>Description</Label><Textarea rows={3} value={portfolioForm.description} onChange={e => setPortfolioForm({ ...portfolioForm, description: e.target.value })} /></div>
                    <div>
                      <Label>Image</Label>
                      <input ref={portfolioImageRef} type="file" accept="image/*" onChange={handlePortfolioImageUpload} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => portfolioImageRef.current?.click()} disabled={uploading} className="w-full">
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                      {portfolioForm.image_url && <img src={portfolioForm.image_url} alt="" className="w-full h-32 object-cover rounded mt-2" />}
                    </div>
                    <div><Label>Project URL</Label><Input value={portfolioForm.project_url} onChange={e => setPortfolioForm({ ...portfolioForm, project_url: e.target.value })} /></div>
                    <div><Label>Technologies (comma separated)</Label><Input value={portfolioForm.technologies} onChange={e => setPortfolioForm({ ...portfolioForm, technologies: e.target.value })} /></div>
                    <div><Label>Category</Label><Input value={portfolioForm.category} onChange={e => setPortfolioForm({ ...portfolioForm, category: e.target.value })} /></div>
                    <div className="flex items-center gap-2"><Switch checked={portfolioForm.is_featured} onCheckedChange={c => setPortfolioForm({ ...portfolioForm, is_featured: c })} /><Label>Featured</Label></div>
                    <Button onClick={handleSavePortfolio} className="w-full" disabled={uploading}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-muted-foreground">Drag items to reorder. Changes are saved automatically.</p>
            <div className="space-y-2">
              {portfolio.map((item, index) => (
                <Card
                  key={item.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', index.toString()); e.currentTarget.classList.add('opacity-50'); }}
                  onDragEnd={(e) => { e.currentTarget.classList.remove('opacity-50'); }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary');
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    if (fromIndex === toIndex) return;
                    const reordered = [...portfolio];
                    const [moved] = reordered.splice(fromIndex, 1);
                    reordered.splice(toIndex, 0, moved);
                    setPortfolio(reordered);
                    try {
                      await Promise.all(reordered.map((p, i) => adminApi('update', 'portfolio_items', { data: { order_index: i }, id: p.id })));
                      toast({ title: 'Order updated' });
                    } catch (err) { toast({ title: 'Error saving order', variant: 'destructive' }); fetchPortfolio(); }
                  }}
                  className="glass-card hover:border-primary/30 transition cursor-grab active:cursor-grabbing overflow-hidden"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center text-muted-foreground select-none">
                      <span className="text-xs font-bold">{index + 1}</span>
                      <span className="text-[10px]">⠿</span>
                    </div>
                    {item.image_url && <img src={item.image_url} alt={item.title} className="w-16 h-12 object-cover rounded" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                        {item.is_featured && <Badge className="text-[10px]"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editPortfolioItem(item)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeletePortfolio(item.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
                <DialogTrigger asChild><Button onClick={() => { setEditingTeam(null); setTeamForm({ name: '', role: '', bio: '', image_url: '', order_index: teamMembers.length, is_active: true }); }}><Plus className="w-4 h-4 mr-2" />Add Member</Button></DialogTrigger>
                <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingTeam ? 'Edit Member' : 'Add Member'}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Name *</Label><Input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} /></div>
                    <div><Label>Role *</Label><Input value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} /></div>
                    <div><Label>Bio</Label><Textarea rows={3} value={teamForm.bio} onChange={e => setTeamForm({ ...teamForm, bio: e.target.value })} /></div>
                    <div>
                      <Label>Photo</Label>
                      <input ref={teamImageRef} type="file" accept="image/*" onChange={handleTeamImageUpload} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => teamImageRef.current?.click()} disabled={uploading} className="w-full">
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Upload
                      </Button>
                      {teamForm.image_url && <img src={teamForm.image_url} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mt-2" />}
                    </div>
                    <div><Label>Order</Label><Input type="number" value={teamForm.order_index} onChange={e => setTeamForm({ ...teamForm, order_index: parseInt(e.target.value) || 0 })} /></div>
                    <div className="flex items-center gap-2"><Switch checked={teamForm.is_active} onCheckedChange={c => setTeamForm({ ...teamForm, is_active: c })} /><Label>Active</Label></div>
                    <Button onClick={handleSaveTeam} className="w-full" disabled={uploading}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-muted-foreground">Drag members to reorder. Changes are saved automatically.</p>
            <div className="space-y-2">
              {teamMembers.map((member, index) => (
                <Card
                  key={member.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', index.toString()); e.currentTarget.classList.add('opacity-50'); }}
                  onDragEnd={(e) => { e.currentTarget.classList.remove('opacity-50'); }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary'); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary');
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    if (fromIndex === toIndex) return;
                    const reordered = [...teamMembers];
                    const [moved] = reordered.splice(fromIndex, 1);
                    reordered.splice(toIndex, 0, moved);
                    setTeamMembers(reordered);
                    try {
                      await Promise.all(reordered.map((m, i) => adminApi('update', 'team_members', { data: { order_index: i }, id: m.id })));
                      toast({ title: 'Order updated' });
                    } catch (err) { toast({ title: 'Error saving order', variant: 'destructive' }); fetchTeamMembers(); }
                  }}
                  className={`glass-card hover:border-primary/30 transition cursor-grab active:cursor-grabbing ${!member.is_active ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center text-muted-foreground select-none">
                      <span className="text-xs font-bold">{index + 1}</span>
                      <span className="text-[10px]">⠿</span>
                    </div>
                    {member.image_url ? <img src={member.image_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{member.name}</h3>
                      <p className="text-xs text-primary">{member.role}</p>
                    </div>
                    <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-[10px]">{member.is_active ? 'Active' : 'Inactive'}</Badge>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editTeamMember(member)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteTeam(member.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <Card className="glass-card"><CardContent className="py-12 text-center"><Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No messages</p></CardContent></Card>
            ) : messages.map(msg => (
              <Card key={msg.id} className={`glass-card transition ${!msg.is_read ? 'border-primary/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{msg.name}</p>
                        {!msg.is_read && <Badge className="text-[10px]">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.email} {msg.phone && `• ${msg.phone}`}</p>
                      {msg.subject && <p className="text-sm font-medium mt-1">{msg.subject}</p>}
                      <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1">
                      {!msg.is_read && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markMessageAsRead(msg.id)}><Eye className="w-3 h-3 mr-1" />Read</Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMessage(msg.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="glass-card"><CardContent className="p-4"><p className="text-2xl font-bold text-emerald-400">₹{currentMrr.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Platform MRR</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{premiumConversion}%</p><p className="text-xs text-muted-foreground">Premium conversion</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-4"><p className="text-2xl font-bold text-amber-400">{churnRate}%</p><p className="text-xs text-muted-foreground">Subscription churn</p></CardContent></Card>
              <Card className="glass-card"><CardContent className="p-4"><p className="text-2xl font-bold">{activePMs.length}</p><p className="text-xs text-muted-foreground">Active PMs</p></CardContent></Card>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-card"><CardHeader><CardTitle className="text-base">Top Services</CardTitle></CardHeader><CardContent className="space-y-2">{topServices.map(([name, count]) => <div key={name} className="flex items-center justify-between rounded-lg bg-muted/20 p-2 text-sm"><span>{String(name).replace(/_/g, ' ')}</span><Badge variant="outline">{count}</Badge></div>)}</CardContent></Card>
              <Card className="glass-card"><CardHeader><CardTitle className="text-base">Active Project Managers</CardTitle></CardHeader><CardContent className="space-y-2">{activePMs.map(pm => <div key={pm.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-2 text-sm"><span>{pm.name}</span><Badge variant="outline">{requests.filter(r => r.assigned_pm_id === pm.id && !['completed', 'cancelled'].includes(r.status)).length} live</Badge></div>)}</CardContent></Card>
            </div>
            <AnalyticsCharts
              requests={requests}
              projectManagers={projectManagers}
              payments={payments}
              overview={{
                currentMrr,
                premiumConversion,
                churnRate,
                activePmCount: activePMs.length,
                paidRevenue: paidPayments.reduce((s: number, p: any) => s + Number(p.amount), 0),
              }}
            />
          </div>
        );

      case 'activity-log':
        return (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Audit Log — Service Request Edits</h2>
              {auditLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : auditLogs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center"><Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No audit logs yet</p></CardContent></Card>
              ) : auditLogs.map((log: any) => {
                const req = requests.find(r => r.id === log.service_request_id);
                const changedFields = typeof log.changed_fields === 'object' ? log.changed_fields : {};
                return (
                  <Card key={log.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{req?.title || log.service_request_id.substring(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">Edited by {log.editor_role} • {new Date(log.created_at).toLocaleString('en-IN')}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{Object.keys(changedFields).length} field(s)</Badge>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {Object.entries(changedFields).map(([field, vals]: [string, any]) => (
                          <div key={field} className="text-xs bg-muted/30 rounded-lg px-3 py-1.5">
                            <span className="font-medium capitalize">{field.replace(/_/g, ' ')}</span>:
                            <span className="text-destructive line-through ml-2">{vals.from || '(empty)'}</span>
                            <span className="mx-1">→</span>
                            <span className="text-emerald-400">{vals.to || '(empty)'}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <h2 className="text-lg font-semibold mt-8">Recent Activity</h2>
              <div className="space-y-2">
                {requests.slice(0, 8).map(req => (
                  <div key={req.id} className="glass-card rounded-xl p-3 border border-border/40 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${req.status === 'completed' ? 'bg-emerald-400' : req.status === 'in_progress' ? 'bg-blue-400' : req.status === 'cancelled' ? 'bg-destructive' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground">{req.user_name} • {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{req.status.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </div>
            </div>
          );

      case 'revenue':
        return <RevenueAnalytics payments={payments} />;

      case 'tasks':
        return <TaskManager projectManagers={projectManagers} />;

      case 'comms':
        return <CommunicationLog />;

      case 'announcements':
        return <AnnouncementManager />;

      case 'blog':
        return <BlogManager />;

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Stars/particles background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => {
          const size = 1 + Math.random() * 3;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const animDuration = 2 + Math.random() * 4;
          const delay = Math.random() * 3;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/60"
              style={{ width: size, height: size, left: `${left}%`, top: `${top}%` }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: animDuration, delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-[280px] h-screen sticky top-0 p-4 gap-3 border-r border-border/30 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/thrylosindia.png" alt="Logo" className="w-9 h-9 rounded-lg" />
              <span className="text-xl font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Nixmat', sans-serif" }}>ADMIN</span>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              const counts: Record<string, number | string | undefined> = {
                requests: stats.totalRequests, showcase: stats.showcaseRequests, messages: stats.unreadMessages,
                users: stats.totalUsers, payments: stats.totalPayments, reviews: stats.totalReviews,
                verifications: verificationSubs.length, 'project-managers': stats.totalPMs,
                services: stats.activeServices, portfolio: stats.portfolioCount, team: stats.teamCount,
              };
              const countValue = counts[item.id];

              // Color mapping for icons
              const iconColors: Record<string, string> = {
                overview: 'text-blue-400', requests: 'text-orange-400', showcase: 'text-cyan-400',
                payments: 'text-green-400', revenue: 'text-emerald-400', users: 'text-violet-400',
                verifications: 'text-amber-400', reviews: 'text-pink-400', tasks: 'text-yellow-400',
                comms: 'text-teal-400', announcements: 'text-red-400', 'project-managers': 'text-indigo-400',
                blog: 'text-rose-400', services: 'text-sky-400', portfolio: 'text-lime-400',
                team: 'text-purple-400', messages: 'text-blue-300', analytics: 'text-fuchsia-400',
                'activity-log': 'text-slate-400',
              };

              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setSearchQuery(''); setStatusFilter('all'); }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? 'bg-primary/20 text-primary-foreground border-primary/50 shadow-lg shadow-primary/10 backdrop-blur-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60 border-border/30 backdrop-blur-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : iconColors[item.id] || 'text-muted-foreground'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {countValue !== undefined && (
                    <span className={`text-[10px] font-bold min-w-[20px] h-[18px] flex items-center justify-center rounded-full px-1.5 ${
                      isActive ? 'bg-primary/30 text-primary' : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {countValue}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={adminLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/30 px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
          >
            {/* Mobile: Logo + dropdown nav */}
            <div className="flex items-center gap-3 lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <img src="/thrylosindia.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                <span className="text-lg font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Nixmat', sans-serif" }}>ADMIN</span>
              </Link>
            </div>

            {/* Desktop: Section title */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold capitalize">{navItems.find(n => n.id === activeSection)?.label || activeSection}</h1>
            </div>

            <div className="flex items-center gap-2">
              <AdminGlobalSearch
                onSelectRequest={(id) => { setActiveSection('requests'); setSearchQuery(id.slice(0, 8)); }}
                onSelectUser={(id) => { setActiveSection('users'); setSearchQuery(id.slice(0, 8)); }}
                onSelectPayment={(id) => { setActiveSection('payments'); setSearchQuery(id.slice(0, 8)); }}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-border/50 hidden sm:flex"
                onClick={() => {
                  const exportMap: Record<string, unknown[]> = {
                    requests, payments, users, reviews, messages,
                    analytics: analyticsExportRows,
                    'verifications': verificationSubs, 'project-managers': projectManagers,
                  };
                  const data = exportMap[activeSection] || [];
                  if (!data.length) { toast({ title: 'Nothing to export', description: 'Current section has no data.' }); return; }
                  downloadCSV(`thrylos-${activeSection}-${new Date().toISOString().slice(0,10)}.csv`, toCSV(data as Record<string, unknown>[]));
                  toast({ title: 'CSV exported', description: `${data.length} rows downloaded.` });
                }}
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button variant="outline" size="sm" onClick={fetchAllData} className="border-border/50">
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive lg:hidden" onClick={adminLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </motion.header>

          {/* Mobile dropdown nav */}
          <div className="lg:hidden px-4 py-3 border-b border-border/30">
            <Select value={activeSection} onValueChange={(val) => { setActiveSection(val); setSearchQuery(''); setStatusFilter('all'); }}>
              <SelectTrigger className="w-full bg-card/50 backdrop-blur-sm border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {navItems.map((item) => {
                  const counts: Record<string, number | string | undefined> = {
                    requests: stats.totalRequests, showcase: stats.showcaseRequests, messages: stats.unreadMessages,
                    users: stats.totalUsers, payments: stats.totalPayments, reviews: stats.totalReviews,
                    verifications: verificationSubs.length, 'project-managers': stats.totalPMs,
                    services: stats.activeServices, portfolio: stats.portfolioCount, team: stats.teamCount,
                  };
                  const countValue = counts[item.id];
                  return (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}{countValue !== undefined ? ` (${countValue})` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Content area */}
          <div className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.main
                key={activeSection}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
                className="space-y-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : renderContent()}
              </motion.main>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={editRequestDialog} onOpenChange={setEditRequestDialog}>
        <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle>Edit Service Request</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Title</Label><Input value={editRequestForm.title} onChange={e => setEditRequestForm({ ...editRequestForm, title: e.target.value })} /></div>
              <div><Label>Priority</Label>
                <Select value={editRequestForm.priority} onValueChange={v => setEditRequestForm({ ...editRequestForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Budget (₹)</Label><Input type="number" value={editRequestForm.budget_range} onChange={e => setEditRequestForm({ ...editRequestForm, budget_range: e.target.value })} /></div>
              <div><Label>Timeline</Label>
                <Select value={editRequestForm.timeline} onValueChange={v => setEditRequestForm({ ...editRequestForm, timeline: v })}>
                  <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_week">Within 1 Week</SelectItem><SelectItem value="2_weeks">Within 2 Weeks</SelectItem>
                    <SelectItem value="1_month">Within 1 Month</SelectItem><SelectItem value="2_months">Within 2 Months</SelectItem>
                    <SelectItem value="3_months">Within 3 Months</SelectItem><SelectItem value="6_months">Within 6 Months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Service Type</Label><Input value={editRequestForm.service_type} onChange={e => setEditRequestForm({ ...editRequestForm, service_type: e.target.value })} /></div>
              <div><Label>Company Name</Label><Input value={editRequestForm.company_name} onChange={e => setEditRequestForm({ ...editRequestForm, company_name: e.target.value })} /></div>
              <div><Label>Contact Email</Label><Input type="email" value={editRequestForm.contact_email} onChange={e => setEditRequestForm({ ...editRequestForm, contact_email: e.target.value })} /></div>
              <div><Label>Contact Phone</Label><Input type="tel" value={editRequestForm.contact_phone} onChange={e => setEditRequestForm({ ...editRequestForm, contact_phone: e.target.value })} /></div>
              <div><Label>Color Theme</Label><Input value={editRequestForm.color_theme} onChange={e => setEditRequestForm({ ...editRequestForm, color_theme: e.target.value })} /></div>
              <div><Label>Project URL</Label><Input value={editRequestForm.project_url} onChange={e => setEditRequestForm({ ...editRequestForm, project_url: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={4} value={editRequestForm.description} onChange={e => setEditRequestForm({ ...editRequestForm, description: e.target.value })} /></div>
            </div>
            <Button onClick={() => setConfirmEditRequestSaveDialog(true)} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmEditRequestSaveDialog} onOpenChange={setConfirmEditRequestSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to save these changes to the service request? This action will be recorded in the audit log.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveEditRequest}>Confirm & Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Respond to Request</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedRequest && <div className="bg-muted/30 p-3 rounded-lg"><p className="font-medium text-sm">{selectedRequest.title}</p></div>}
            <div><Label>Response</Label><Textarea rows={4} value={adminResponseText} onChange={e => setAdminResponseText(e.target.value)} /></div>
            <Button onClick={sendAdminResponse} className="w-full">Send Response</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="glass-card border-border">
          <DialogHeader><DialogTitle>Send Payment Request</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            {paymentRequest && <div className="bg-muted/30 p-3 rounded-lg"><p className="font-medium text-sm">{paymentRequest.title}</p><p className="text-xs text-muted-foreground">{paymentRequest.user_name}</p></div>}
            <div><Label>Amount (₹) *</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} min="1" /></div>
            <div><Label>UPI ID *</Label><Input value={paymentForm.upi_id} onChange={e => setPaymentForm({ ...paymentForm, upi_id: e.target.value })} /></div>
            <div><Label>Note</Label><Textarea rows={2} value={paymentForm.payment_note} onChange={e => setPaymentForm({ ...paymentForm, payment_note: e.target.value })} /></div>
            <Button onClick={sendPaymentRequest} className="w-full" disabled={sendingPayment || !paymentForm.amount}>
              {sendingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <IndianRupee className="w-4 h-4 mr-2" />}Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
        <DialogContent className="glass-card border-border max-w-[520px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle>Invoice Preview</DialogTitle></DialogHeader>
          <div className="flex justify-center py-4 overflow-x-auto">
            {invoicePayment && <InvoiceTemplate ref={invoiceRef} data={getInvoiceData(invoicePayment)} type={invoicePayment.status === 'paid' ? 'receipt' : 'invoice'} />}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={handleDownloadPNG}><ImageIcon className="w-4 h-4 mr-2" />PNG</Button>
            <Button className="flex-1" onClick={handleDownloadPDF}><Download className="w-4 h-4 mr-2" />PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
