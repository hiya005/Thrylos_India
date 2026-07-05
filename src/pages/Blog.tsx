import { useEffect, useMemo, useState } from 'react';
import { Calendar, ArrowRight, Clock, User, ExternalLink, Sparkles, Tag, ArrowLeft, Share2, Bookmark, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface BlogLink { label: string; url: string }
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
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

/* ========================================================================
   Lightweight markdown-ish renderer.
   Supports:
     # H1   ## H2   ### H3
     > blockquote
     - list item
     1. numbered list
     ![alt](image-url)
     [label](url)        inline links
     **bold**  *italic*
     `inline code`
     ```code block```
     --- horizontal rule
     :::key Key Point text :::      → highlight callout
     :::tip Tip text :::            → tip callout
     :::conclusion Final words :::  → conclusion callout
   Anything else is a paragraph.
   ======================================================================== */
const renderInline = (text: string) => {
  // Escape, then replace patterns. Order matters.
  const parts: (string | { type: 'link'; href: string; label: string } | { type: 'bold'; text: string } | { type: 'italic'; text: string } | { type: 'code'; text: string })[] = [];
  let remaining = text;
  const patterns: { regex: RegExp; build: (m: RegExpMatchArray) => typeof parts[number] }[] = [
    { regex: /`([^`]+)`/, build: m => ({ type: 'code', text: m[1] }) },
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, build: m => ({ type: 'link', href: m[2], label: m[1] }) },
    { regex: /\*\*([^*]+)\*\*/, build: m => ({ type: 'bold', text: m[1] }) },
    { regex: /\*([^*]+)\*/, build: m => ({ type: 'italic', text: m[1] }) },
  ];
  while (remaining.length) {
    let earliest: { idx: number; match: RegExpMatchArray; build: typeof patterns[number]['build'] } | null = null;
    for (const p of patterns) {
      const m = remaining.match(p.regex);
      if (m && m.index !== undefined && (earliest === null || m.index < earliest.idx)) {
        earliest = { idx: m.index, match: m, build: p.build };
      }
    }
    if (!earliest) { parts.push(remaining); break; }
    if (earliest.idx > 0) parts.push(remaining.slice(0, earliest.idx));
    parts.push(earliest.build(earliest.match));
    remaining = remaining.slice(earliest.idx + earliest.match[0].length);
  }
  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{p}</span>;
    if (p.type === 'link') return <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-0.5">{p.label}<ExternalLink className="w-3 h-3 inline" /></a>;
    if (p.type === 'bold') return <strong key={i} className="font-semibold text-foreground">{p.text}</strong>;
    if (p.type === 'italic') return <em key={i} className="italic">{p.text}</em>;
    return <code key={i} className="rounded bg-muted/60 px-1.5 py-0.5 text-[0.85em] font-mono text-primary">{p.text}</code>;
  });
};

const RichContent = ({ content }: { content: string }) => {
  const blocks = useMemo(() => {
    const lines = content.split('\n');
    type Block =
      | { type: 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'hr' | 'image' | 'callout'; text?: string; src?: string; alt?: string; variant?: 'key' | 'tip' | 'conclusion' }
      | { type: 'ul' | 'ol'; items: string[] }
      | { type: 'code'; text: string };
    const out: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      const raw = lines[i];
      const line = raw.trimEnd();
      if (!line.trim()) { i++; continue; }
      // code block
      if (line.startsWith('```')) {
        const buf: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++; }
        i++;
        out.push({ type: 'code', text: buf.join('\n') });
        continue;
      }
      // callouts
      const calloutMatch = line.match(/^:::(\w+)\s*(.*)$/);
      if (calloutMatch) {
        const variant = calloutMatch[1] as 'key' | 'tip' | 'conclusion';
        const buf: string[] = [];
        if (calloutMatch[2] && calloutMatch[2] !== ':::') buf.push(calloutMatch[2].replace(/:::\s*$/, ''));
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) { buf.push(lines[i]); i++; }
        i++;
        out.push({ type: 'callout', text: buf.join(' ').trim(), variant });
        continue;
      }
      if (line === '---' || line === '***') { out.push({ type: 'hr' }); i++; continue; }
      if (line.startsWith('# ')) { out.push({ type: 'h1', text: line.slice(2) }); i++; continue; }
      if (line.startsWith('## ')) { out.push({ type: 'h2', text: line.slice(3) }); i++; continue; }
      if (line.startsWith('### ')) { out.push({ type: 'h3', text: line.slice(4) }); i++; continue; }
      if (line.startsWith('> ')) { out.push({ type: 'quote', text: line.slice(2) }); i++; continue; }
      const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (img) { out.push({ type: 'image', src: img[2], alt: img[1] }); i++; continue; }
      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        out.push({ type: 'ul', items });
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        out.push({ type: 'ol', items });
        continue;
      }
      // paragraph (collect consecutive non-empty non-special lines)
      const buf: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>\s|[-*]\s|\d+\.\s|```|!\[|---|:::)/.test(lines[i].trim())) {
        buf.push(lines[i].trim());
        i++;
      }
      out.push({ type: 'p', text: buf.join(' ') });
    }
    return out;
  }, [content]);

  return (
    <div className="space-y-5 text-foreground/90 text-base sm:text-lg leading-[1.8]">
      {blocks.map((b, idx) => {
        const variants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(idx, 8) * 0.04, duration: 0.4 } };
        if (b.type === 'h1') return <motion.h2 key={idx} {...variants} className="text-3xl sm:text-4xl font-bold mt-12 mb-2 gradient-text">{b.text}</motion.h2>;
        if (b.type === 'h2') return <motion.h3 key={idx} {...variants} className="text-2xl sm:text-3xl font-bold mt-10 mb-1 text-primary">{b.text}</motion.h3>;
        if (b.type === 'h3') return <motion.h4 key={idx} {...variants} className="text-xl sm:text-2xl font-semibold mt-8 mb-1">{b.text}</motion.h4>;
        if (b.type === 'hr') return <motion.hr key={idx} {...variants} className="my-8 border-border/60" />;
        if (b.type === 'quote') return (
          <motion.blockquote key={idx} {...variants} className="border-l-4 border-primary pl-5 py-2 italic text-foreground/85 bg-primary/5 rounded-r-lg">
            {renderInline(b.text || '')}
          </motion.blockquote>
        );
        if (b.type === 'image') return (
          <motion.figure key={idx} {...variants} className="my-6">
            <img src={b.src} alt={b.alt} className="w-full rounded-2xl border border-border shadow-lg" loading="lazy" />
            {b.alt && <figcaption className="text-center text-xs text-muted-foreground mt-2">{b.alt}</figcaption>}
          </motion.figure>
        );
        if (b.type === 'code') return (
          <motion.pre key={idx} {...variants} className="rounded-xl bg-muted/40 border border-border p-4 overflow-x-auto text-sm font-mono">
            <code>{b.text}</code>
          </motion.pre>
        );
        if (b.type === 'ul') return (
          <motion.ul key={idx} {...variants} className="space-y-2 my-3">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-3 items-start"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{renderInline(it)}</li>
            ))}
          </motion.ul>
        );
        if (b.type === 'ol') return (
          <motion.ol key={idx} {...variants} className="space-y-2 my-3 list-decimal pl-6 marker:text-primary marker:font-semibold">
            {b.items.map((it, j) => <li key={j} className="pl-1">{renderInline(it)}</li>)}
          </motion.ol>
        );
        if (b.type === 'callout') {
          const config = {
            key: { bg: 'bg-primary/5 border-primary/30', icon: <Sparkles className="w-4 h-4 text-primary" />, label: 'Key point' },
            tip: { bg: 'bg-success/5 border-success/30', icon: <Lightbulb className="w-4 h-4 text-success" />, label: 'Tip' },
            conclusion: { bg: 'bg-warning/5 border-warning/30', icon: <Bookmark className="w-4 h-4 text-warning" />, label: 'Conclusion' },
          }[b.variant || 'key'];
          return (
            <motion.div key={idx} {...variants} className={`rounded-xl border ${config.bg} p-5 my-6`}>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider opacity-90">{config.icon}{config.label}</div>
              <div className="text-base">{renderInline(b.text || '')}</div>
            </motion.div>
          );
        }
        // p / fallback (h1-h3, hr, image, code, quote already returned above; ul/ol returned)
        if ('text' in b) return <motion.p key={idx} {...variants}>{renderInline(b.text || '')}</motion.p>;
        return null;
      })}
    </div>
  );
};

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubtopic, setActiveSubtopic] = useState<string>('All');
  const { toast } = useToast();

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    if (selectedPost) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedPost]);

  useEffect(() => {
    const title = selectedPost?.seo_title || selectedPost?.title || 'THRYLOS Blogs';
    const description = selectedPost?.meta_description || selectedPost?.excerpt || 'Long-form esports guides, tournament insights, and competitive gaming knowledge curated by THRYLOS.';
    document.title = `${title} | THRYLOS`;
    const ensureMeta = (selector: string, attr: string, value: string) => {
      let tag = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!tag) {
        tag = selector.startsWith('link') ? document.createElement('link') : document.createElement('meta');
        if (selector.includes('description')) tag.setAttribute('name', 'description');
        if (selector.includes('canonical')) tag.setAttribute('rel', 'canonical');
        document.head.appendChild(tag);
      }
      tag.setAttribute(attr, value);
    };
    ensureMeta('meta[name="description"]', 'content', description.slice(0, 160));
    ensureMeta('link[rel="canonical"]', 'href', selectedPost?.canonical_url || `${window.location.origin}/blog${selectedPost ? `#${selectedPost.slug}` : ''}`);
  }, [selectedPost]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    setPosts((data as unknown as BlogPost[]) || []);
    setLoading(false);
  };

  const readTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [posts]);

  const subtopics = useMemo(() => {
    const set = new Set<string>();
    posts.filter(p => activeCategory === 'All' || p.category === activeCategory)
      .forEach(p => { if (p.subtopic) set.add(p.subtopic); });
    return ['All', ...Array.from(set)];
  }, [posts, activeCategory]);

  const filteredPosts = useMemo(
    () => posts
      .filter(p => activeCategory === 'All' || p.category === activeCategory)
      .filter(p => activeSubtopic === 'All' || p.subtopic === activeSubtopic),
    [posts, activeCategory, activeSubtopic]
  );

  const featured = filteredPosts[0];
  const rest = filteredPosts.slice(1);

  const sharePost = async (post: BlogPost) => {
    const url = `${window.location.origin}/blog#${post.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt || '', url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  if (selectedPost) {
    const links = Array.isArray(selectedPost.links) ? selectedPost.links : [];
    const highlights = Array.isArray(selectedPost.highlights) ? selectedPost.highlights : [];
    const dateStr = new Date(selectedPost.published_at || selectedPost.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return (
      <MainLayout>
        <article className="relative">
          {/* Hero */}
          <div className="relative">
            {selectedPost.cover_image_url ? (
              <div className="relative h-[42vh] sm:h-[60vh] overflow-hidden">
                <motion.img
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2 }}
                  src={selectedPost.cover_image_url}
                  alt={selectedPost.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
              </div>
            ) : (
              <div className="h-32" />
            )}

            <div className="container mx-auto px-4 -mt-24 sm:-mt-40 relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)} className="mb-5 -ml-3">
                  <ArrowLeft className="w-4 h-4 mr-2" />Back to Blog
                </Button>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {selectedPost.category && <Badge className="bg-primary/15 border-primary/30 text-primary"><Tag className="w-3 h-3 mr-1" />{selectedPost.category}</Badge>}
                  {selectedPost.subtopic && <Badge variant="outline">{selectedPost.subtopic}</Badge>}
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5 tracking-tight">
                  {selectedPost.title}
                </h1>
                {selectedPost.excerpt && (
                  <p className="text-lg sm:text-xl text-foreground/75 leading-relaxed mb-6">{selectedPost.excerpt}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border/60 pt-5">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-primary" />{selectedPost.author_name}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{dateStr}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{readTime(selectedPost.content)} min read</span>
                  <Button variant="ghost" size="sm" onClick={() => sharePost(selectedPost)} className="ml-auto h-8">
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />Share
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Body */}
          <div className="container mx-auto px-4 py-10 sm:py-16">
            <div className="grid lg:grid-cols-[1fr_320px] gap-10 max-w-6xl mx-auto">
              <div className="min-w-0">
                {highlights.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-6 mb-10">
                    <h3 className="flex items-center gap-2 font-semibold mb-4 text-base"><Sparkles className="w-4 h-4 text-primary" />Highlights from this article</h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {highlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="mt-1 text-primary font-bold">→</span>
                          <span className="text-foreground/85">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <RichContent content={selectedPost.content} />

                {links.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 pt-8 border-t border-border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg"><ExternalLink className="w-4 h-4" />Resources & Links</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {links.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <span className="text-sm font-medium truncate">{l.label}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:sticky lg:top-24 self-start space-y-6">
                <Card className="glass-card">
                  <CardContent className="p-5">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">About the author</h4>
                    <p className="font-semibold text-base">{selectedPost.author_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Official Esports & Competitive Gaming Insights</p>
                    <div className="mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                      <p>Updated {dateStr}</p>
                      <p>{readTime(selectedPost.content)} min read</p>
                    </div>
                  </CardContent>
                </Card>

                {rest.length > 0 && (
                  <Card className="glass-card">
                    <CardContent className="p-5">
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Continue reading</h4>
                      <div className="space-y-3">
                        {rest.slice(0, 3).map(p => (
                          <button key={p.id} onClick={() => setSelectedPost(p)} className="text-left w-full group">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{p.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{readTime(p.content)} min read</p>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>
            </div>
          </div>
        </article>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 sm:mb-14">
          <Badge className="mb-4 bg-primary/10 border-primary/30 text-primary">THRYLOS Editorial</Badge>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="gradient-text">THRYLOS Blogs</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Long-form esports guides, tournament insights, and competitive gaming knowledge curated by the Thrylos editorial team.
          </p>
        </motion.div>

        {categories.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 mb-4">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setActiveCategory(cat); setActiveSubtopic('All'); }}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </motion.div>
        )}
        {subtopics.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap justify-center gap-1.5 mb-12">
            {subtopics.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubtopic(sub)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${activeSubtopic === sub ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
              >
                {sub === 'All' ? '# All topics' : `# ${sub}`}
              </button>
            ))}
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20"><p className="text-muted-foreground">No posts here yet. Check back soon!</p></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {featured && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
                  <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer overflow-hidden group" onClick={() => setSelectedPost(featured)}>
                    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-0">
                      {featured.cover_image_url && (
                        <div className="aspect-[16/10] lg:aspect-auto overflow-hidden relative">
                          <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
                          <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur border-primary/40 text-primary">Featured</Badge>
                        </div>
                      )}
                      <CardContent className="p-6 sm:p-10 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {featured.category && <Badge variant="secondary"><Tag className="w-3 h-3 mr-1" />{featured.category}</Badge>}
                          {featured.subtopic && <Badge variant="outline">{featured.subtopic}</Badge>}
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight">{featured.title}</h2>
                        <p className="text-muted-foreground mb-6 line-clamp-3 text-sm sm:text-base leading-relaxed">{featured.excerpt || featured.content.substring(0, 220)}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{featured.author_name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(featured.published_at || featured.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{readTime(featured.content)} min</span>
                          <span className="ml-auto text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read article <ArrowRight className="w-3.5 h-3.5" /></span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              )}

              {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer group h-full overflow-hidden flex flex-col" onClick={() => setSelectedPost(post)}>
                        {post.cover_image_url ? (
                          <div className="aspect-video overflow-hidden relative">
                            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                            <Tag className="w-10 h-10 text-primary/40" />
                          </div>
                        )}
                        <CardContent className="p-5 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap text-xs text-muted-foreground">
                            <span>{post.author_name}</span>
                            <span>•</span>
                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span>•</span>
                            <span>{readTime(post.content)} min read</span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{post.title}</h2>
                          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4 leading-relaxed">{post.excerpt || post.content.substring(0, 160)}</p>
                          <div className="flex items-center gap-2 mt-auto">
                            {post.category && <Badge variant="secondary" className="text-[10px]"><Tag className="w-2.5 h-2.5 mr-1" />{post.category}</Badge>}
                            {post.subtopic && <Badge variant="outline" className="text-[10px]">{post.subtopic}</Badge>}
                            <span className="ml-auto text-xs text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read <ArrowRight className="w-3 h-3" /></span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </MainLayout>
  );
};

export default Blog;
