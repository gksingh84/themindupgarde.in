'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { Clock, Bookmark, Share2, ArrowUpRight, Heart } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const { showToast } = useToast();

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
                onClick={handleLike}
                className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hasLiked
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Like featured article"
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likes}</span>
              </button>
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
    <div className="group flex flex-col rounded-[28px] card-soft p-3 hover:-translate-y-1.5 transition-transform duration-300 overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="relative block h-52 w-full overflow-hidden rounded-[22px] bg-slate-200">
        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
            isBookmarked ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-600 hover:text-slate-900'
          }`}
          title="Bookmark"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </Link>

      <div className="flex-1 flex flex-col px-4 pt-5 pb-3 gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[#5b66e0]">{post.category}</span>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-sans text-xl font-semibold text-slate-900 dark:text-white group-hover:text-[#5b66e0] transition-colors line-clamp-2 leading-snug" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            {post.title}
          </h3>
        </Link>
        <p className="text-slate-600 dark:text-slate-400 text-[15px] line-clamp-2 leading-relaxed">{post.excerpt}</p>

        <div className="mt-auto pt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime} · {formatDateDDMMYYYY(post.publishedAt)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                hasLiked ? 'text-rose-500' : 'hover:text-rose-500'
              }`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            <button onClick={handleShare} className="p-1.5 hover:text-[#5b66e0] transition-colors cursor-pointer" title="Share">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <Link href={`/blog/${post.slug}`} className="p-1.5 text-[#5b66e0]" aria-label="Read article">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
