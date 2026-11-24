'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BlogPost } from '@/types/blog';
import { ClientStorage } from '@/lib/client-storage';
import { BlogCard } from '@/components/BlogCard';
import { Search as SearchIcon, Compass } from 'lucide-react';

interface SearchClientViewProps {
  initialQuery?: string;
  initialBlogs: BlogPost[];
}

function SearchClientContent({ initialQuery = '', initialBlogs }: SearchClientViewProps) {
  const searchParams = useSearchParams();
  const query = (searchParams?.get('q') || initialQuery || '').trim();
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);

  useEffect(() => {
    try {
      const merged = ClientStorage.getMergedBlogs(initialBlogs).filter(
        (b) => b.status === 'published'
      );
      setBlogs(merged);
    } catch {
      // Keep initialBlogs
    }
  }, [initialBlogs]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    const needle = query.toLowerCase();
    return blogs.filter((b) => {
      return (
        b.title.toLowerCase().includes(needle) ||
        b.excerpt.toLowerCase().includes(needle) ||
        b.category.toLowerCase().includes(needle) ||
        b.subcategory?.toLowerCase().includes(needle) ||
        b.tags.some((t) => t.toLowerCase().includes(needle)) ||
        b.content.toLowerCase().includes(needle)
      );
    });
  }, [blogs, query]);

  return (
    <div className="container-custom py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slateBrand/10 text-slateBrand dark:text-amberBrand text-xs font-bold uppercase tracking-wider">
          <SearchIcon className="w-3.5 h-3.5 text-amberBrand" />
          <span>Global Search</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-navy-800 dark:text-offwhite">
          {query ? `Search results for "${query}"` : 'Search Publication Library'}
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 dark:text-slate-300">
          {query
            ? `Found ${searchResults.length} ${
                searchResults.length === 1 ? 'article' : 'articles'
              } matching your search criteria.`
            : 'Type a keyword in the search bar above to query our publication.'}
        </p>
      </div>

      {/* Results or No-Results */}
      {searchResults.length === 0 ? (
        <div className="py-16 text-center text-charcoal-500 space-y-4 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 p-8 max-w-2xl mx-auto shadow-editorial">
          <Compass className="w-12 h-12 mx-auto text-amberBrand animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-navy-800 dark:text-offwhite">
              {query ? `No articles found for "${query}"` : 'No search query provided'}
            </h3>
            <p className="text-xs text-charcoal-500">
              Try searching with broader terms like &quot;investing&quot;, &quot;insurance&quot;, &quot;life insurance&quot;, or &quot;economy&quot;.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-slateBrand dark:text-slate-400">
              Popular topics:
            </span>
            {['Life Insurance', 'Health Insurance', 'Personal Finance', 'RBI', 'Budgeting'].map(
              (t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors"
                >
                  {t}
                </Link>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((post) => (
            <BlogCard key={post.id || post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchClientView(props: SearchClientViewProps) {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-12 text-center text-slate-500 animate-pulse">
          Searching publication...
        </div>
      }
    >
      <SearchClientContent {...props} />
    </Suspense>
  );
}
