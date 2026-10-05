'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlogPost, Comment } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { BlogCard } from '@/components/BlogCard';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
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
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';

interface BlogPostClientViewProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function BlogPostClientView({ post, relatedPosts }: BlogPostClientViewProps) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Close share menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shareMenuOpen]);

  useEffect(() => {
    setHasLiked(ClientStorage.isLiked(post.slug));
    setIsBookmarked(ClientStorage.isBookmarked(post.slug));

    // Register page view once per browser session
    const sessionKey = `viewed_${post.id}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      fetch(`/api/blogs/${post.id}/view`, { method: 'POST' }).catch((err) =>
        console.error('Failed to register view count:', err)
      );
    }

    // Fetch comments for this post
    fetch(`/api/comments?postSlug=${post.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {});
  }, [post.id, post.slug]);

  // Extract Table of Contents from Content HTML
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const items: TocItem[] = [];

    headings.forEach((heading, idx) => {
      const text = heading.textContent || '';
      const id = `heading-${idx}`;
      heading.id = id;
      items.push({
        id,
        text,
        level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3,
      });
    });

    setToc(items);
  }, [post.content]);

  // Like / Unlike Article Handler
  const handleLike = async () => {
    if (hasLiked) {
      const confirmUnlike = confirm('Are you sure you want to remove your like from this article?');
      if (!confirmUnlike) return;

      const removed = ClientStorage.removeLikedPost(post.slug);
      if (removed) {
        setHasLiked(false);
        setLikes((prev) => Math.max(0, prev - 1));
        showToast('Like removed', 'info');

        try {
          await fetch(`/api/blogs/${post.id}/like`, { method: 'DELETE' });
        } catch {}
      }
      return;
    }

    const added = ClientStorage.addLikedPost(post.slug);
    if (added) {
      setHasLiked(true);
      setLikes((prev) => prev + 1);
      showToast('Thank you for liking this article!', 'success');

      try {
        await fetch(`/api/blogs/${post.id}/like`, { method: 'POST' });
      } catch {}
    }
  };

  // Toggle Bookmark Handler
  const handleBookmark = () => {
    const updated = ClientStorage.toggleBookmark(post.slug);
    setIsBookmarked(updated);
    showToast(
      updated ? 'Article saved to bookmarks' : 'Removed from bookmarks',
      updated ? 'success' : 'info'
    );
  };

  // Share Handlers
  const handleShareCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('Article link copied to clipboard!', 'success');
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Reading "${post.title}" on @TheMindUpgrade`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this article: "${post.title}" - ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // Submit Comment Handler
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showToast('Please enter your comment', 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSlug: post.slug,
          authorName: commentName || 'Growth Thinker',
          authorEmail: commentEmail,
          content: commentText,
        }),
      });
      const newComment = await res.json();
      if (newComment.id) {
        setComments((prev) => [newComment, ...prev]);
        setCommentText('');
        showToast('Comment published successfully!', 'success');
      }
    } catch {
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Edit Comment Handlers
  const handleEditCommentStart = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleEditCommentCancel = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleEditCommentSave = async (id: string) => {
    if (!editCommentContent.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    setIsUpdatingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          content: editCommentContent.trim(),
        }),
      });

      if (res.ok) {
        const updatedComment = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, content: updatedComment.content } : c))
        );
        setEditingCommentId(null);
        setEditCommentContent('');
        showToast('Comment updated successfully!', 'success');
      } else {
        showToast('Failed to update comment', 'error');
      }
    } catch {
      showToast('Failed to update comment', 'error');
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // Delete Comment Handler
  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setDeletingCommentId(id);
    try {
      const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        showToast('Comment deleted successfully', 'info');
      } else {
        showToast('Failed to delete comment', 'error');
      }
    } catch {
      showToast('Failed to delete comment', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-4 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 flex-wrap pb-1.5 pt-0.5 border-b border-slate-200/80 dark:border-slate-800/80 w-fit mx-auto">
          <Link
            href={`/categories/${post.category.toLowerCase()}`}
            className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-colors"
          >
            {post.category}
          </Link>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {post.readTime}
          </span>
          <span className="text-xs text-slate-500 font-medium">• {formatDateDDMMYYYY(post.publishedAt)}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight pt-1">
          {post.title}
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
          {post.excerpt}
        </p>

        {/* Author Metadata & Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-b border-slate-200/80 dark:border-slate-800/80 py-4">
          <div className="flex items-center gap-3">
            {post.author.showPhoto !== false && post.author.avatar && (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full border-2 border-indigo-500/40 bg-slate-800 object-cover"
              />
            )}
            <div className="text-left">
              <span className="block text-sm font-bold text-slate-900 dark:text-white">
                {post.author.name}
              </span>
              <span className="text-xs text-slate-500">{post.author.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border-rose-500/40'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{likes}</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`p-2.5 rounded-xl border transition-all ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/40'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
              title="Bookmark article"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleShareCopy}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-cyan-400 transition-colors"
              title="Copy Link"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Share Dropdown Button */}
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShareMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  shareMenuOpen
                    ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/40'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-500/40 hover:text-blue-500'
                }`}
                title="Share Article"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              {/* Share Dropdown Menu */}
              {shareMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Share to Platform
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <button
                    onClick={() => {
                      handleShareWhatsApp();
                      setShareMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-emerald-500 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.144 4.178 4.287-1.123z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={() => {
                      handleShareFacebook();
                      setShareMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    onClick={() => {
                      handleShareLinkedIn();
                      setShareMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </button>

                  {/* X (Twitter) */}
                  <button
                    onClick={() => {
                      handleShareTwitter();
                      setShareMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-900 dark:text-white fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>X (Twitter)</span>
                  </button>

                  {/* Copy Link Option */}
                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => {
                        handleShareCopy();
                        setShareMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-indigo-500" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Cover Image */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md p-2 sm:p-4 flex items-center justify-center">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-auto max-h-[520px] object-contain rounded-2xl"
        />
      </div>

      {/* Main Article Body Container */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div
          className="prose-article text-slate-800 dark:text-slate-200 text-base sm:text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2">Tags:</span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Share This Section */}
        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold tracking-wider text-slate-500 shrink-0">
            Share This:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all group"
            >
              <svg className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.144 4.178 4.287-1.123z"/>
              </svg>
              <span>WhatsApp</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all group"
            >
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span>LinkedIn</span>
            </button>

            {/* X */}
            <button
              onClick={handleShareTwitter}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-white text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all group"
            >
              <svg className="w-3.5 h-3.5 text-slate-900 dark:text-white group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all group"
            >
              <svg className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
              </svg>
              <span>Facebook</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleShareCopy}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition-all group"
            >
              <Copy className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Related Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <BlogCard key={rPost.id} post={rPost} />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Comments Section */}
      <section className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            <span>Discussion &amp; Insights ({comments.length})</span>
          </h3>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Leave a Thoughtful Comment</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              placeholder="Your Name"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="email"
              value={commentEmail}
              onChange={(e) => setCommentEmail(e.target.value)}
              placeholder="Your Email (Optional)"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your experience or perspective..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-indigo-600/30"
            >
              <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No comments yet. Be the first to start the discussion!
            </p>
          ) : (
            comments.map((comment) => {
              const isEditing = editingCommentId === comment.id;
              const isDeleting = deletingCommentId === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 transition-opacity ${
                    isDeleting ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full bg-slate-800"
                      />
                      <div>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {comment.authorName}
                        </span>
                        <span className="text-[10px] text-slate-500">{formatDateDDMMYYYY(comment.createdAt)}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => handleEditCommentStart(comment)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit comment"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="pl-11 space-y-2">
                      <textarea
                        rows={3}
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={handleEditCommentCancel}
                          disabled={isUpdatingComment}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleEditCommentSave(comment.id)}
                          disabled={isUpdatingComment}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>{isUpdatingComment ? 'Saving...' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-11">
                      {comment.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </article>
  );
}
