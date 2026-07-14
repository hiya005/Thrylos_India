import { useState, useEffect } from "react";
import { Search, X, User, FileText, CreditCard, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/adminApi";

interface Result {
  type: "user" | "request" | "payment";
  id: string;
  primary: string;
  secondary: string;
}

interface Props {
  onSelectRequest?: (id: string) => void;
  onSelectUser?: (id: string) => void;
  onSelectPayment?: (id: string) => void;
}

const AdminGlobalSearch = ({ onSelectRequest, onSelectUser, onSelectPayment }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => { void search(); }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const search = async () => {
    setLoading(true);
    try {
      const [users, requests, payments] = await Promise.all([
        adminApi("select", "profiles", { data: { select: "user_id, full_name, email, username, account_id" } }),
        adminApi("select", "service_requests", { data: { select: "id, title, status, user_id" } }),
        adminApi("select", "payment_requests", { data: { select: "id, amount, status, transaction_id, cashfree_order_id, user_id" } }),
      ]);
      const q = query.toLowerCase();
      const out: Result[] = [];

      (users || []).filter((u: Record<string, unknown>) =>
        [u.full_name, u.email, u.username, u.account_id].some(v => v && String(v).toLowerCase().includes(q))
      ).slice(0, 5).forEach((u: Record<string, unknown>) => out.push({
        type: "user",
        id: String(u.user_id),
        primary: String(u.full_name || u.username || "Unnamed"),
        secondary: `${u.email || ""} · ${u.account_id || ""}`,
      }));

      (requests || []).filter((r: Record<string, unknown>) =>
        [r.title, r.id, r.status].some(v => v && String(v).toLowerCase().includes(q))
      ).slice(0, 5).forEach((r: Record<string, unknown>) => out.push({
        type: "request",
        id: String(r.id),
        primary: String(r.title),
        secondary: `Status: ${r.status} · ${String(r.id).slice(0, 8)}`,
      }));

      (payments || []).filter((p: Record<string, unknown>) =>
        [p.id, p.transaction_id, p.cashfree_order_id, p.amount].some(v => v && String(v).toLowerCase().includes(q))
      ).slice(0, 5).forEach((p: Record<string, unknown>) => out.push({
        type: "payment",
        id: String(p.id),
        primary: `₹${Number(p.amount).toLocaleString("en-IN")}`,
        secondary: `${p.status} · ${p.transaction_id || p.cashfree_order_id || String(p.id).slice(0, 8)}`,
      }));

      setResults(out);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleClick = (r: Result) => {
    setOpen(false);
    setQuery("");
    if (r.type === "request") onSelectRequest?.(r.id);
    if (r.type === "user") onSelectUser?.(r.id);
    if (r.type === "payment") onSelectPayment?.(r.id);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 rounded-lg">
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Global Search</span>
        <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">⌘K</kbd>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl glass-card rounded-xl border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search users, requests, payments…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 h-8"
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!query && <p className="text-xs text-muted-foreground text-center py-8">Type at least 2 characters to search</p>}
              {query && !loading && results.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No matches</p>}
              {results.map((r, i) => {
                const Icon = r.type === "user" ? User : r.type === "request" ? FileText : CreditCard;
                const color = r.type === "user" ? "text-blue-400" : r.type === "request" ? "text-amber-400" : "text-emerald-400";
                return (
                  <button
                    key={`${r.type}-${r.id}-${i}`}
                    onClick={() => handleClick(r)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-muted/30 border-b border-border/40 transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.primary}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.secondary}</p>
                    </div>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded bg-muted/50 ${color}`}>{r.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminGlobalSearch;
