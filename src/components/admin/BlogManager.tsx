import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Upload, X, ImagePlus, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { adminApi } from '@/lib/adminApi';

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
}

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  cover_image_url: '',
  author_name: 'THRYLOS Team',
  is_published: false,
  category: 'General',
  subtopic: '',
  highlights: [] as string[],
  links: [] as BlogLink[],
};

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface BlogManagerProps {
  /** When true, use direct supabase access (for /blogger-admin standalone). Otherwise route through adminApi. */
  useDirectAccess?: boolean;
}

const BlogManager = ({ useDirectAccess = false }: BlogManagerProps) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [highlightInput, setHighlightInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      if (useDirectAccess) {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setPosts((data as unknown as BlogPost[]) || []);
      } else {
        const data = await adminApi('select', 'blog_posts', { filters: { order: { column: 'created_at', ascending: false } } });
        setPosts((data as BlogPost[]) || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5 MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;
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

  const removeHighlight = (idx: number) =>
    setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }));

  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setForm(prev => ({ ...prev, links: [...prev.links, { label: linkLabel.trim(), url: linkUrl.trim() }] }));
    setLinkLabel('');
    setLinkUrl('');
  };

  const removeLink = (idx: number) =>
    setForm(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setHighlightInput('');
    setLinkLabel('');
    setLinkUrl('');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
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
        links: form.links as unknown as never,
      };

      if (useDirectAccess) {
        if (editing) {
          const { error } = await supabase.from('blog_posts').update(payload as never).eq('id', editing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('blog_posts').insert(payload as never);
          if (error) throw error;
        }
      } else {
        if (editing) await adminApi('update', 'blog_posts', { data: payload, id: editing.id });
        else await adminApi('insert', 'blog_posts', { data: payload });
      }

      toast({ title: editing ? 'Post updated' : 'Post created' });
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
    try {
      if (useDirectAccess) {
        const { error } = await supabase.from('blog_posts').delete().eq('id', id);
        if (error) throw error;
      } else {
        await adminApi('delete', 'blog_posts', { id });
      }
      toast({ title: 'Post deleted' });
      fetchPosts();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const update = { is_published: !post.is_published, published_at: !post.is_published ? new Date().toISOString() : null };
      if (useDirectAccess) {
        const { error } = await supabase.from('blog_posts').update(update).eq('id', post.id);
        if (error) throw error;
      } else {
        await adminApi('update', 'blog_posts', { data: update, id: post.id });
      }
      toast({ title: post.is_published ? 'Post unpublished' : 'Post published ✅' });
      fetchPosts();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Update failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      cover_image_url: post.cover_image_url || '',
      author_name: post.author_name,
      is_published: post.is_published,
      category: post.category || 'General',
      subtopic: post.subtopic || '',
      highlights: Array.isArray(post.highlights) ? post.highlights : [],
      links: Array.isArray(post.links) ? post.links : [],
    });
    setDialog(true);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-3">
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold">{posts.length}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{posts.filter(p => p.is_published).length}</p><p className="text-[10px] text-muted-foreground">Published</p></CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{posts.filter(p => !p.is_published).length}</p><p className="text-[10px] text-muted-foreground">Drafts</p></CardContent></Card>
        </div>
        <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? 'Edit Post' : 'New Blog Post'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Tech, Updates, Tips..." /></div>
                <div><Label>Subtopic</Label><Input value={form.subtopic} onChange={e => setForm({ ...form, subtopic: e.target.value })} placeholder="React, Performance..." /></div>
                <div className="sm:col-span-2"><Label>Excerpt</Label><Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary shown on cards" /></div>
                <div><Label>Author</Label><Input value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} /></div>
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
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="cover preview" className="mt-2 w-full max-h-48 object-cover rounded-lg border border-border" />
                )}
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

              <div><Label>Content (Markdown / plain text) *</Label><Textarea rows={12} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="font-mono text-sm" /></div>
              <Button onClick={handleSave} className="w-full">Save Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <Card className="glass-card"><CardContent className="p-8 text-center text-muted-foreground text-sm">No blog posts yet. Click "New Post" to write your first article.</CardContent></Card>
      ) : posts.map(post => (
        <Card key={post.id} className={`glass-card transition ${post.is_published ? '' : 'opacity-60'}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 flex gap-3">
                {post.cover_image_url && (
                  <img src={post.cover_image_url} alt="" className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                )}
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
    </div>
  );
};

export default BlogManager;
