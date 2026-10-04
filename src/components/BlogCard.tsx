'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { Clock, Bookmark, Share2, ArrowUpRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setIsBookmarked(ClientStorage.isBookmarked(post.slug));
  }, [post.slug]);

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

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${post.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Article link copied to clipboard!', 'success');
    }
  };

  if (featured) {
    return (
      <div className="group relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 transition-all duration-300 shadow-xl shadow-blue-950/5 hover:shadow-2xl hover:shadow-blue-600/15 hover:-translate-y-1.5 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Featured Image Container */}
        <div className="lg:col-span-7 relative min-h-[260px] lg:min-h-[380px] overflow-hidden bg-slate-100 dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-600 text-white shadow-md shadow-blue-600/30">
              ★ Featured Article
            </span>
          </div>
        </div>

        {/* Featured Content Container */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 pb-1 pt-0.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                {post.category}
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{formatDateDDMMYYYY(post.publishedAt)}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  {post.readTime}
                </span>
              </div>
            </div>

            <Link href={`/blog/${post.slug}`} className="block pt-1 pb-0.5">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {post.title}
              </h2>
            </Link>

            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author.showPhoto !== false && post.author.avatar && (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full border border-blue-500/40 bg-slate-800 object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{post.author.name}</span>
                <span className="text-xs text-slate-500">{formatDateDDMMYYYY(post.publishedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-xl border transition-colors ${
                  isBookmarked
                    ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
                }`}
                title="Bookmark article"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
                title="Share article"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <Link
                href={`/blog/${post.slug}`}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all group-hover:translate-x-0.5"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500/60 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-1.5 overflow-hidden">
      <div>
        {/* Cover Thumbnail */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Action Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg backdrop-blur-md border transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/80 text-white border-amber-400'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-2">
          {/* Category, Date & Read Time Metadata Bar */}
          <div className="flex items-center justify-between gap-2 pb-1 pt-0.5 border-b border-slate-100 dark:border-slate-800/50">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{formatDateDDMMYYYY(post.publishedAt)}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                {post.readTime}
              </span>
            </div>
          </div>

          <Link href={`/blog/${post.slug}`} className="block pt-1 pb-0.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>

          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </div>

      {/* Author & Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {post.author.showPhoto !== false && post.author.avatar && (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-7 h-7 rounded-full bg-slate-800 border border-blue-500/30 object-cover"
            />
          )}
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
            {post.author.name}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={handleShare}
            className="p-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform"
          >
            <span>Read</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
