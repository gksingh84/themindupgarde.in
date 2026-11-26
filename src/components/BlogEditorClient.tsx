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
  initialPost?: BlogPost | null;
  isEditing?: boolean;
  postId?: string;
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

/**
 * Resizes and compresses an image file to a lightweight data URL for instant preview and offline persistence.
 */
function optimizeImageFile(file: File, maxWidth = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function BlogEditorClient({ initialPost, isEditing = false, postId }: BlogEditorClientProps) {
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
  const initialTags = Array.isArray(initialPost?.tags)
    ? initialPost.tags.join(', ')
    : typeof initialPost?.tags === 'string'
      ? initialPost.tags
      : 'Wealth, Discipline';
  const [tagsInput, setTagsInput] = useState(initialTags);
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || '/images/financial-independence.svg');
  const [coverCaption, setCoverCaption] = useState(initialPost?.coverCaption || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [authorName, setAuthorName] = useState(initialPost?.author?.name || 'Gaurav Kumar Singh');
  const [authorRole, setAuthorRole] = useState(initialPost?.author?.role || 'Founder & Author');
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
    const lookupKey = postId || (initialPost ? initialPost.id || initialPost.slug : '');
    const custom = lookupKey ? ClientStorage.getCustomBlog(lookupKey) : null;
    const post = custom || initialPost;

    if (post) {
      setTitle(post.title || '');
      setSubtitle(post.subtitle || '');
      setSlug(post.slug || '');
      setCategory(post.category || 'Personal Finance');
      setSubcategory(post.subcategory || '');
      const postTags = Array.isArray(post.tags)
        ? post.tags.join(', ')
        : typeof post.tags === 'string'
          ? post.tags
          : '';
      setTagsInput(postTags);
      setCoverImage(post.coverImage || '/images/financial-independence.svg');
      setCoverCaption(post.coverCaption || '');
      setExcerpt(post.excerpt || '');
      setContent(post.content || '');
      if (post.author && typeof post.author === 'object') {
        setAuthorName(post.author.name || 'Gaurav Kumar Singh');
        setAuthorRole(post.author.role || 'Founder & Author');
        setAuthorAvatar(post.author.avatar || '/images/gaurav-kumar-singh.jpg');
        setAuthorBio(post.author.bio || '');
        setShowAuthorPhoto(post.author.showPhoto !== false);
      }
      setStatus(post.status || 'published');
      setFeatured(Boolean(post.featured));
      setEditorsPick(Boolean(post.editorsPick));
      if (post.publishedAt) setPublishedAt(toInputDateFormat(post.publishedAt));
      if (post.scheduledAt) setScheduledAt(post.scheduledAt);
      if (post.seo && typeof post.seo === 'object') {
        setMetaTitle(post.seo.metaTitle || '');
        setMetaDescription(post.seo.metaDescription || '');
      }
    }
  }, [initialPost, postId]);

  // Selected category info
  const selectedCatObj = CATEGORIES.find(
    (c) => c.name.toLowerCase() === (category || '').toLowerCase()
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

    try {
      showToast('Processing cover image...', 'info');
      // 1. Immediately optimize image & update preview on client
      const previewDataUrl = await optimizeImageFile(file, 1400, 0.85);
      if (previewDataUrl) {
        setCoverImage(previewDataUrl);
        showToast('Cover image updated!', 'success');
      }

      // 2. Also send to /api/upload in background
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.url) {
            setCoverImage(data.url);
          }
        })
        .catch(() => {});
    } catch {
      showToast('Cover image updated locally!', 'success');
    } finally {
      e.target.value = '';
    }
  };

  const handleAuthorAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Processing author photo...', 'info');
      const previewDataUrl = await optimizeImageFile(file, 400, 0.85);
      if (previewDataUrl) {
        setAuthorAvatar(previewDataUrl);
        setShowAuthorPhoto(true);
        showToast('Author photo updated!', 'success');
      }

      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.url) {
            setAuthorAvatar(data.url);
          }
        })
        .catch(() => {});
    } catch {
      showToast('Photo updated locally!', 'success');
    } finally {
      e.target.value = '';
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
      excerpt: excerpt.trim() || subtitle.trim() || '',
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
      const targetId = (initialPost && initialPost.id) || postId;
      const url = isEditing && targetId ? `/api/blogs/${targetId}` : '/api/blogs';
      const method = isEditing ? 'PUT' : 'POST';

      const customCreds = ClientStorage.getDynamoCreds();
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customCreds) {
        reqHeaders['x-dynamo-creds'] = JSON.stringify(customCreds);
      }

      const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: JSON.stringify(postPayload),
      });

      if (res.ok) {
        setLastAutosave(new Date().toLocaleTimeString());
        showToast(
          isEditing ? 'Article updated successfully!' : 'Article created successfully!',
          'success'
        );
        router.push('/admin');
      } else {
        // Fallback: Even if server returned error (e.g. offline/read-only), preserve local draft
        const savedRecord: BlogPost = {
          ...(initialPost || {}),
          ...postPayload,
          id: targetId || String(Date.now()),
        } as BlogPost;
        ClientStorage.saveBlog(savedRecord);
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
              onChange={(e) => {
                const val = e.target.value;
                setSubtitle(val);
                if (!excerpt || excerpt === subtitle) {
                  setExcerpt(val);
                }
              }}
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
                  <span className="font-medium text-navy-800 dark:text-offwhite">
                    Featured Story (Hero Banner)
                  </span>
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
              <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite">
                Featured Cover Image
              </h3>
              <span className="text-[10px] text-amberBrand font-semibold font-sans">
                16:9 ratio (1600×900 or 1200×675 px)
              </span>
            </div>

            <div className="space-y-3">
              {/* Preview */}
              <div className="relative h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 group">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/financial-independence.svg';
                  }}
                />
                <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-md bg-navy-900/80 text-white text-[11px] font-medium backdrop-blur-xs">
                    Current Cover
                  </span>
                </div>
              </div>

              {/* Upload Button */}
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-amberBrand/50 hover:border-amberBrand bg-amberBrand/5 hover:bg-amberBrand/10 text-xs font-bold text-navy-800 dark:text-amberBrand transition-colors cursor-pointer shadow-xs">
                <Upload className="w-4 h-4 text-amberBrand" />
                <span>Upload Image from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>

              {/* Direct Image URL input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block mb-1">
                  Or Paste Image URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://... or /images/..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-[11px] font-mono text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>

              {/* Quick Preset Illustrations */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block mb-1">
                  Quick Presets
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCoverImage('/images/financial-independence.svg')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-[10px] font-medium text-navy-800 dark:text-slate-300 truncate transition-colors text-center cursor-pointer"
                  >
                    Finance
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage('/images/insurance-guide.svg')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-[10px] font-medium text-navy-800 dark:text-slate-300 truncate transition-colors text-center cursor-pointer"
                  >
                    Insurance
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage('/images/second-order-thinking.svg')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-[10px] font-medium text-navy-800 dark:text-slate-300 truncate transition-colors text-center cursor-pointer"
                  >
                    Psychology
                  </button>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block mb-1">
                  Cover Caption
                </label>
                <input
                  type="text"
                  value={coverCaption}
                  onChange={(e) => setCoverCaption(e.target.value)}
                  placeholder="Optional image attribution or caption..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-[11px] text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>
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
