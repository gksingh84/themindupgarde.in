import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogsServer } from '@/lib/blog-service';
import { BlogCard } from '@/components/BlogCard';
import { ArrowLeft, Tag as TagIcon, Compass } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tagName = decodeURIComponent(slug).replace(/-/g, ' ');

  return {
    title: `Articles tagged #${tagName} | The Mind Upgrade`,
    description: `Explore all published essays, guides and insights tagged with ${tagName}.`,
  };
}

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawTag = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ');

  const allBlogs = getBlogsServer().filter((b) => b.status === 'published');
  const taggedBlogs = allBlogs.filter((b) =>
    b.tags.some(
      (t) =>
        t.toLowerCase() === rawTag ||
        t.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    )
  );

  return (
    <div className="container-custom py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-slate-400">
        <Link href="/" className="hover:text-amberBrand transition-colors">Home</Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-amberBrand transition-colors">Categories</Link>
        <span>/</span>
        <span className="text-navy-800 dark:text-offwhite font-bold">#{rawTag}</span>
      </div>

      {/* Header */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slateBrand/10 text-slateBrand dark:text-amberBrand text-xs font-bold uppercase tracking-wider">
          <TagIcon className="w-3.5 h-3.5" />
          <span>Topic Archive</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-navy-800 dark:text-offwhite capitalize">
          #{rawTag}
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 dark:text-slate-300">
          Showing {taggedBlogs.length} {taggedBlogs.length === 1 ? 'article' : 'articles'} filed under this keyword.
        </p>
      </div>

      {/* Grid */}
      {taggedBlogs.length === 0 ? (
        <div className="py-16 text-center text-charcoal-500 space-y-2 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700">
          <Compass className="w-10 h-10 mx-auto text-slateBrand" />
          <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">
            No articles found for tag #{rawTag}
          </h3>
          <p className="text-xs text-charcoal-500">
            Browse our <Link href="/categories" className="text-amberBrand underline">categories</Link> to explore all topics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taggedBlogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
