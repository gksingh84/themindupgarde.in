import React from 'react';
import Link from 'next/link';
import { getBlogsServer } from '@/lib/blog-service';
import { BlogCard } from '@/components/BlogCard';
import { Search as SearchIcon, Compass, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Search Results | The Mind Upgrade',
  description: 'Search articles, mental models, personal finance guides, and insights.',
};

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || '').trim();

  const allBlogs = getBlogsServer().filter((b) => b.status === 'published');
  
  const searchResults = query
    ? allBlogs.filter((b) => {
        const needle = query.toLowerCase();
        return (
          b.title.toLowerCase().includes(needle) ||
          b.excerpt.toLowerCase().includes(needle) ||
          b.category.toLowerCase().includes(needle) ||
          b.subcategory?.toLowerCase().includes(needle) ||
          b.tags.some((t) => t.toLowerCase().includes(needle)) ||
          b.content.toLowerCase().includes(needle)
        );
      })
    : [];

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
            ? `Found ${searchResults.length} ${searchResults.length === 1 ? 'article' : 'articles'} matching your search criteria.`
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
              Try searching with broader terms like &quot;investing&quot;, &quot;insurance&quot;, &quot;decisions&quot;, or &quot;economy&quot;.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-slateBrand dark:text-slate-400">Popular topics:</span>
            {['Personal Finance', 'Health Insurance', 'Mental Models', 'RBI', 'Budgeting'].map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
