'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { BlogCard } from '@/components/BlogCard';
import { useToast } from '@/context/ToastContext';
import { Bookmark, Trash2, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

interface BookmarksClientViewProps {
  initialBlogs: BlogPost[];
}

export function BookmarksClientView({ initialBlogs }: BookmarksClientViewProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const syncBookmarks = () => {
    const saved = ClientStorage.getBookmarks();
    setBookmarkedSlugs(saved);
  };

  useEffect(() => {
    syncBookmarks();
    setLoading(false);

    // Merge any locally cached blogs
    const merged = ClientStorage.getMergedBlogs(initialBlogs);
    setBlogs(merged);

    // Fetch fresh articles from cloud database in background
    const storedCreds = ClientStorage.getDynamoCreds();
    const headers: Record<string, string> = {};
    if (storedCreds) {
      headers['x-dynamo-creds'] = JSON.stringify(storedCreds);
    }

    fetch('/api/blogs', { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((cloudBlogs) => {
        if (Array.isArray(cloudBlogs) && cloudBlogs.length > 0) {
          const fresh = ClientStorage.getMergedBlogs(cloudBlogs);
          setBlogs(fresh);
        }
      })
      .catch(() => {});

    // Listen to real-time bookmark toggle events across the page
    const handleBookmarkChange = () => syncBookmarks();
    window.addEventListener('tmu_bookmarks_updated', handleBookmarkChange);
    window.addEventListener('storage', handleBookmarkChange);

    return () => {
      window.removeEventListener('tmu_bookmarks_updated', handleBookmarkChange);
      window.removeEventListener('storage', handleBookmarkChange);
    };
  }, [initialBlogs]);

  // Match bookmarked slugs with available published blogs
  const bookmarkedPosts = blogs.filter((b) =>
    bookmarkedSlugs.includes(b.slug) || bookmarkedSlugs.includes(b.id)
  );

  const handleClearAll = () => {
    if (bookmarkedPosts.length === 0) return;
    if (confirm('Are you sure you want to clear all saved bookmarks from this device?')) {
      ClientStorage.clearAllBookmarks();
      setBookmarkedSlugs([]);
      showToast('All bookmarks cleared from this device', 'info');
    }
  };

  return (
    <div className="container-custom py-10 sm:py-16 space-y-10 min-h-[60vh]">
      {/* Page Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amberBrand/15 text-amberBrand text-xs font-bold uppercase tracking-wider">
          <Bookmark className="w-3.5 h-3.5 fill-current" />
          <span>Personal Reading List</span>
        </div>
        
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-navy-800 dark:text-offwhite tracking-tight">
          Saved Articles &amp; Library
        </h1>
        
        <p className="font-sans text-sm sm:text-base text-charcoal-600 dark:text-slate-300 leading-relaxed">
          Articles you have bookmarked for deep reading. Your library is preserved locally on this browser for private, distraction-free access anytime.
        </p>
      </div>

      {/* Toolbar / Actions */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400">
            {loading ? 'Loading...' : `${bookmarkedPosts.length} ${bookmarkedPosts.length === 1 ? 'Article Saved' : 'Articles Saved'}`}
          </span>
          {bookmarkedPosts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amberBrand/20 text-amberBrand">
              Offline Ready
            </span>
          )}
        </div>

        {bookmarkedPosts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Clear all saved articles"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Library</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center text-charcoal-400">
          <div className="w-6 h-6 border-2 border-amberBrand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading your saved articles...</p>
        </div>
      ) : bookmarkedPosts.length === 0 ? (
        <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 shadow-editorial text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amberBrand/15 text-amberBrand flex items-center justify-center mx-auto shadow-sm">
            <Bookmark className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-black text-navy-800 dark:text-offwhite">
            No Saved Articles Yet
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            When browsing articles, click the small bookmark ribbon on any card or inside any essay to add it to your personal reading library.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Explore Featured Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bookmarkedPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
