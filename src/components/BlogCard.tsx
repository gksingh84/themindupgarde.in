'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { Clock, Bookmark, Share2, ArrowUpRight, Heart, Sparkles, Eye } from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { showToast } = useToast();

  const briefIntroduction =
    post.subtitle?.trim() ||
    post.excerpt?.trim() ||
    (post.content ? post.content.replace(/<[^>]*>/g, '').trim().slice(0, 160) + '...' : '');

  useEffect(() => {
    setIsBookmarked(ClientStorage.isBookmarked(post.slug));
    setHasLiked(ClientStorage.isLiked(post.slug));
    setLikes(post.likes || 0);
  }, [post.id, post.slug, post.likes]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = ClientStorage.toggleBookmark(post.slug);
    setIsBookmarked(updated);
    showToast(
      updated ? 'Saved to bookmarks' : 'Removed from bookmarks',
      updated ? 'success' : 'info'
    );
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasLiked) {
      const removed = ClientStorage.removeLikedPost(post.slug);
      if (removed) {
        setHasLiked(false);
        setLikes((prev) => Math.max(0, prev - 1));
        showToast('Like removed', 'info');
        fetch(`/api/blogs/${post.id}/like`, { method: 'DELETE' }).catch(() => {});
      }
      return;
    }

    const added = ClientStorage.addLikedPost(post.slug);
    if (added) {
      setHasLiked(true);
      setLikes((prev) => prev + 1);
      showToast('Thank you for liking this article!', 'success');
      fetch(`/api/blogs/${post.id}/like`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareOpen(true);
  };

  if (featured) {
    return (
      <>
        <article className="group relative rounded-3xl overflow-hidden bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-amberBrand/60 transition-all duration-300 shadow-editorial hover:shadow-editorial-hover grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Featured Image Column */}
        <div className="lg:col-span-7 relative min-h-[280px] lg:min-h-[420px] overflow-hidden bg-slate-100 dark:bg-navy-950 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-navy-800">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute bottom-4 left-4 z-10">
            <span className="bg-amberBrand text-navy-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Story
            </span>
          </div>
        </div>

        {/* Featured Content Column */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white dark:bg-navy-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-navy-800">
              <span 
                title={post.category}
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slateBrand/10 text-slateBrand dark:bg-navy-800 dark:text-amberBrand border border-slateBrand/20 dark:border-navy-700 whitespace-nowrap shrink min-w-0 truncate"
              >
                {post.category}
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-charcoal-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                <span className="whitespace-nowrap">{formatDateDDMMYYYY(post.publishedAt)}</span>
                <span className="text-charcoal-300 dark:text-slate-600 shrink-0">•</span>
                <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amberBrand shrink-0" />
                  <span>{post.readTime}</span>
                </span>
              </div>
            </div>

            <Link href={`/blog/${post.slug}`} className="block">
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors leading-tight">
                {post.title}
              </h2>
            </Link>

            {briefIntroduction && (
              <p className="text-xs sm:text-sm font-normal text-charcoal-600 dark:text-slate-300 italic line-clamp-3 leading-relaxed">
                {briefIntroduction}
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {post.author.showPhoto !== false && post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full border border-amberBrand/40 bg-navy-800 object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-navy-800 dark:text-offwhite">{post.author.name}</span>
                <span className="text-[11px] text-charcoal-500 dark:text-slate-400">{post.author.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 dark:text-slate-300 bg-slate-100/80 dark:bg-navy-800 border-slate-200 dark:border-navy-700"
                title="Total views"
              >
                <Eye className="w-3.5 h-3.5 text-amberBrand" />
                <span>{post.views || 0}</span>
              </span>
              <button
                onClick={handleLike}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hasLiked
                    ? 'bg-rose-500/15 text-rose-600 border-rose-500/40 shadow-xs'
                    : 'bg-slate-100 dark:bg-navy-800 text-charcoal-500 dark:text-slate-400 hover:text-rose-600 border-slate-200 dark:border-navy-700'
                }`}
                title="Like article"
                aria-label="Like featured article"
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likes}</span>
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-500 dark:text-slate-400 hover:text-navy-800 dark:hover:text-white border border-slate-200 dark:border-navy-700 transition-colors cursor-pointer"
                title="Share article"
                aria-label="Share article"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <Link
                href={`/blog/${post.slug}`}
                className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md transition-all flex items-center gap-1"
              >
                <span>Read</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        </article>
        <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} post={post} />
      </>
    );
  }

  return (
    <>
      <article className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700 hover:border-amberBrand/60 transition-all duration-300 shadow-editorial hover:shadow-editorial-hover hover:-translate-y-1 overflow-hidden">
      <div>
        {/* Cover Thumbnail */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Action Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amberBrand text-navy-950 border-amberBrand'
                  : 'bg-navy-900/80 text-slate-200 hover:text-white border-navy-700'
              }`}
              title="Bookmark"
              aria-label="Bookmark article"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-2.5">
          {/* Category, Date & Read Time */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-navy-800/80">
            <span
              title={post.category}
              className={`rounded-full font-bold uppercase tracking-wider inline-flex items-center shrink min-w-0 transition-all ${
                post.category.length > 18
                  ? 'px-2 py-0.5 text-[9px] max-w-[110px] sm:max-w-[125px]'
                  : post.category.length > 13
                  ? 'px-2 py-0.5 text-[9.5px] max-w-[125px] sm:max-w-[135px]'
                  : 'px-2.5 py-0.5 text-[10px]'
              } bg-slateBrand/10 text-slateBrand dark:bg-navy-800 dark:text-amberBrand border border-slateBrand/20 dark:border-navy-700`}
            >
              <span className="truncate">
                {post.category === 'Psychology and Self-Improvement'
                  ? 'Psychology'
                  : post.category === 'Economy and Current Affairs'
                  ? 'Economy'
                  : post.category}
              </span>
            </span>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-charcoal-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              <span className="whitespace-nowrap">{formatDateDDMMYYYY(post.publishedAt)}</span>
              <span className="text-charcoal-300 dark:text-slate-600 shrink-0">•</span>
              <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-amberBrand shrink-0" />
                <span>{post.readTime}</span>
              </span>
            </div>
          </div>

          <Link href={`/blog/${post.slug}`} className="block pt-0.5">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>

          {briefIntroduction && (
            <p className="text-xs sm:text-sm font-normal text-charcoal-600 dark:text-slate-300 italic line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {briefIntroduction}
            </p>
          )}
        </div>
      </div>

      {/* Author & Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {post.author.showPhoto !== false && post.author.avatar && (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-7 h-7 rounded-full bg-navy-800 border border-amberBrand/40 object-cover"
            />
          )}
          <span className="text-xs font-medium text-charcoal-800 dark:text-slate-200 truncate max-w-[120px]">
            {post.author.name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-slate-400">
          <span
            className="px-2 py-1 rounded-lg border flex items-center gap-1 text-[11px] font-semibold text-charcoal-600 dark:text-slate-300 bg-slate-100/80 dark:bg-navy-800 border-slate-200 dark:border-navy-700"
            title="Total views"
          >
            <Eye className="w-3 h-3 text-amberBrand" />
            <span>{post.views || 0}</span>
          </span>
          <button
            onClick={handleLike}
            className={`px-2 py-1 rounded-lg border flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              hasLiked
                ? 'bg-rose-500/15 text-rose-600 border-rose-500/40'
                : 'bg-slate-100 dark:bg-navy-800 text-charcoal-500 dark:text-slate-400 hover:text-rose-600 border-slate-200 dark:border-navy-700'
            }`}
            title="Like"
            aria-label="Like article"
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
            <span>{likes}</span>
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 hover:text-amberBrand transition-colors cursor-pointer"
            title="Share"
            aria-label="Share article"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center gap-1 font-bold text-navy-800 dark:text-amberBrand group-hover:translate-x-0.5 transition-transform"
          >
            <span>Read</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
    <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} post={post} />
  </>
);
}
