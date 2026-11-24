'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlogPost, ArticleStatus } from '@/types/blog';
import { CATEGORIES } from '@/data/categories';
import { TipTapEditor } from '@/components/TipTapEditor';
import { useToast } from '@/context/ToastContext';
import { ClientStorage } from '@/lib/client-storage';
import { formatDate, formatDateDDMMYYYY, parseDate } from '@/lib/date-utils';
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  Sparkles,
  Lock,
  Upload,
  Check,
  User,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Layers,
  Search,
  History
} from 'lucide-react';

interface BlogEditorClientProps {
  initialPost?: BlogPost;
  isEditing?: boolean;
}

function toInputDateFormat(dateStr?: string): string {
  if (!dateStr) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatHumanDate(dateStr?: string): string {
  if (!dateStr) return 'Not selected';
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isBackdated(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() < todayStart.getTime();
}

export function BlogEditorClient({ initialPost, isEditing = false }: BlogEditorClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialPost?.title || '');
  const [subtitle, setSubtitle] = useState(initialPost?.subtitle || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [category, setCategory] = useState<string>(initialPost?.category || 'Personal Finance');
  const [subcategory, setSubcategory] = useState<string>(initialPost?.subcategory || '');
  const [tagsInput, setTagsInput] = useState(initialPost?.tags?.join(', ') || 'Wealth, Discipline');
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || '/images/financial-independence.svg');
  const [coverCaption, setCoverCaption] = useState(initialPost?.coverCaption || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [authorName, setAuthorName] = useState(initialPost?.author?.name || 'Gaurav Kumar Singh');
  const [authorRole, setAuthorRole] = useState(initialPost?.author?.role || 'Founder & Managing Editor');
  const [authorAvatar, setAuthorAvatar] = useState(initialPost?.author?.avatar ?? '/images/gaurav-kumar-singh.jpg');
  const [authorBio, setAuthorBio] = useState(initialPost?.author?.bio || 'Writer focused on personal finance systems, insurance awareness, and behavioural economics.');
  const [showAuthorPhoto, setShowAuthorPhoto] = useState(initialPost?.author?.showPhoto !== false);
  const [status, setStatus] = useState<ArticleStatus>(initialPost?.status || 'published');
  const [featured, setFeatured] = useState(Boolean(initialPost?.featured));
  const [editorsPick, setEditorsPick] = useState(Boolean(initialPost?.editorsPick));
  const [scheduledAt, setScheduledAt] = useState(initialPost?.scheduledAt || '');
  const [publishedAt, setPublishedAt] = useState<string>(() => {
    return toInputDateFormat(initialPost?.publishedAt);
  });

  // SEO
  const [metaTitle, setMetaTitle] = useState(initialPost?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialPost?.seo?.metaDescription || '');

  const handleQuickDate = (preset: 'today' | 'yesterday' | '2024' | '2023' | '2022' | '2021' | '2020') => {
    const today = new Date();
    if (preset === 'today') {
      setPublishedAt(toInputDateFormat());
    } else if (preset === 'yesterday') {
      const y = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      setPublishedAt(toInputDateFormat(y.toISOString()));
    } else {
      setPublishedAt(`${preset}-01-15`);
    }
  };

  useEffect(() => {
    setIsAuthenticated(ClientStorage.isAdminAuthenticated());
    if (initialPost) {
      const custom = ClientStorage.getCustomBlog(initialPost.id || initialPost.slug);
      if (custom) {
        setTitle(custom.title || '');
        setSubtitle(custom.subtitle || '');
        setSlug(custom.slug || '');
        setCategory(custom.category || 'Personal Finance');
        setSubcategory(custom.subcategory || '');
        setTagsInput(custom.tags?.join(', ') || '');
        setCoverImage(custom.coverImage || '/images/financial-independence.svg');
        setCoverCaption(custom.coverCaption || '');
        setExcerpt(custom.excerpt || '');
        setContent(custom.content || '');
        if (custom.author) {
          setAuthorName(custom.author.name || 'Gaurav Kumar Singh');
          setAuthorRole(custom.author.role || 'Founder & Managing Editor');
          setAuthorAvatar(custom.author.avatar || '/images/gaurav-kumar-singh.jpg');
          setAuthorBio(custom.author.bio || '');
          setShowAuthorPhoto(custom.author.showPhoto !== false);
        }
        setStatus(custom.status || 'published');
        setFeatured(Boolean(custom.featured));
        setEditorsPick(Boolean(custom.editorsPick));
        if (custom.publishedAt) setPublishedAt(toInputDateFormat(custom.publishedAt));
        if (custom.scheduledAt) setScheduledAt(custom.scheduledAt);
        if (custom.seo) {
          setMetaTitle(custom.seo.metaTitle || '');
          setMetaDescription(custom.seo.metaDescription || '');
        }
      }
    }
  }, [initialPost]);

  // Selected category info
  const selectedCatObj = CATEGORIES.find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  }, [title, isEditing]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Uploading cover image...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setCoverImage(data.url);
        showToast('Cover image updated!', 'success');
      }
    } catch {
      showToast('Image upload failed', 'error');
    }
  };

  const handleAuthorAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Uploading author photo...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setAuthorAvatar(data.url);
        setShowAuthorPhoto(true);
        showToast('Author photo updated!', 'success');
      }
    } catch {
      showToast('Photo upload failed', 'error');
    }
  };

  const handleSave = async (targetStatus?: ArticleStatus) => {
    if (!title.trim()) {
      showToast('Please provide an article title.', 'error');
      return;
    }

    setSaving(true);
    const finalStatus = targetStatus || status;

    // Word count & reading time calculation
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${estMinutes} min read`;

    const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const postPayload: Partial<BlogPost> = {
      title,
      subtitle: subtitle.trim() || undefined,
      slug: slug.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      tags: tagsArray,
      coverImage,
      coverCaption: coverCaption.trim() || undefined,
      excerpt,
      content,
      readTime,
      status: finalStatus,
      featured,
      editorsPick,
      publishedAt: formatDateDDMMYYYY(publishedAt),
      scheduledAt: finalStatus === 'scheduled' ? scheduledAt : undefined,
      author: {
        name: authorName,
        avatar: authorAvatar,
        role: authorRole,
        bio: authorBio,
        showPhoto: showAuthorPhoto,
      },
      seo: {
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        canonicalUrl: `https://themindupgrade.in/blog/${slug.trim()}`,
      },
    };

    try {
      const url = isEditing && initialPost ? `/api/blogs/${initialPost.id}` : '/api/blogs';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json().catch(() => null);

      // Persist permanently in ClientStorage so edits survive AWS Amplify cold starts and page refreshes
      const savedRecord: BlogPost = {
        ...(initialPost || {}),
        ...postPayload,
        id: (data && data.id) || (initialPost && initialPost.id) || String(Date.now()),
      } as BlogPost;
      ClientStorage.saveBlog(savedRecord);

      if (res.ok) {
        setLastAutosave(new Date().toLocaleTimeString());
        showToast(
          isEditing ? 'Article updated successfully!' : 'Article created successfully!',
          'success'
        );
        router.push('/admin');
      } else {
        // Fallback: Even if server returned error (e.g. read-only filesystem), local save succeeded
        setLastAutosave(new Date().toLocaleTimeString());
        showToast('Article saved to your browser storage!', 'success');
        router.push('/admin');
      }
    } catch {
      // Fallback for network issues
      const savedRecord: BlogPost = {
        ...(initialPost || {}),
        ...postPayload,
        id: (initialPost && initialPost.id) || String(Date.now()),
      } as BlogPost;
      ClientStorage.saveBlog(savedRecord);
      showToast('Article saved locally (offline mode)', 'success');
      router.push('/admin');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-amberBrand mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-navy-800 dark:text-offwhite">
          Admin Authentication Required
        </h2>
        <p className="text-xs text-charcoal-500">
          Please log into the Admin Portal before editing articles.
        </p>
        <Link
          href="/admin"
          className="inline-block px-5 py-2.5 rounded-xl bg-navy-800 text-white font-bold text-xs shadow-md"
        >
          Go to Admin Login &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-700 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy-800 dark:text-offwhite">
              {isEditing ? `Edit Article: ${title || 'Untitled'}` : 'Write New Publication'}
            </h1>
            <p className="text-xs text-charcoal-500 dark:text-slate-400">
              {lastAutosave ? `Last saved at ${lastAutosave}` : 'Draft autosave enabled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? 'Publishing...' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Writing Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slateBrand dark:text-slate-400 uppercase tracking-wider">
              Article Headline *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The 50/30/20 Rule: A Practical Guide to Building Long-Term Wealth"
              className="w-full font-serif text-xl sm:text-2xl font-bold p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
            />
          </div>

          {/* Subtitle / Excerpt */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slateBrand dark:text-slate-400 uppercase tracking-wider">
              Subtitle / Lead Excerpt
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A concise, high-leverage summary that hooks thoughtful readers..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
            />
          </div>

          {/* Rich Content Editor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slateBrand dark:text-slate-400 uppercase tracking-wider">
              Publication Body (TipTap Rich Text)
            </label>
            <TipTapEditor content={content} onChange={setContent} />
          </div>

          {/* SEO Meta Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-2">
              <Search className="w-4 h-4 text-amberBrand" />
              <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite">
                Search Engine Optimization (SEO) Metadata
              </h3>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Custom SEO Title (defaults to article headline if empty)"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              />
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta Description (150–160 characters for Google Search snippets)"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings Column (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Publication Status & Visibility */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-editorial">
            <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Publishing Controls
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Article Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_review">In Review</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {status === 'scheduled' && (
                <div>
                  <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                    Scheduled Publish Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-navy-700 text-amberBrand"
                  />
                  <span className="font-medium text-navy-800 dark:text-offwhite">Featured Article</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={editorsPick}
                    onChange={(e) => setEditorsPick(e.target.checked)}
                    className="rounded border-navy-700 text-amberBrand"
                  />
                  <span className="font-medium text-navy-800 dark:text-offwhite">Editor&apos;s Pick</span>
                </label>
              </div>
            </div>
          </div>

          {/* Manual Date & WordPress Backdating */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-editorial">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amberBrand" />
                <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite">
                  Publication Date
                </h3>
              </div>
              {isBackdated(publishedAt) ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amberBrand/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Backdated</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                  Current
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Select or Enter Date
                </label>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand cursor-pointer"
                />
              </div>

              {/* Formatted Date Preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-100 dark:border-navy-800/80 text-xs flex items-center justify-between">
                <span className="text-charcoal-500 dark:text-slate-400 text-[11px]">Displays on site:</span>
                <span className="font-bold text-navy-800 dark:text-offwhite text-[11px]">
                  {formatDate(publishedAt)}
                </span>
              </div>

              {/* Quick Preset Buttons for Fast Backdating */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDate('today')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('yesterday')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('2024')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    2024
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('2023')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    2023
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('2022')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    2022
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('2021')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    2021
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate('2020')}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-navy-800 hover:bg-amberBrand hover:text-navy-950 text-charcoal-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    2020
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Taxonomy: Category & Subcategory */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-editorial">
            <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Domain &amp; Taxonomy
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory('');
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCatObj && selectedCatObj.subcategories.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                    Subcategory
                  </label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite"
                  >
                    <option value="">Select Subcategory (Optional)</option>
                    {selectedCatObj.subcategories.map((sub) => (
                      <option key={sub.slug} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Budgeting, Wealth, Mental Models"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-mono text-navy-800 dark:text-offwhite"
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-editorial">
            <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Featured Media
            </h3>

            <div className="space-y-2">
              <div className="h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-slate-300 dark:border-navy-700 text-xs font-bold text-slateBrand hover:text-amberBrand cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Cover Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={coverCaption}
                onChange={(e) => setCoverCaption(e.target.value)}
                placeholder="Optional image caption..."
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-[11px] text-navy-800 dark:text-offwhite"
              />
            </div>
          </div>

          {/* Author & Bylines */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-editorial">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-2">
              <User className="w-4 h-4 text-amberBrand" />
              <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite">
                Author &amp; Bylines
              </h3>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Author Role
                </label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Author Bio
                </label>
                <textarea
                  rows={2}
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={showAuthorPhoto}
                    onChange={(e) => setShowAuthorPhoto(e.target.checked)}
                    className="rounded border-navy-700 text-amberBrand"
                  />
                  <span className="font-medium text-navy-800 dark:text-offwhite">Show Photo</span>
                </label>
                <label className="text-[11px] font-bold text-amberBrand hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Upload Avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAuthorAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
