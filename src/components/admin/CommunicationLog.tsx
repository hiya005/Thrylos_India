import { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Send, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CommLog {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  type: string;
  subject: string | null;
  message: string;
  direction: string;
  service_request_id: string | null;
  created_at: string;
}

import { adminApi } from '@/lib/adminApi';

const CommunicationLog = () => {
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ user_name: '', user_email: '', type: 'email', subject: '', message: '', direction: 'outbound' });
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const data = await adminApi('select', 'communication_logs', { filters: { order: { column: 'created_at', ascending: false } } });
      setLogs(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      await adminApi('insert', 'communication_logs', {
        data: {
          user_id: '00000000-0000-0000-0000-000000000000',
          user_name: form.user_name,
          user_email: form.user_email,
          type: form.type,
          subject: form.subject || null,
          message: form.message,
          direction: form.direction,
        },
      });
      toast({ title: 'Log added' });
      setDialog(false);
      setForm({ user_name: '', user_email: '', type: 'email', subject: '', message: '', direction: 'outbound' });
      fetchLogs();
    } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex gap-4">
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{logs.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-blue-400">{logs.filter(l => l.direction === 'outbound').length}</p><p className="text-[10px] text-muted-foreground">Sent</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{logs.filter(l => l.direction === 'inbound').length}</p><p className="text-[10px] text-muted-foreground">Received</p></CardContent></Card>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild><Button size="sm"><Send className="w-4 h-4 mr-2" />Log Entry</Button></DialogTrigger>
            <DialogContent className="glass-card border-border">
              <DialogHeader><DialogTitle>Add Communication Log</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Client Name</Label><Input value={form.user_name} onChange={e => setForm({ ...form, user_name: e.target.value })} /></div>
                <div><Label>Client Email</Label><Input value={form.user_email} onChange={e => setForm({ ...form, user_email: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Direction</Label>
                    <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outbound">Outbound</SelectItem>
                        <SelectItem value="inbound">Inbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                <div><Label>Message *</Label><Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
                <Button onClick={handleSave} className="w-full">Save Log</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-12 text-center"><MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No communication logs</p></CardContent></Card>
      ) : filtered.map(log => (
        <Card key={log.id} className="glass-card transition duration-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.direction === 'outbound' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                {log.direction === 'outbound' ? <ArrowUpRight className="w-4 h-4 text-blue-400" /> : <ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium text-sm">{log.user_name || 'Unknown'}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {log.type === 'email' ? <Mail className="w-3 h-3 mr-0.5" /> : log.type === 'phone' ? <Phone className="w-3 h-3 mr-0.5" /> : <MessageSquare className="w-3 h-3 mr-0.5" />}
                    {log.type}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${log.direction === 'outbound' ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {log.direction}
                  </Badge>
                </div>
                {log.subject && <p className="text-sm font-medium">{log.subject}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{log.message}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{new Date(log.created_at).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CommunicationLog;
