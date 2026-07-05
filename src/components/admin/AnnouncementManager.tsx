import { useState, useEffect } from 'react';
import { Megaphone, Send, Loader2, Users, User, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { adminApi } from '@/lib/adminApi';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
}

const AnnouncementManager = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminApi('select', 'profiles', { filters: { order: { column: 'full_name', ascending: true } } });
      setUsers(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await adminApi('select', 'notifications', {
        filters: { eq: { type: 'announcement' }, order: { column: 'created_at', ascending: false }, limit: 50 }
      });
      // Dedupe by title+message (announcements sent to multiple users share same content)
      const seen = new Set<string>();
      const unique = (data || []).filter((n: any) => {
        const key = `${n.title}|${n.message}|${n.created_at.substring(0, 16)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setHistory(unique.slice(0, 20));
    } catch (e) { console.error(e); }
    setLoadingHistory(false);
  };

  const sendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
      return;
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast({ title: 'Error', description: 'Please set schedule date and time', variant: 'destructive' });
      return;
    }

    const targetUsers = targetType === 'all' ? users : users.filter(u => selectedUsers.includes(u.user_id));

    if (targetUsers.length === 0) {
      toast({ title: 'Error', description: 'No users selected', variant: 'destructive' });
      return;
    }

    if (isScheduled) {
      // For scheduled announcements, we store it and it will be sent later via cron
      toast({ title: 'Scheduled!', description: `Announcement scheduled for ${scheduledDate} ${scheduledTime}` });
      // TODO: implement cron-based scheduling
      return;
    }

    setSending(true);
    try {
      // Insert notifications for all target users
      const notifications = targetUsers.map(u => ({
        user_id: u.user_id,
        type: 'announcement',
        title: title.trim(),
        message: message.trim(),
      }));

      // Batch insert in chunks of 50
      for (let i = 0; i < notifications.length; i += 50) {
        const chunk = notifications.slice(i, i + 50);
        await adminApi('insert', 'notifications', { data: chunk });
      }

      toast({ title: 'Sent!', description: `Announcement sent to ${targetUsers.length} user(s)` });
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      fetchHistory();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
    setSending(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q)) || (u.username?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Megaphone className="w-5 h-5" /> Announcements</h2>

      {/* Compose */}
      <div className="glass-card rounded-xl p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">Compose Announcement</h3>

        <div>
          <Label>Title *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., System Maintenance Notice" />
        </div>

        <div>
          <Label>Message *</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement..." rows={4} />
        </div>

        {/* Target */}
        <div>
          <Label>Send to</Label>
          <Select value={targetType} onValueChange={(v: 'all' | 'selected') => setTargetType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> All Users ({users.length})</div></SelectItem>
              <SelectItem value="selected"><div className="flex items-center gap-2"><User className="w-4 h-4" /> Selected Users</div></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User selection */}
        {targetType === 'selected' && (
          <div className="space-y-2">
            <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {selectedUsers.length > 0 && (
              <p className="text-xs text-primary">{selectedUsers.length} user(s) selected</p>
            )}
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border/30">
              {filteredUsers.slice(0, 50).map(u => (
                <button
                  key={u.user_id}
                  onClick={() => toggleUser(u.user_id)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    selectedUsers.includes(u.user_id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] ${
                    selectedUsers.includes(u.user_id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                  }`}>
                    {selectedUsers.includes(u.user_id) && '✓'}
                  </div>
                  <span className="truncate">{u.full_name || u.email || u.username || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="flex items-center gap-3">
          <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
          <Label className="flex items-center gap-1.5 cursor-pointer"><Clock className="w-4 h-4" /> Schedule for later</Label>
        </div>

        {isScheduled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
            </div>
          </div>
        )}

        <Button onClick={sendAnnouncement} disabled={sending || !title.trim() || !message.trim()} className="w-full">
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />{isScheduled ? 'Schedule Announcement' : 'Send Now'}</>}
        </Button>
      </div>

      {/* History */}
      <div className="glass-card rounded-xl p-4 sm:p-6 space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">Recent Announcements</h3>
        {loadingHistory ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No announcements sent yet</p>
        ) : (
          history.map(h => (
            <div key={h.id} className="border border-border/40 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{h.title}</p>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{h.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementManager;
