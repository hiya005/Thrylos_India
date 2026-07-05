import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Calendar, RefreshCw, BarChart3, Crown, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ActivityEvent {
  id: string;
  type: "request" | "payment" | "milestone" | "audit";
  title: string;
  detail: string;
  at: string;
}

interface UpcomingMilestone {
  id: string;
  title: string;
  due_date: string;
  request_title: string;
  request_id: string;
}

interface CompletedRequest {
  id: string;
  title: string;
  service_type: string | null;
}

interface Props {
  userId: string;
  isPremium: boolean;
  onReorder: (req: CompletedRequest) => void;
}

const DashboardWidgets = ({ userId, isPremium, onReorder }: Props) => {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [milestones, setMilestones] = useState<UpcomingMilestone[]>([]);
  const [completed, setCompleted] = useState<CompletedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    const [reqRes, payRes, msRes, completedRes] = await Promise.all([
      supabase.from("service_requests")
        .select("id, title, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase.from("payment_requests")
        .select("id, amount, status, created_at, paid_at, service_request_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("project_milestones")
        .select("id, title, due_date, service_request_id, status")
        .gte("due_date", new Date().toISOString())
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(5),
      supabase.from("service_requests")
        .select("id, title, service_type, updated_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

    // Filter milestones to user-owned requests only
    const userRequestIds = new Set((reqRes.data || []).map(r => r.id));
    // Need to fetch all user requests for milestones, not just last 5
    const { data: allUserReqs } = await supabase
      .from("service_requests")
      .select("id, title")
      .eq("user_id", userId);
    const reqMap = new Map((allUserReqs || []).map(r => [r.id, r.title]));
    const userMilestones = (msRes.data || [])
      .filter(m => reqMap.has(m.service_request_id))
      .map(m => ({
        id: m.id,
        title: m.title,
        due_date: m.due_date,
        request_title: reqMap.get(m.service_request_id) || "",
        request_id: m.service_request_id,
      }))
      .slice(0, 4);

    // Build activity feed
    const events: ActivityEvent[] = [];
    (reqRes.data || []).forEach(r => {
      events.push({
        id: `req-${r.id}`,
        type: "request",
        title: r.title,
        detail: `Status: ${r.status.replace("_", " ")}`,
        at: r.updated_at,
      });
    });
    (payRes.data || []).forEach(p => {
      events.push({
        id: `pay-${p.id}`,
        type: "payment",
        title: p.status === "paid" ? "Payment completed" : "Payment requested",
        detail: `₹${Number(p.amount).toLocaleString("en-IN")}`,
        at: p.paid_at || p.created_at,
      });
    });
    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    setActivity(events.slice(0, 6));
    setMilestones(userMilestones);
    setCompleted(completedRes.data || []);
    setLoading(false);
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const formatDue = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days <= 0) return { label: "Today", color: "text-red-400" };
    if (days === 1) return { label: "Tomorrow", color: "text-amber-400" };
    if (days <= 7) return { label: `In ${days}d`, color: "text-amber-400" };
    return { label: new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), color: "text-muted-foreground" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4 h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Recent Activity</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted/30 animate-pulse" />)}</div>
          ) : activity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No recent activity yet</p>
          ) : (
            <div className="space-y-2">
              {activity.map(ev => (
                <div key={ev.id} className="flex items-start gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ev.type === "payment" ? "bg-emerald-400" : ev.type === "request" ? "bg-blue-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ev.title}</p>
                    <p className="text-muted-foreground text-[11px]">{ev.detail} • {formatRelative(ev.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Upcoming Milestones */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-4 h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400" />Upcoming Milestones</h3>
            <span className="text-[10px] text-muted-foreground">{milestones.length}</span>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 rounded bg-muted/30 animate-pulse" />)}</div>
          ) : milestones.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No upcoming milestones</p>
          ) : (
            <div className="space-y-2">
              {milestones.map(m => {
                const due = formatDue(m.due_date);
                return (
                  <div key={m.id} className="flex items-start gap-2 text-xs p-2 rounded-lg border border-border/50 bg-muted/10">
                    <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.title}</p>
                      <p className="text-muted-foreground text-[11px] truncate">{m.request_title}</p>
                    </div>
                    <span className={`text-[10px] font-medium ${due.color} flex-shrink-0`}>{due.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick Re-order + Premium */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-4 h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-emerald-400" />Quick Re-order</h3>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 rounded bg-muted/30 animate-pulse" />)}</div>
          ) : completed.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Complete a project to enable re-order</p>
          ) : (
            <div className="space-y-2 mb-3">
              {completed.map(c => (
                <button
                  key={c.id}
                  onClick={() => onReorder(c)}
                  className="w-full text-left p-2 rounded-lg border border-border/50 bg-muted/10 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all group flex items-center gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-emerald-400 transition">{c.title}</p>
                    {c.service_type && <p className="text-[10px] text-muted-foreground truncate">{c.service_type}</p>}
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-emerald-400 transition" />
                </button>
              ))}
            </div>
          )}

          <Link
            to="/analytics"
            className={`block p-2.5 rounded-lg border ${isPremium ? "border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20" : "border-border/50 bg-muted/20"} transition-all group`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className={`w-4 h-4 ${isPremium ? "text-amber-400" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold flex items-center gap-1">
                  Advanced Analytics
                  {isPremium ? <Crown className="w-3 h-3 text-amber-400" /> : <span className="text-[9px] text-muted-foreground ml-1">(Premium)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">{isPremium ? "Spend, timelines, breakdowns" : "Unlock with verification"}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-amber-400 transition" />
            </div>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardWidgets;
