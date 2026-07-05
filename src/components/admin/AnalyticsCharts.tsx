import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

interface ServiceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  service_type?: string;
  created_at: string;
  assigned_pm_id?: string | null;
}

interface ProjectManager {
  id: string;
  name: string;
  is_available: boolean;
}

interface AnalyticsChartsProps {
  requests: ServiceRequest[];
  projectManagers: ProjectManager[];
  overview?: {
    currentMrr: number;
    premiumConversion: number;
    churnRate: number;
    activePmCount: number;
    paidRevenue: number;
  };
  payments?: { amount: number | string; status: string; paid_at?: string | null; created_at: string }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

const AnalyticsCharts = ({ requests, projectManagers, overview, payments = [] }: AnalyticsChartsProps) => {
  // Request trends by month
  const requestTrends = useMemo(() => {
    const months: Record<string, number> = {};
    requests.forEach(r => {
      const date = new Date(r.created_at);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, count]) => ({ month, count }));
  }, [requests]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      const label = r.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // PM workload
  const pmWorkload = useMemo(() => {
    const workload: Record<string, number> = {};
    projectManagers.forEach(pm => { workload[pm.name] = 0; });
    requests.forEach(r => {
      if (r.assigned_pm_id) {
        const pm = projectManagers.find(p => p.id === r.assigned_pm_id);
        if (pm) workload[pm.name] = (workload[pm.name] || 0) + 1;
      }
    });
    return Object.entries(workload).map(([name, projects]) => ({ name, projects }));
  }, [requests, projectManagers]);

  // Popular services
  const popularServices = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      const type = r.service_type || 'Unspecified';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [requests]);

  const businessHealth = useMemo(() => {
    if (!overview) return [];
    return [
      { name: 'MRR', value: overview.currentMrr },
      { name: 'Conversion', value: overview.premiumConversion },
      { name: 'Churn', value: overview.churnRate },
      { name: 'Active PMs', value: overview.activePmCount },
    ];
  }, [overview]);

  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    payments.filter(p => p.status === 'paid').forEach(p => {
      const date = new Date(p.paid_at || p.created_at);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      months[key] = (months[key] || 0) + Number(p.amount || 0);
    });
    return Object.entries(months).slice(-6).map(([month, revenue]) => ({ month, revenue }));
  }, [payments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Business Health */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Business Health</CardTitle>
        </CardHeader>
        <CardContent>
          {businessHealth.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={businessHealth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {businessHealth.map((_, index) => (
                    <Cell key={`health-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Monthly Paid Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No paid revenue yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Request Trends */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Request Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {requestTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={requestTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {statusDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* PM Workload */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">PM Workload</CardTitle>
        </CardHeader>
        <CardContent>
          {pmWorkload.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No PMs yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pmWorkload} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="projects" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Popular Services */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
          {popularServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={popularServices} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {popularServices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
