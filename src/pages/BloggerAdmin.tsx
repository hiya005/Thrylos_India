import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogOut, Newspaper, Plus, Edit, Trash2, Eye, EyeOff, Loader2, ImagePlus, X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BLOGGER_PASSWORD = 'Thrylos@1212';
const STORAGE_KEY = 'thrylos_blogger_admin_v1';
const DRAFT_KEY = 'thrylos_blog_draft_v2';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface BlogLink { label: string; url: string }
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  category?: string | null;
  subtopic?: string | null;
  highlights?: string[] | null;
  links?: BlogLink[] | null;
  seo_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  author_image_url?: string | null;
  read_time_label?: string | null;
}

const emptyForm = {
  title: '', slug: '', content: '', excerpt: '', cover_image_url: '',
  author_name: 'THRYLOS Team', is_published: false,
  category: 'General', subtopic: '',
  highlights: [] as string[], links: [] as BlogLink[],
  seo_title: '', meta_description: '', canonical_url: '', author_image_url: '', read_time_label: '',
};

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const bloggerApi = async (action: string, payload: Record<string, unknown> = {}) => {
  const password = sessionStorage.getItem(STORAGE_KEY + '_pw') || '';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/blogger-api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-blogger-password': password },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

const BloggerAdmin = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [highlightInput, setHighlightInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autosaveAt, setAutosaveAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const ok = sessionStorage.getItem(STORAGE_KEY);
    if (ok === '1') {
      setAuthed(true);
      fetchPosts();
    }
  }, []);

  useEffect(() => {
    if (!dialog || editing) return;
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.title || parsed.content)) {
        setForm({ ...emptyForm, ...parsed });
        setDraftRestored(true);
      }
    } catch { /* ignore bad draft */ }
  }, [dialog, editing]);

  useEffect(() => {
    if (!dialog || editing) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setAutosaveAt(new Date().toLocaleTimeString());
  }, [dialog, editing, form]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await bloggerApi('select');
      setPosts(data || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === BLOGGER_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      sessionStorage.setItem(STORAGE_KEY + '_pw', password);
      setAuthed(true);
      toast({ title: 'Welcome, Blogger ✍️' });
      fetchPosts();
    } else {
      toast({ title: 'Incorrect password', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY + '_pw');
    setAuthed(false);
    setPassword('');
    setPosts([]);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Max 5 MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast({ title: 'Image uploaded ✅' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setForm(prev => ({ ...prev, highlights: [...prev.highlights, highlightInput.trim()] }));
    setHighlightInput('');
  };
  const removeHighlight = (i: number) => setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, idx) => idx !== i) }));
  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setForm(prev => ({ ...prev, links: [...prev.links, { label: linkLabel.trim(), url: linkUrl.trim() }] }));
    setLinkLabel(''); setLinkUrl('');
  };
  const removeLink = (i: number) => setForm(prev => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }));

  const resetForm = () => { setForm(emptyForm); setEditing(null); setHighlightInput(''); setLinkLabel(''); setLinkUrl(''); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and content required', variant: 'destructive' });
      return;
    }
    try {
      const data = {
        title: form.title,
        slug: form.slug || generateSlug(form.title),
        content: form.content,
        excerpt: form.excerpt || null,
        cover_image_url: form.cover_image_url || null,
        author_name: form.author_name || 'THRYLOS Team',
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
        category: form.category || null,
        subtopic: form.subtopic || null,
        highlights: form.highlights,
        links: form.links,
        seo_title: form.seo_title || form.title,
        meta_description: form.meta_description || form.excerpt || null,
        canonical_url: form.canonical_url || null,
        author_image_url: form.author_image_url || null,
        read_time_label: form.read_time_label || null,
      };
      if (editing) await bloggerApi('update', { data, id: editing.id });
      else await bloggerApi('insert', { data });
      toast({ title: editing ? 'Post updated' : 'Post created ✅' });
      if (!editing) localStorage.removeItem(DRAFT_KEY);
      setDialog(false);
      resetForm();
      fetchPosts();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try { await bloggerApi('delete', { id }); toast({ title: 'Deleted' }); fetchPosts(); }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await bloggerApi('update', {
        id: post.id,
        data: { is_published: !post.is_published, published_at: !post.is_published ? new Date().toISOString() : null },
      });
      toast({ title: post.is_published ? 'Unpublished' : 'Published ✅' });
      fetchPosts();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Update failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title, slug: post.slug, content: post.content,
      excerpt: post.excerpt || '', cover_image_url: post.cover_image_url || '',
      author_name: post.author_name, is_published: post.is_published,
      category: post.category || 'General', subtopic: post.subtopic || '',
      highlights: Array.isArray(post.highlights) ? post.highlights : [],
      links: Array.isArray(post.links) ? post.links : [],
      seo_title: post.seo_title || '', meta_description: post.meta_description || '',
      canonical_url: post.canonical_url || '', author_image_url: post.author_image_url || '',
      read_time_label: post.read_time_label || '',
    });
    setDialog(true);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="glass-card">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <Newspaper className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-xl font-bold">Blogger Admin</h1>
                <p className="text-xs text-muted-foreground mt-1">Sign in to manage THRYLOS blog posts</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" autoFocus />
                </div>
                <Button type="submit" className="w-full">Sign in</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold">Blogger Admin</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-3">
            <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{posts.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{posts.filter(p => p.is_published).length}</p><p className="text-[10px] text-muted-foreground">Published</p></CardContent></Card>
            <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{posts.filter(p => !p.is_published).length}</p><p className="text-[10px] text-muted-foreground">Drafts</p></CardContent></Card>
          </div>
          <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="w-4 h-4 mr-2" />New Post</Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">{editing ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
                {!editing && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                    {draftRestored && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5">📝 Draft restored</span>}
                    {autosaveAt && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5">✓ Autosaved {autosaveAt}</span>}
                    <button type="button" onClick={() => { localStorage.removeItem(DRAFT_KEY); setForm(emptyForm); setDraftRestored(false); setAutosaveAt(null); }} className="text-destructive hover:underline">Clear draft</button>
                  </div>
                )}
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })} /></div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={e => setForm({ ...form, slug: generateSlug(e.target.value) })} placeholder="auto" />
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">URL: <span className="text-primary">thrylosindia.in/blog#{form.slug || generateSlug(form.title) || 'your-slug'}</span></p>
                  </div>
                  <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Tech, Updates..." /></div>
                  <div><Label>Subtopic</Label><Input value={form.subtopic} onChange={e => setForm({ ...form, subtopic: e.target.value })} placeholder="React, SEO..." /></div>
                  <div className="sm:col-span-2"><Label>Excerpt</Label><Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary" /></div>
                  <div className="sm:col-span-2 rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">SEO Controls</p>
                    <div><Label className="text-xs">SEO Title</Label><Input value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} placeholder="Defaults to post title (≤60 chars)" maxLength={70} /><p className="text-[10px] text-muted-foreground mt-0.5">{(form.seo_title || form.title).length}/60 chars</p></div>
                    <div><Label className="text-xs">Meta Description</Label><Textarea rows={2} value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} placeholder="Under 160 characters" maxLength={180} /><p className="text-[10px] text-muted-foreground mt-0.5">{(form.meta_description || form.excerpt || '').length}/160 chars</p></div>
                    <div><Label className="text-xs">Canonical URL</Label><Input value={form.canonical_url} onChange={e => setForm({ ...form, canonical_url: e.target.value })} placeholder={`https://thrylosindia.in/blog#${form.slug || 'your-slug'}`} /></div>
                  </div>
                  <div><Label>Read Time</Label><Input value={form.read_time_label} onChange={e => setForm({ ...form, read_time_label: e.target.value })} placeholder="15 min read" /></div>
                  <div><Label>Author</Label><Input value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} /></div>
                  <div><Label>Author Image URL</Label><Input value={form.author_image_url} onChange={e => setForm({ ...form, author_image_url: e.target.value })} placeholder="Uploaded image URL" /></div>
                  <div className="flex items-end gap-2"><Switch checked={form.is_published} onCheckedChange={c => setForm({ ...form, is_published: c })} /><Label>Publish</Label></div>
                </div>

                <div>
                  <Label>Cover Image (upload from device)</Label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  <div className="flex gap-2 mt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      <span className="ml-2">{form.cover_image_url ? 'Change image' : 'Upload from device'}</span>
                    </Button>
                    {form.cover_image_url && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, cover_image_url: '' })}>
                        <X className="w-4 h-4 mr-1" />Remove
                      </Button>
                    )}
                  </div>
                  {form.cover_image_url && <img src={form.cover_image_url} alt="cover preview" className="mt-2 w-full max-h-48 object-cover rounded-lg border border-border" />}
                </div>

                <div>
                  <Label>Highlights</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={highlightInput} onChange={e => setHighlightInput(e.target.value)} placeholder="Add a key takeaway" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }} />
                    <Button type="button" variant="outline" size="sm" onClick={addHighlight}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {form.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {form.highlights.map((h, i) => (
                        <li key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded px-2 py-1">
                          <span>• {h}</span>
                          <button onClick={() => removeHighlight(i)} className="text-destructive"><X className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <Label>External Links</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 mt-1">
                    <Input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Label" />
                    <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
                    <Button type="button" variant="outline" size="sm" onClick={addLink}><Link2 className="w-4 h-4" /></Button>
                  </div>
                  {form.links.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {form.links.map((l, i) => (
                        <li key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded px-2 py-1">
                          <span className="truncate"><span className="font-medium">{l.label}</span> — <span className="text-muted-foreground">{l.url}</span></span>
                          <button onClick={() => removeLink(i)} className="text-destructive"><X className="w-3.5 h-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div><Label>Content *</Label><Textarea rows={12} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="font-mono text-sm" /></div>
                <Button onClick={handleSave} className="w-full">Save Post</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <Card className="glass-card"><CardContent className="p-8 text-center text-muted-foreground text-sm">No blog posts yet. Click "New Post" to write your first article.</CardContent></Card>
        ) : posts.map(post => (
          <Card key={post.id} className={`glass-card transition ${post.is_published ? '' : 'opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 flex gap-3">
                  {post.cover_image_url && <img src={post.cover_image_url} alt="" className="w-20 h-20 object-cover rounded-md flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm truncate">{post.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${post.is_published ? 'text-emerald-400 border-emerald-500/30' : 'text-muted-foreground'}`}>
                        {post.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      {post.category && <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{post.author_name} • {new Date(post.created_at).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt || post.content.substring(0, 120)}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => togglePublish(post)}>
                    {post.is_published ? <><EyeOff className="w-3 h-3 mr-1" />Hide</> : <><Eye className="w-3 h-3 mr-1" />Publish</>}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(post)}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(post.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
};

export default BloggerAdmin;
