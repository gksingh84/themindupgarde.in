'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlogPost, CategoryType } from '@/types/blog';
import { CATEGORIES } from '@/data/categories';
import { TipTapEditor } from '@/components/TipTapEditor';
import { useToast } from '@/context/ToastContext';
import { ClientStorage } from '@/lib/client-storage';
import { formatDateDDMMYYYY, parseDate } from '@/lib/date-utils';
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
  EyeOff,
  Calendar,
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

export function BlogEditorClient({ initialPost, isEditing = false }: BlogEditorClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [category, setCategory] = useState<CategoryType>(initialPost?.category || 'Personal Finance');
  const [tagsInput, setTagsInput] = useState(initialPost?.tags?.join(', ') || 'Focus, Systems');
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || '/images/deep-work.svg');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [authorName, setAuthorName] = useState(initialPost?.author?.name || 'Gaurav Kumar Singh');
  const [authorRole, setAuthorRole] = useState(initialPost?.author?.role || 'Founder & Author');
  const [authorAvatar, setAuthorAvatar] = useState(initialPost?.author?.avatar ?? '/images/gaurav-kumar-singh.jpg');
  const [showAuthorPhoto, setShowAuthorPhoto] = useState(initialPost?.author?.showPhoto !== false);
  const [status, setStatus] = useState<'published' | 'draft'>(initialPost?.status || 'published');
  const [featured, setFeatured] = useState(Boolean(initialPost?.featured));
  const [publishedAt, setPublishedAt] = useState<string>(() => {
    return toInputDateFormat(initialPost?.publishedAt);
  });

  useEffect(() => {
    setIsAuthenticated(ClientStorage.isAdminAuthenticated());
  }, []);

  // Auto-generate slug from title if creating new
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

  const handleDeleteAuthorAvatar = () => {
    setAuthorAvatar('');
    showToast('Author photo removed', 'info');
  };

  const handleSave = async (targetStatus?: 'published' | 'draft') => {
    if (!title.trim()) {
      showToast('Please provide an article title', 'error');
      return;
    }

    setSaving(true);
    const finalStatus = targetStatus || status;

    // Estimate reading time from word count
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${estMinutes} min read`;

    const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const postPayload: Partial<BlogPost> = {
      title,
      slug: slug.trim(),
      category,
      tags: tagsArray,
      coverImage,
      excerpt,
      content,
      readTime,
      status: finalStatus,
      featured,
      publishedAt: formatDateDDMMYYYY(publishedAt),
      author: {
        name: authorName,
        avatar: authorAvatar,
        role: authorRole,
        showPhoto: showAuthorPhoto,
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

      const data = await res.json();

      if (res.ok) {
        if (!isEditing && finalStatus === 'published') {
          const sentCount = data.notification?.sentCount || 'all';
          showToast(
            `New article published! Notification emails dispatched to ${sentCount} subscribers.`,
            'success'
          );
        } else if (isEditing) {
          showToast(
            finalStatus === 'published'
              ? 'Article updated successfully!'
              : 'Draft updated successfully!',
            'success'
          );
        } else {
          showToast('Draft saved successfully!', 'info');
        }
        router.push('/admin');
      } else {
        showToast(data.error || 'Failed to save article', 'error');
      }
    } catch (err) {
      showToast('Error saving article', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-sm shadow-xl">
          <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Access Required</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Please log in to the admin panel first.</p>
          <Link
            href="/admin"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Article' : 'Create New Article'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Article Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Science of Deep Work & Focus Protocols"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-xl font-bold px-4 py-3.5 rounded-2xl focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        {/* Publication Date (Backdate), Category & Slug Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Publication Date (Backdate)</span>
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-url-slug"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm font-mono px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Tags & Featured Checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Deep Work, Focus, Productivity"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="pt-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Pin as Featured Article</span>
            </label>
          </div>
        </div>

        {/* Cover Image Upload / Selection */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Cover Image
          </label>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-48 h-28 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden relative shrink-0 flex items-center justify-center p-1">
              <img src={coverImage} alt="Cover Preview" className="w-full h-full object-contain" />
            </div>

            <div className="flex-1 space-y-3 w-full">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/images/deep-work.svg or https://..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
              />

              <div className="flex items-center gap-2">
                <label className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>

                {/* Preset SVG Covers Selector */}
                <div className="flex items-center gap-1">
                  {[
                    '/images/deep-work.svg',
                    '/images/mental-models.svg',
                    '/images/ai-creativity.svg',
                    '/images/habits-neurobiology.svg',
                    '/images/financial-independence.svg',
                    '/images/stoicism.svg',
                  ].map((presetPath, idx) => (
                    <button
                      key={presetPath}
                      type="button"
                      onClick={() => setCoverImage(presetPath)}
                      className={`w-6 h-6 rounded-md border text-[9px] font-bold cursor-pointer transition-colors ${coverImage === presetPath
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-500'
                        }`}
                      title={presetPath}
                    >
                      P{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Excerpt / Meta Description
          </label>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A concise 1-2 sentence summary for social media & search engine previews..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        {/* Rich Text Editor */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Article Content (Rich Text &amp; Formatting)
          </label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        {/* Author Profile & Photo Settings */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Author Profile &amp; Photo Settings
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Author Role / Title
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Author Photo Upload & Delete Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Photo Preview / Placeholder */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 border-2 border-indigo-500/40 shrink-0 flex items-center justify-center shadow-xs">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt="Author Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Author Profile Photo
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {authorAvatar ? 'Photo attached' : 'No photo attached'}
                  </p>
                </div>
              </div>

              {/* Upload & Delete Buttons */}
              <div className="flex items-center gap-2">
                <label className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{authorAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAuthorAvatarUpload}
                    className="hidden"
                  />
                </label>

                {authorAvatar && (
                  <button
                    type="button"
                    onClick={handleDeleteAuthorAvatar}
                    className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Delete Author Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Optional Visibility Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                <input
                  type="checkbox"
                  checked={showAuthorPhoto}
                  onChange={(e) => setShowAuthorPhoto(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {showAuthorPhoto ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  <span>Show Photo of Author in Article Page &amp; Cards</span>
                </div>
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
