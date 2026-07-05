import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_pm_id: string | null;
  service_request_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface PM { id: string; name: string; }

import { adminApi } from '@/lib/adminApi';

const TaskManager = ({ projectManagers }: { projectManagers: PM[] }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assigned_pm_id: '', priority: 'medium', due_date: '' });
  const { toast } = useToast();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const data = await adminApi('select', 'admin_tasks', { filters: { order: { column: 'created_at', ascending: false } } });
      setTasks(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      await adminApi('insert', 'admin_tasks', {
        data: {
          title: form.title,
          description: form.description || null,
          assigned_pm_id: form.assigned_pm_id || null,
          priority: form.priority,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        },
      });
      toast({ title: 'Task created' });
      setDialog(false);
      setForm({ title: '', description: '', assigned_pm_id: '', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi('update', 'admin_tasks', { data: { status, completed_at: status === 'done' ? new Date().toISOString() : null }, id });
      toast({ title: 'Task updated' }); fetchTasks();
    } catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete task?')) return;
    try { await adminApi('delete', 'admin_tasks', { id }); toast({ title: 'Task deleted' }); fetchTasks(); }
    catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const getPMName = (id: string | null) => id ? projectManagers.find(p => p.id === id)?.name || 'Unknown' : 'Unassigned';

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const todo = tasks.filter(t => t.status === 'todo');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{todo.length}</p><p className="text-[10px] text-muted-foreground">To Do</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-blue-400">{inProgress.length}</p><p className="text-[10px] text-muted-foreground">In Progress</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{done.length}</p><p className="text-[10px] text-muted-foreground">Done</p></CardContent></Card>
        </div>
        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Task</Button></DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Assign PM</Label>
                <Select value={form.assigned_pm_id} onValueChange={v => setForm({ ...form, assigned_pm_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select PM" /></SelectTrigger>
                  <SelectContent>
                    {projectManagers.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-12 text-center"><p className="text-muted-foreground">No tasks yet</p></CardContent></Card>
      ) : tasks.map(task => (
        <Card key={task.id} className={`glass-card transition ${task.status === 'done' ? 'opacity-60' : ''} ${task.priority === 'high' ? 'border-destructive/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`font-semibold text-sm ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                  <Badge variant="outline" className={`text-[10px] ${task.status === 'done' ? 'text-emerald-400' : task.status === 'in_progress' ? 'text-blue-400' : 'text-amber-400'}`}>
                    {task.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${task.priority === 'high' ? 'text-destructive border-destructive/30' : ''}`}>
                    {task.priority === 'high' && <AlertTriangle className="w-3 h-3 mr-0.5" />}{task.priority}
                  </Badge>
                </div>
                {task.description && <p className="text-xs text-muted-foreground mb-1">{task.description}</p>}
                <p className="text-xs text-muted-foreground">PM: {getPMName(task.assigned_pm_id)} {task.due_date && `• Due: ${new Date(task.due_date).toLocaleDateString('en-IN')}`}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {task.status === 'todo' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs text-blue-400" onClick={() => updateStatus(task.id, 'in_progress')}>
                    <Clock className="w-3 h-3 mr-1" />Start
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-400" onClick={() => updateStatus(task.id, 'done')}>
                    <CheckCircle className="w-3 h-3 mr-1" />Done
                  </Button>
                )}
                {task.status === 'done' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(task.id, 'todo')}>Reopen</Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTask(task.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskManager;
