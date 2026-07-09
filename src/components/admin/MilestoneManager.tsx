import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, Trash2, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
<div ></div>
interface Milestone {
  id: string;
  service_request_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

import { adminApi } from '@/lib/adminApi';

const MilestoneManager = ({ requestId, requestTitle }: { requestId: string; requestTitle: string }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });
  const { toast } = useToast();

  useEffect(() => { fetchMilestones(); }, [requestId]);

  const fetchMilestones = async () => {
    try {
      const data = await adminApi('select', 'project_milestones', {
        filters: { eq: { service_request_id: requestId }, order: { column: 'due_date', ascending: true } },
      });
      setMilestones(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await adminApi('insert', 'project_milestones', {
        data: {
          service_request_id: requestId,
          title: form.title,
          description: form.description || null,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        },
      });
      toast({ title: 'Milestone added' });
      setDialog(false);
      setForm({ title: '', description: '', due_date: '' });
      fetchMilestones();
    } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await adminApi('update', 'project_milestones', {
        data: { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null },
        id,
      });
      fetchMilestones();
    } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm('Delete milestone?')) return;
    try { await adminApi('delete', 'project_milestones', { id }); fetchMilestones(); }
    catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />;

  const completed = milestones.filter(m => m.status === 'completed').length;
  const total = milestones.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Milestones</span>
          {total > 0 && (
            <Badge variant="outline" className="text-[10px]">{completed}/{total} • {progress}%</Badge>
          )}
        </div>
        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>Add Milestone for "{requestTitle}"</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Design mockup approval" /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={!form.title.trim()}>Add Milestone</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {total > 0 && (
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {milestones.map(m => (
        <div key={m.id} className={`flex items-center gap-2 p-2 rounded-lg border ${m.status === 'completed' ? 'border-green-500/20 bg-green-500/5' : 'border-border/50 bg-muted/20'}`}>
          <button onClick={() => toggleStatus(m.id, m.status)} className="flex-shrink-0">
            {m.status === 'completed' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${m.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{m.title}</p>
            {m.due_date && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                {m.status !== 'completed' && new Date(m.due_date) < new Date() && (
                  <span className="text-destructive font-medium">Overdue</span>
                )}
              </p>
            )}
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => deleteMilestone(m.id)}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      ))}

      {total === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No milestones yet</p>
      )}
    </div>
  );
};

export default MilestoneManager;
