'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlogPost } from '@/types/blog';
import { Search, X, Clock, ArrowRight, Sparkles, History, ArrowUpRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

export function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlogPost[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load session search history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('recent_searches');
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(posts.slice(0, 5));
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = posts.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchExcerpt = p.excerpt.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchSub = p.subcategory?.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchExcerpt || matchCat || matchSub || matchTags;
    });

    setResults(filtered.slice(0, 8));
  }, [query, posts]);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      saveToHistory(query);
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-navy-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-navy-800 flex items-center gap-3 bg-slate-50/50 dark:bg-navy-950/40">
          <Search className="w-5 h-5 text-amberBrand shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search money, insurance, psychology, economy, daily insights..."
            className="w-full bg-transparent text-navy-800 dark:text-offwhite placeholder-charcoal-500 focus:outline-none text-base font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-charcoal-500 hover:text-navy-800 dark:hover:text-white transition-colors"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-charcoal-500 dark:text-slate-400 border border-slate-200 dark:border-navy-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Recent Search History Pills */}
        {recentSearches.length > 0 && !query && (
          <div className="px-5 pt-3 pb-1 flex items-center gap-2 flex-wrap border-b border-slate-100 dark:border-navy-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 flex items-center gap-1">
              <History className="w-3 h-3" />
              Recent:
            </span>
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Search Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 bg-slate-50/30 dark:bg-navy-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slateBrand dark:text-slate-400 uppercase tracking-wider px-2 pb-1">
            <span>{query ? `Matching Articles (${results.length})` : 'Popular Reading'}</span>
            {query && (
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => {
                  saveToHistory(query);
                  onClose();
                }}
                className="text-amberBrand hover:underline flex items-center gap-1 font-bold text-xs lowercase"
              >
                <span>View all results &rarr;</span>
              </Link>
            )}
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center text-charcoal-500 dark:text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-amberBrand" />
              <p className="text-sm font-bold text-navy-800 dark:text-offwhite">
                No articles found matching &quot;{query}&quot;
              </p>
              <p className="text-xs text-charcoal-500">
                Try searching for personal finance, insurance, psychology, or repo rate.
              </p>
            </div>
          ) : (
            results.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={() => {
                  if (query) saveToHistory(query);
                  onClose();
                }}
                className="group flex items-start gap-4 p-3 rounded-2xl bg-white dark:bg-navy-950/70 hover:bg-slate-50 dark:hover:bg-navy-800 transition-all border border-slate-100 dark:border-navy-800/80 hover:border-amberBrand/50 shadow-xs"
              >
                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-navy-900 overflow-hidden shrink-0 relative border border-slate-200/60 dark:border-navy-800">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slateBrand/10 text-slateBrand dark:bg-navy-800 dark:text-amberBrand">
                      {post.category}
                    </span>
                    <span className="text-[11px] text-charcoal-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amberBrand" />
                      {post.readTime}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors truncate">
                    {post.title}
                  </h4>
                  <p className="text-xs text-charcoal-600 dark:text-slate-300 line-clamp-1">
                    {post.excerpt}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400 group-hover:text-amberBrand group-hover:translate-x-0.5 transition-all self-center shrink-0" />
              </Link>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-navy-800 text-[11px] text-charcoal-500 dark:text-slate-400 flex items-center justify-between">
          <span>Press <strong>Enter</strong> for full search results</span>
          <span>Press <strong>Esc</strong> to close</span>
        </div>

      </div>
    </div>
  );
}
