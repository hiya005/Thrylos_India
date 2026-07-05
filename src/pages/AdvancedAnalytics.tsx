import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, IndianRupee, Calendar, CheckCircle, Clock, Crown, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

interface Stats {
  totalSpend: number;
  totalProjects: number;
  completed: number;
  active: number;
  avgProjectValue: number;
  avgTimelineDays: number;
  monthlySpend: { month: string; amount: number }[];
  statusBreakdown: { name: string; value: number }[];
  serviceTypeBreakdown: { name: string; count: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(142 71% 45%)", "hsl(45 93% 58%)", "hsl(0 84% 60%)", "hsl(210 100% 60%)"];

const AdvancedAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profile }, { data: requests }, { data: payments }] = await Promise.all([
      supabase.from("profiles").select("is_verified").eq("user_id", user.id).maybeSingle(),
      supabase.from("service_requests").select("id, status, service_type, created_at, updated_at").eq("user_id", user.id),
      supabase.from("payment_requests").select("amount, status, paid_at, created_at").eq("user_id", user.id),
    ]);

    setIsPremium(!!profile?.is_verified);

    const paid = (payments || []).filter(p => p.status === "paid");
    const totalSpend = paid.reduce((sum, p) => sum + Number(p.amount), 0);
    const completed = (requests || []).filter(r => r.status === "completed");
    const active = (requests || []).filter(r => r.status === "in_progress" || r.status === "pending");
    const totalProjects = requests?.length || 0;

    const avgProjectValue = totalProjects > 0 ? totalSpend / totalProjects : 0;
    const completedDurations = completed
      .map(r => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86400000)
      .filter(d => d > 0);
    const avgTimelineDays = completedDurations.length
      ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
      : 0;

    // Monthly spend (last 6 months)
    const now = new Date();
    const months: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const amount = paid
        .filter(p => {
          const pd = new Date(p.paid_at || p.created_at);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        })
        .reduce((s, p) => s + Number(p.amount), 0);
      months.push({ month: key, amount });
    }

    const statusCounts: Record<string, number> = {};
    (requests || []).forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
    const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const typeCounts: Record<string, number> = {};
    (requests || []).forEach(r => {
      const k = r.service_type || "Other";
      typeCounts[k] = (typeCounts[k] || 0) + 1;
    });
    const serviceTypeBreakdown = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    setStats({
      totalSpend, totalProjects, completed: completed.length, active: active.length,
      avgProjectValue, avgTimelineDays, monthlySpend: months, statusBreakdown, serviceTypeBreakdown,
    });
    setLoading(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Activity className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
          <p className="text-sm text-muted-foreground mb-6">Advanced Analytics is exclusively available for verified premium members. Get a verification pass to unlock detailed insights into your projects, spend, and timelines.</p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline"><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
            <Button asChild><Link to="/verification-plans">Get Verified</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon"><Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                Advanced Analytics
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Crown className="w-3 h-3 mr-1" />Premium</Badge>
              </h1>
              <p className="text-xs text-muted-foreground">Deep insights into your projects and spend</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Spend", value: `₹${(stats?.totalSpend || 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
            { label: "Total Projects", value: stats?.totalProjects || 0, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
            { label: "Avg Project Value", value: `₹${Math.round(stats?.avgProjectValue || 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
            { label: "Avg Timeline", value: `${Math.round(stats?.avgTimelineDays || 0)} days`, icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`p-4 border ${s.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                  <div>
                    <p className="text-xl font-bold leading-tight">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Monthly spend chart */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Spend Over Last 6 Months</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlySpend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Spend"]} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Status pie */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />Project Status Breakdown</h3>
            <div className="h-56">
              {stats?.statusBreakdown.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}: ${e.value}`}>
                      {stats.statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-12">No projects yet</p>}
            </div>
          </Card>

          {/* Service type bar */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Top Service Types</h3>
            <div className="h-56">
              {stats?.serviceTypeBreakdown.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.serviceTypeBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={90} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>}
            </div>
          </Card>
        </div>

        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="font-semibold text-sm">Premium insight</p>
              <p className="text-xs text-muted-foreground">
                You completed {stats?.completed || 0} project{stats?.completed === 1 ? "" : "s"} with an average turnaround of {Math.round(stats?.avgTimelineDays || 0)} days. Currently {stats?.active || 0} project{stats?.active === 1 ? "" : "s"} in progress.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdvancedAnalytics;
