import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Tag, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/adminApi';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const CouponManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '', is_active: true });
  const { toast } = useToast();

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const data = await adminApi('select', 'coupons', { filters: { order: { column: 'created_at', ascending: false } } });
      setCoupons(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast({ title: 'Error', description: 'Code and discount value required', variant: 'destructive' });
      return;
    }
    try {
      await adminApi('insert', 'coupons', {
        data: {
          code: form.code.toUpperCase(),
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
          is_active: form.is_active,
        }
      });
      toast({ title: 'Coupon created ✅' });
      setDialog(false);
      setForm({ code: '', discount_type: 'percentage', discount_value: '', max_uses: '', expires_at: '', is_active: true });
      fetchCoupons();
    } catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await adminApi('delete', 'coupons', { id }); toast({ title: 'Coupon deleted' }); fetchCoupons(); }
    catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try { await adminApi('update', 'coupons', { data: { is_active: !active }, id }); fetchCoupons(); }
    catch (e) { toast({ title: 'Error', variant: 'destructive' }); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Coupon</Button></DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Coupon Code *</Label><Input placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Discount Value *</Label><Input type="number" placeholder={form.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 500'} value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} /></div>
              <div><Label>Max Uses (empty = unlimited)</Label><Input type="number" placeholder="e.g. 100" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} /></div>
              <div><Label>Expires At</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} /><Label>Active</Label></div>
              <Button onClick={handleSave} className="w-full font-medium">Create Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card className="glass-card"><CardContent className="py-12 text-center"><Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No coupons yet</p></CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map(coupon => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
            const isMaxed = coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses;
            return (
              <Card key={coupon.id} className={`glass-card transition ${!coupon.is_active || isExpired || isMaxed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-bold text-xl font-mono">{coupon.code}</span>
                      </div>
                      <p className="text-sm text-primary font-semibold">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteCoupon(coupon.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {coupon.max_uses !== null && <div className="flex items-center gap-1"><Hash className="w-3 h-3" />Used: {coupon.current_uses}/{coupon.max_uses}</div>}
                    {coupon.expires_at && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{isExpired ? 'Expired' : `Expires: ${new Date(coupon.expires_at).toLocaleDateString()}`}</div>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant={coupon.is_active && !isExpired && !isMaxed ? 'default' : 'secondary'} className="text-[10px]">
                      {isExpired ? 'Expired' : isMaxed ? 'Maxed Out' : coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponManager;
