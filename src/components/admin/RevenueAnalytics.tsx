import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  user_name?: string;
}

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(221, 83%, 53%)'];

const RevenueAnalytics = ({ payments }: { payments: Payment[] }) => {
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const avgTransaction = paidPayments.length > 0 ? totalRevenue / paidPayments.length : 0;

  // Monthly revenue
  const monthlyData: Record<string, number> = {};
  paidPayments.forEach(p => {
    const date = new Date(p.paid_at || p.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = (monthlyData[key] || 0) + Number(p.amount);
  });
  const monthlyChart = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      amount,
    }));

  // Payment status distribution
  const statusData = [
    { name: 'Paid', value: paidPayments.length },
    { name: 'Pending', value: payments.filter(p => p.status === 'pending').length },
    { name: 'Failed', value: payments.filter(p => p.status === 'failed').length },
  ].filter(d => d.value > 0);

  // Top clients
  const clientRevenue: Record<string, number> = {};
  paidPayments.forEach(p => {
    const name = (p as any).user_name || 'Unknown';
    clientRevenue[name] = (clientRevenue[name] || 0) + Number(p.amount);
  });
  const topClients = Object.entries(clientRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Total Revenue</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-400">₹{pendingRevenue.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-400">₹{avgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Avg Transaction</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{paidPayments.length}</p><p className="text-xs text-muted-foreground">Transactions</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {monthlyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="amount" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Top Clients by Revenue</CardTitle></CardHeader>
        <CardContent>
          {topClients.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="amount" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalytics;
