'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlogPost, Comment } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { ShareModal } from '@/components/ShareModal';
import {
  Clock,
  Heart,
  Bookmark,
  Share2,
  List,
  MessageSquare,
  Send,
  ArrowLeft,
  Copy,
  ChevronUp,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Eye
} from 'lucide-react';

interface BlogPostClientViewProps {
  post: BlogPost | null;
  slug?: string;
  relatedPosts: BlogPost[];
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function BlogPostClientView({
  post: initialPost,
  slug = '',
  relatedPosts: initialRelated,
}: BlogPostClientViewProps) {
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>(initialRelated);
  const [loading, setLoading] = useState(!initialPost);
  const [notFound, setNotFound] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const admin = ClientStorage.isAdminAuthenticated();
    setIsAdmin(admin);

    const targetKey = slug || initialPost?.slug || initialPost?.id || '';
    const decodedKey = decodeURIComponent(targetKey).toLowerCase().trim();

    // 1. Check custom blogs from ClientStorage
    const custom = ClientStorage.getCustomBlog(targetKey) || 
      (initialPost ? ClientStorage.getCustomBlog(initialPost.id || initialPost.slug) : undefined);

    if (custom) {
      setPost({
        ...custom,
        views: typeof initialPost?.views === 'number' ? initialPost.views : (custom.views || 0),
        likes: typeof initialPost?.likes === 'number' ? initialPost.likes : (custom.likes || 0),
      });
      setNotFound(false);
      setLoading(false);
    } else if (initialPost) {
      if (initialPost.status === 'draft' && !admin) {
        setNotFound(true);
      } else {
        setPost(initialPost);
        setNotFound(false);
      }
      setLoading(false);
    } else {
      // 2. Check merged blogs in ClientStorage
      const merged = ClientStorage.getMergedBlogs();
      const match = merged.find((b) => {
        const bSlug = (b.slug || '').toLowerCase().trim();
        const bId = (b.id || '').toLowerCase().trim();
        return bSlug === decodedKey || bId === decodedKey;
      });

      if (match) {
        if (match.status === 'draft' && !admin) {
          setNotFound(true);
        } else {
          setPost(match);
          setNotFound(false);
        }
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }

    const mergedRelated = ClientStorage.getMergedBlogs(initialRelated);
    setRelatedPosts(mergedRelated);
  }, [initialPost, initialRelated, slug]);

  const [likes, setLikes] = useState(initialPost?.likes || 0);
  const [views, setViews] = useState(initialPost?.views || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Newsletter in post
  const [inlineEmail, setInlineEmail] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { showToast } = useToast();

  // Scroll Progress and Back-to-Top
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
      setShowBackToTop(window.scrollY > 400);

      // Detect active TOC heading
      const headingElements = document.querySelectorAll('.prose-editorial h2, .prose-editorial h3');
      let currentActive = '';
      headingElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          currentActive = el.id;
        }
      });
      if (currentActive) setActiveTocId(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize storage states & fetch comments
  useEffect(() => {
    if (!post) return;
    setLikes(post.likes || 0);
    setViews(post.views || 0);
    setHasLiked(ClientStorage.isLiked(post.slug));
    setIsBookmarked(ClientStorage.isBookmarked(post.slug));

    // Register view count on read
    fetch(`/api/blogs/${post.id}/view`, { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.views === 'number') {
          setViews(data.views);
          setPost((prev) => (prev ? { ...prev, views: data.views } : prev));
        }
      })
      .catch(() => {});

    // Fetch comments
    fetch(`/api/comments?postSlug=${post.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {});
  }, [post?.id, post?.slug]);

  // Extract Table of Contents from HTML
  useEffect(() => {
    if (!post || !post.content || typeof window === 'undefined') return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const items: TocItem[] = [];

    headings.forEach((heading, idx) => {
      const text = heading.textContent || '';
      const id = `section-${idx}`;
      items.push({
        id,
        text,
        level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3,
      });
    });

    setToc(items);
  }, [post?.content]);

  // Assign IDs to headings in actual rendered DOM
  useEffect(() => {
    if (!post || !post.content) return;
    const headingElements = document.querySelectorAll('.prose-editorial h2, .prose-editorial h3');
    headingElements.forEach((heading, idx) => {
      heading.id = `section-${idx}`;
    });
  }, [post?.content]);

  // Like handler
  const handleLike = async () => {
    if (!post) return;
    if (hasLiked) {
      const removed = ClientStorage.removeLikedPost(post.slug);
      if (removed) {
        setHasLiked(false);
        setLikes((prev) => Math.max(0, prev - 1));
        showToast('Like removed', 'info');
        try {
          const res = await fetch(`/api/blogs/${post.id}/like`, { method: 'DELETE' });
          if (res.ok) {
            const data = await res.json();
            if (typeof data.likes === 'number') {
              setLikes(data.likes);
              setPost((prev) => (prev ? { ...prev, likes: data.likes } : prev));
            }
          }
        } catch {}
      }
      return;
    }

    const added = ClientStorage.addLikedPost(post.slug);
    if (added) {
      setHasLiked(true);
      setLikes((prev) => prev + 1);
      showToast('Thank you for appreciating this publication!', 'success');
      try {
        const res = await fetch(`/api/blogs/${post.id}/like`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likes === 'number') {
            setLikes(data.likes);
            setPost((prev) => (prev ? { ...prev, likes: data.likes } : prev));
          }
        }
      } catch {}
    }
  };

  // Bookmark handler
  const handleBookmark = () => {
    if (!post) return;
    const updated = ClientStorage.toggleBookmark(post.slug);
    setIsBookmarked(updated);
    showToast(
      updated ? 'Article saved to your personal library' : 'Removed from bookmarks',
      updated ? 'success' : 'info'
    );
  };

  // Copy URL
  const handleCopyUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Article link copied to clipboard!', 'success');
    }
  };

  // Social Shares
  const handleShareTwitter = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`"${post.title}" via @TheMindUpgrade`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`"${post.title}" - Read on The Mind Upgrade: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareInstagram = () => {
    setIsShareModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Comment Submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    if (!commentText.trim()) {
      showToast('Please enter your comment.', 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSlug: post.slug,
          authorName: commentName.trim() || 'Mindful Reader',
          authorEmail: commentEmail.trim() || undefined,
          content: commentText.trim(),
        }),
      });
      const newComment = await res.json();
      if (newComment.id) {
        setComments((prev) => [newComment, ...prev]);
        setCommentText('');
        showToast('Comment submitted for moderation!', 'success');
      }
    } catch {
      showToast('Failed to submit comment. Please try again.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-28 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-amberBrand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-charcoal-600 dark:text-slate-400">Loading publication...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container-custom py-24 sm:py-32 text-center max-w-xl mx-auto space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amberBrand/10 text-amberBrand flex items-center justify-center mx-auto border border-amberBrand/30 shadow-md">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-navy-800 dark:text-offwhite">
          Idea Node Not Found
        </h1>
        <p className="text-sm text-charcoal-600 dark:text-slate-300 leading-relaxed">
          The publication you are looking for has been moved, renamed, or is currently unpublished.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-amberBrand text-navy-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-xs"
          >
            Return to Homepage
          </Link>
          <Link
            href="/categories"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-navy-800 dark:text-offwhite font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Browse Categories
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-navy-800 text-amberBrand font-bold text-xs hover:bg-navy-700 transition-colors"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 5.4.1: Reading Progress Bar at the top of viewport */}
      <div
        className="fixed top-0 left-0 h-1 bg-amberBrand z-[999] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {post.status === 'draft' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2">
          <span>⚠️ Unpublished Draft Preview (visible only to Administrator)</span>
          <Link href={`/admin/edit/${post.id}`} className="underline hover:text-amber-600">
            Edit Article
          </Link>
        </div>
      )}

      <article className="container-custom py-6 sm:py-10 space-y-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between text-xs text-charcoal-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-amberBrand transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/categories/${post.category.toLowerCase().replace(/[\s_]+/g, '-')}`} className="hover:text-amberBrand transition-colors">
              {post.category}
            </Link>
            {post.subcategory && (
              <>
                <span>/</span>
                <Link
                  href={`/categories/${post.category.toLowerCase().replace(/[\s_]+/g, '-')}?sub=${post.subcategory.toLowerCase().replace(/[\s_]+/g, '-')}`}
                  className="text-navy-800 dark:text-slate-200 font-medium hover:text-amberBrand transition-colors"
                >
                  {post.subcategory}
                </Link>
              </>
            )}
          </div>

          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1 hover:text-amberBrand transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Articles</span>
          </Link>
        </div>

        {/* 5.1: Article Header */}
        <header className="space-y-4 max-w-4xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slateBrand/10 text-slateBrand dark:text-amberBrand text-xs font-bold uppercase tracking-wider">
            <Link
              href={`/categories/${post.category.toLowerCase().replace(/[\s_]+/g, '-')}`}
              className="hover:underline"
            >
              {post.category}
            </Link>
            {post.subcategory && (
              <>
                <span>•</span>
                <Link
                  href={`/categories/${post.category.toLowerCase().replace(/[\s_]+/g, '-')}?sub=${post.subcategory.toLowerCase().replace(/[\s_]+/g, '-')}`}
                  className="hover:underline"
                >
                  {post.subcategory}
                </Link>
              </>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-navy-800 dark:text-offwhite tracking-tight leading-[1.15]">
            {post.title}
          </h1>

          {(post.subtitle || post.excerpt) && (
            <p className="font-sans text-base sm:text-xl text-charcoal-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed italic">
              {post.subtitle || post.excerpt}
            </p>
          )}

          {/* Table of Contents for Mobile View (Directly below Subtitle/Lead Excerpt) */}
          {toc.length > 0 && (
            <div className="block lg:hidden my-6 text-left max-w-2xl mx-auto">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4 text-amberBrand shrink-0" />
                    <h4 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite uppercase tracking-wider">
                      Table of Contents
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-slateBrand dark:text-slate-400">
                    {toc.length} {toc.length === 1 ? 'section' : 'sections'}
                  </span>
                </div>
                <nav className="space-y-1.5 max-h-64 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin text-xs">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1 transition-colors break-words ${
                        item.level === 3 ? 'pl-3 text-[11px]' : 'font-semibold'
                      } ${
                        activeTocId === item.id
                          ? 'text-amberBrand font-bold border-l-2 border-amberBrand pl-2'
                          : 'text-charcoal-600 dark:text-slate-400 hover:text-navy-800 dark:hover:text-offwhite'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Author Metadata Bar */}
          <div className="pt-4 pb-2 border-t border-b border-slate-200 dark:border-navy-700 flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal-500 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              {post.author.showPhoto !== false && post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full border border-amberBrand/40 bg-navy-800 object-cover"
                />
              )}
              <div className="text-left">
                <span className="block font-bold text-navy-800 dark:text-offwhite text-sm">
                  {post.author.name}
                </span>
                <span className="text-[11px] text-slateBrand dark:text-slate-400">
                  {post.author.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amberBrand" />
                <span>Published {formatDateDDMMYYYY(post.publishedAt)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amberBrand" />
                <span>{post.readTime}</span>
              </span>
              <span>•</span>
              <span
                className="flex items-center gap-1.5 font-bold text-navy-800 dark:text-offwhite bg-slate-100 dark:bg-navy-800 px-3 py-1 rounded-full border border-slate-200 dark:border-navy-700 text-xs"
                title="Total views"
              >
                <Eye className="w-3.5 h-3.5 text-amberBrand" />
                <span>{views} {views === 1 ? 'View' : 'Views'}</span>
              </span>
              <span>•</span>
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  hasLiked
                    ? 'bg-rose-500/15 text-rose-600 border-rose-500/40 shadow-xs'
                    : 'bg-slate-100 dark:bg-navy-800 text-charcoal-600 dark:text-slate-300 hover:text-rose-600 border-slate-200 dark:border-navy-700'
                }`}
                title="Like article"
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors cursor-pointer font-bold"
                title="Share article"
                aria-label="Share article"
              >
                <Share2 className="w-3.5 h-3.5 text-amberBrand" />
                <span>Share</span>
              </button>
            </div>
          </div>

        </header>

        {/* Featured Cover Image */}
        <figure className="max-w-4xl mx-auto space-y-2">
          <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 shadow-editorial">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto max-h-[520px] object-cover"
            />
          </div>
          {post.coverCaption && (
            <figcaption className="text-center text-xs text-charcoal-500 dark:text-slate-400 italic">
              {post.coverCaption}
            </figcaption>
          )}
        </figure>

        {/* 5.2: 2-Column Editorial Layout (Left Sticky Sidebar Cards + Right Reading Column) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl mx-auto">
          
          {/* Left Sticky Sidebar (approx 300px width) - Table of Contents, Author & Related Reading */}
          <aside className="lg:col-span-4 space-y-6 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">

              {/* 5.4.2 & 5.4.3: Table of Contents (Desktop Sticky Sidebar) */}
              {toc.length > 0 && (
                <div className="hidden lg:block p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-2">
                    <List className="w-4 h-4 text-amberBrand shrink-0" />
                    <h4 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite uppercase tracking-wider">
                      Table of Contents
                    </h4>
                  </div>
                  <nav className="space-y-1.5 max-h-72 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin text-xs">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block py-1 transition-colors break-words ${
                          item.level === 3 ? 'pl-3 text-[11px]' : 'font-semibold'
                        } ${
                          activeTocId === item.id
                            ? 'text-amberBrand font-bold border-l-2 border-amberBrand pl-2'
                            : 'text-charcoal-600 dark:text-slate-400 hover:text-navy-800 dark:hover:text-offwhite'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Author Card Mini */}
              <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-3">
                <div className="flex items-center gap-3">
                  {post.author.showPhoto !== false && post.author.avatar && (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-12 h-12 rounded-full border border-amberBrand/50 bg-navy-800 object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite">
                      {post.author.name}
                    </h4>
                    <span className="text-[11px] text-amberBrand font-medium">{post.author.role}</span>
                  </div>
                </div>
                <p className="text-xs text-charcoal-500 dark:text-slate-400 leading-relaxed">
                  Passionate about bringing clarity to personal finance, insurance laws, and cognitive models.
                </p>
              </div>

              {/* Related Articles Mini-List */}
              {relatedPosts.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
                    <h4 className="font-serif text-xs font-bold text-navy-800 dark:text-offwhite uppercase tracking-wider">
                      Related Reading
                    </h4>
                    <Sparkles className="w-3.5 h-3.5 text-amberBrand shrink-0" />
                  </div>
                  <div className="space-y-3">
                    {relatedPosts.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/blog/${rel.slug}`}
                        className="block group"
                      >
                        <span className="text-[10px] font-bold text-slateBrand dark:text-amberBrand uppercase">
                          {rel.category}
                        </span>
                        <h5 className="font-serif text-xs font-bold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors line-clamp-2 leading-snug mt-0.5">
                          {rel.title}
                        </h5>
                        <span className="text-[10px] text-charcoal-500 dark:text-slate-400 mt-0.5 block">
                          {rel.readTime}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </aside>

          {/* Main Reading Column (approx 740px width) - Right Side */}
          <main className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            
            {/* Rich Content Area */}
            <div
              className="prose-editorial"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags Strip */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-6 border-t border-slate-200 dark:border-navy-700 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-charcoal-500 dark:text-slate-400 mr-1">
                  Topics:
                </span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand border border-slate-200 dark:border-navy-700 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 5.5: Appreciation & Social Share Bar */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    hasLiked
                      ? 'bg-rose-500/15 text-rose-600 border-rose-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-rose-600 border-slate-200 dark:border-navy-700'
                  }`}
                  aria-label="Appreciate article"
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                  <span>{likes} {likes === 1 ? 'Appreciation' : 'Appreciations'}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'bg-amberBrand text-navy-950 border-amberBrand'
                      : 'bg-slate-50 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                  }`}
                  title="Bookmark article"
                  aria-label="Bookmark article"
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Share Suite */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-charcoal-500 dark:text-slate-400 mr-1">Share:</span>
                <button
                  onClick={handleShareWhatsApp}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.144 4.178 4.287-1.123z"/></svg>
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:text-amberBrand transition-colors cursor-pointer"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors cursor-pointer"
                  title="Share on LinkedIn"
                  aria-label="Share on LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </button>
                <button
                  onClick={handleShareFacebook}
                  className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-[#1877F2] transition-colors cursor-pointer"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.82 0-1.611.162-2.007.606-.396.444-.45 1.149-.45 2.115v1.264h4.354l-.57 3.667h-3.784v7.98c5.44-.757 9.61-5.438 9.61-11.085C24 6.012 18.627.639 12 .639S0 6.012 0 12.606c0 5.647 4.17 10.328 9.101 11.085z"/></svg>
                </button>
                <button
                  onClick={handleShareInstagram}
                  className="p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 transition-colors cursor-pointer"
                  title="Share on Instagram"
                  aria-label="Share on Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </button>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-2.5 py-2 rounded-lg bg-amberBrand/15 hover:bg-amberBrand/25 text-amberBrand text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="All Sharing Options"
                  aria-label="All Sharing Options"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>All</span>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors cursor-pointer"
                  title="Copy link"
                  aria-label="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors cursor-pointer"
                  title="Print Article"
                  aria-label="Print article"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 5.4.12: Author Biography Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {post.author.showPhoto !== false && post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full border-2 border-amberBrand/50 bg-navy-800 object-cover shrink-0"
                />
              )}
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">
                    {post.author.name}
                  </h3>
                  <span className="text-xs text-amberBrand font-semibold">{post.author.role}</span>
                </div>
                <p className="text-xs sm:text-sm text-charcoal-600 dark:text-slate-300 leading-relaxed">
                  {post.author.bio ||
                    'Founder and Managing Editor of The Mind Upgrade. Writing on personal finance systems, insurance awareness, behavioral psychology, and everyday knowledge.'}
                </p>
              </div>
            </div>

            {/* 5.5: Comments Section */}
            <section className="space-y-6 pt-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-700 pb-3">
                <MessageSquare className="w-5 h-5 text-amberBrand" />
                <h3 className="font-serif text-xl font-bold text-navy-800 dark:text-offwhite">
                  Reader Discussion ({comments.length})
                </h3>
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleCommentSubmit} className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3.5 py-2 text-xs text-charcoal-900 dark:text-white placeholder-charcoal-500 focus:outline-none focus:border-amberBrand"
                  />
                  <input
                    type="email"
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    placeholder="Your Email (Kept Private)"
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl px-3.5 py-2 text-xs text-charcoal-900 dark:text-white placeholder-charcoal-500 focus:outline-none focus:border-amberBrand"
                  />
                </div>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your perspective or ask a clarifying question..."
                  required
                  className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 text-xs text-charcoal-900 dark:text-white placeholder-charcoal-500 focus:outline-none focus:border-amberBrand"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-5 py-2 bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Post Comment</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Comment list */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-charcoal-500 italic py-4 text-center">
                    No comments yet. Be the first to share your thoughts on this article.
                  </p>
                ) : (
                  comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-navy-800 dark:text-offwhite">{comm.authorName}</span>
                        <span className="text-charcoal-500 text-[11px]">{comm.createdAt}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-charcoal-700 dark:text-slate-300 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

          </main>

        </div>

      </article>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 shadow-editorial-hover z-50 transition-all hover:scale-110 cursor-pointer"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{
          title: post.title,
          slug: post.slug,
          coverImage: post.coverImage,
          category: post.category,
          readTime: post.readTime,
        }}
      />
    </>
  );
}
