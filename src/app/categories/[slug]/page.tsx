import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServer } from '@/lib/blog-service';
import { BlogCard } from '@/components/BlogCard';
import { ArrowLeft, Compass } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} Articles | The Mind Upgrade`,
    description: category.description,
  };
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const allBlogs = getBlogsServer().filter((b) => b.status === 'published');
  const categoryBlogs = allBlogs.filter(
    (b) => b.category.toLowerCase() === category.name.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Categories</span>
        </Link>
      </div>

      {/* Category Header Card - Light Theme & Compact Height */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50/90 via-white to-amber-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/60 border border-blue-100 dark:border-slate-800 space-y-2.5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none rounded-full" />
        <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500">
          Category Domain
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {category.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          {category.description}
        </p>
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 pt-0.5">
          Showing {categoryBlogs.length} {categoryBlogs.length === 1 ? 'article' : 'articles'}
        </p>
      </div>

      {/* Articles Grid */}
      {categoryBlogs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Compass className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No articles yet in this category.</p>
          <p className="text-xs text-slate-500">Check back soon or browse another topic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categoryBlogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
