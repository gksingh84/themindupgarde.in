import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServer } from '@/lib/blog-service';
import { BlogCard } from '@/components/BlogCard';
import { ArrowLeft, Compass, BookOpen, Layers } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: 'Category Not Found | The Mind Upgrade' };

  return {
    title: `${category.name} Articles & Guides | The Mind Upgrade`,
    description: category.description,
    openGraph: {
      title: `${category.name} | The Mind Upgrade`,
      description: category.description,
      url: `https://themindupgrade.in/categories/${category.slug}`,
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const allBlogs = getBlogsServer().filter((b) => b.status === 'published');
  let categoryBlogs = allBlogs.filter(
    (b) => b.category.toLowerCase() === category.name.toLowerCase()
  );

  // Filter by subcategory if specified
  if (sub) {
    categoryBlogs = categoryBlogs.filter(
      (b) =>
        b.subcategory?.toLowerCase().replace(/\s+/g, '-') === sub.toLowerCase() ||
        b.tags.some((t) => t.toLowerCase().replace(/\s+/g, '-') === sub.toLowerCase())
    );
  }

  const activeSubcategory = category.subcategories.find(
    (s) => s.slug === sub
  );

  return (
    <div className="container-custom py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-slate-400">
        <Link href="/" className="hover:text-amberBrand transition-colors">Home</Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-amberBrand transition-colors">Categories</Link>
        <span>/</span>
        <span className="text-navy-800 dark:text-offwhite font-bold">{category.name}</span>
        {activeSubcategory && (
          <>
            <span>/</span>
            <span className="text-amberBrand font-semibold">{activeSubcategory.name}</span>
          </>
        )}
      </div>

      {/* Category Hero Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amberBrand/5 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="space-y-2 relative z-10 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slateBrand/10 text-slateBrand dark:text-amberBrand border border-slateBrand/20">
            {activeSubcategory ? `${category.name} • ${activeSubcategory.name}` : category.name}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite tracking-tight">
            {activeSubcategory ? activeSubcategory.name : category.name}
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal-600 dark:text-slate-300 leading-relaxed">
            {activeSubcategory ? activeSubcategory.description : category.description}
          </p>
        </div>

        {/* Subcategories Filter Pills */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center gap-2 overflow-x-auto scrollbar-none relative z-10">
          <Link
            href={`/categories/${category.slug}`}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              !sub
                ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950'
                : 'bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Subtopics
          </Link>
          {category.subcategories.map((sc) => (
            <Link
              key={sc.slug}
              href={`/categories/${category.slug}?sub=${sc.slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                sub === sc.slug
                  ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950'
                  : 'bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {sc.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {categoryBlogs.length === 0 ? (
        <div className="py-16 text-center text-charcoal-500 space-y-2 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700">
          <Compass className="w-10 h-10 mx-auto text-slateBrand" />
          <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">
            No published articles found in this subcategory
          </h3>
          <p className="text-xs text-charcoal-500">
            Select another subtopic or browse all articles in{' '}
            <Link href={`/categories/${category.slug}`} className="text-amberBrand underline">
              {category.name}
            </Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryBlogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
