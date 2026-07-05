import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ArrowLeft, ChevronRight, Briefcase } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';

interface UserResult {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  account_id: string | null;
  company: string | null;
  is_verified: boolean;
  verification_type?: string | null;
}

const SearchUsers = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setSearched(true);

    // Search by username, account_id, or full_name
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url, account_id, company, is_verified, verification_type')
      .or(`username.ilike.%${q}%,account_id.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(20);

    setResults((data || []) as UserResult[]);
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link to="/dashboard"><Button variant="ghost" size="sm" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
              <Users className="w-4 h-4" />Find People
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Search Users</h1>
            <p className="text-muted-foreground">Find users by username, name, or Account ID</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 mb-6">
            <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by @username, name, or THRYLOS26..."
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading || query.trim().length < 2}>
                {loading ? <span className="animate-spin">⏳</span> : 'Search'}
              </Button>
            </form>
          </motion.div>

          {searched && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">No users found for "{query}"</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-3">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                  {results.map((u, i) => (
                    <motion.div key={u.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/user/${u.username || u.account_id}`} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-all block">
                        <div className="flex-shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary ring-2 ring-border">
                              {(u.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate flex items-center gap-1.5">
                            {u.full_name || 'Anonymous'}
                            {u.is_verified && <VerifiedBadge verificationType={u.verification_type} className="w-4 h-4" />}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {u.username && <span className="text-xs text-primary font-mono">@{u.username}</span>}
                            {u.account_id && <span className="text-xs text-muted-foreground font-mono">{u.account_id}</span>}
                          </div>
                          {u.company && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3" />{u.company}</p>}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchUsers;
