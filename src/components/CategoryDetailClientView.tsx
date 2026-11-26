'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BlogPost } from '@/types/blog';
import { CategoryInfo } from '@/data/categories';
import { ClientStorage } from '@/lib/client-storage';
import { BlogCard } from '@/components/BlogCard';
import { Compass, BookOpen, Layers, ArrowLeft, Sparkles, Filter } from 'lucide-react';

interface CategoryDetailClientViewProps {
  category: CategoryInfo;
  initialBlogs: BlogPost[];
  initialSub?: string;
}

export function isMatchingCategory(postCategory: string | undefined, category: CategoryInfo): boolean {
  if (!postCategory) return false;
  const pCat = postCategory.trim().toLowerCase();
  const cName = category.name.trim().toLowerCase();
  const cSlug = category.slug.trim().toLowerCase();
  const pCatSlug = pCat.replace(/[\s_]+/g, '-');
  return pCat === cName || pCat === cSlug || pCatSlug === cSlug;
}

export function isMatchingSubcategory(
  post: BlogPost,
  subSlug: string | undefined,
  category: CategoryInfo
): boolean {
  if (!subSlug) return true;
  const target = subSlug.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const subInfo = category.subcategories.find(
    (s) =>
      s.slug.toLowerCase() === target ||
      s.name.trim().toLowerCase().replace(/[\s_]+/g, '-') === target ||
      (target === 'case-studies' && s.slug === 'case-study') ||
      (target === 'case-study' && s.slug === 'case-studies')
  );
  const targetName = subInfo ? subInfo.name.trim().toLowerCase() : '';

  // 1. Check post.subcategory
  if (post.subcategory) {
    const postSub = post.subcategory.trim().toLowerCase();
    const postSubSlug = postSub.replace(/[\s_]+/g, '-');
    if (
      postSubSlug === target ||
      (postSubSlug === 'case-study' && target === 'case-studies') ||
      (postSubSlug === 'case-studies' && target === 'case-study')
    ) {
      return true;
    }
    if (targetName && postSub === targetName) return true;
    if (target && postSub.includes(target)) return true;
  }

  // 2. Check post.tags
  if (Array.isArray(post.tags)) {
    const tagMatch = post.tags.some((tag) => {
      const tNorm = tag.trim().toLowerCase().replace(/[\s_]+/g, '-');
      return tNorm === target || (targetName && tag.trim().toLowerCase() === targetName);
    });
    if (tagMatch) return true;
  }

  // 3. Fallback: check post title if specific subtopic is in title
  if (targetName && targetName.length > 3) {
    if (post.title.toLowerCase().includes(targetName)) return true;
  }

  return false;
}

function CategoryDetailContent({
  category,
  initialBlogs,
  initialSub,
}: CategoryDetailClientViewProps) {
  const searchParams = useSearchParams();
  const querySub = searchParams?.get('sub') || initialSub || '';
  const [activeSub, setActiveSub] = useState<string>(querySub);
  const [allBlogs, setAllBlogs] = useState<BlogPost[]>(initialBlogs);

  // Sync with searchParams if URL changes
  useEffect(() => {
    setActiveSub(searchParams?.get('sub') || initialSub || '');
  }, [searchParams, initialSub]);

  // Merge client-side blogs and fetch fresh blogs from DynamoDB cloud database
  useEffect(() => {
    try {
      const merged = ClientStorage.getMergedBlogs(initialBlogs).filter(
        (b) => b.status === 'published'
      );
      setAllBlogs(merged);
    } catch {
      // Fallback to initialBlogs
    }

    // Refresh from live cloud database
    fetch('/api/blogs')
      .then((res) => (res.ok ? res.json() : null))
      .then((cloudBlogs) => {
        if (Array.isArray(cloudBlogs) && cloudBlogs.length > 0) {
          const fresh = ClientStorage.getMergedBlogs(cloudBlogs).filter(
            (b) => b.status === 'published'
          );
          setAllBlogs(fresh);
        }
      })
      .catch(() => {});
  }, [initialBlogs]);

  // All published blogs in this category
  const categoryBlogs = useMemo(() => {
    return allBlogs.filter((b) => isMatchingCategory(b.category, category));
  }, [allBlogs, category]);

  // Filtered by active subcategory
  const filteredBlogs = useMemo(() => {
    if (!activeSub) return categoryBlogs;
    return categoryBlogs.filter((b) => isMatchingSubcategory(b, activeSub, category));
  }, [categoryBlogs, activeSub, category]);

  // Identify active subcategory object for metadata
  const activeSubcategory = useMemo(() => {
    if (!activeSub) return null;
    const target = activeSub.trim().toLowerCase().replace(/[\s_]+/g, '-');
    return (
      category.subcategories.find(
        (s) =>
          s.slug.toLowerCase() === target ||
          s.name.trim().toLowerCase().replace(/[\s_]+/g, '-') === target
      ) || null
    );
  }, [category, activeSub]);

  // Subcategory article counts
  const subCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    category.subcategories.forEach((sc) => {
      counts[sc.slug] = categoryBlogs.filter((b) =>
        isMatchingSubcategory(b, sc.slug, category)
      ).length;
    });
    return counts;
  }, [categoryBlogs, category]);

  return (
    <div className="container-custom py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-slate-400">
        <Link href="/" className="hover:text-amberBrand transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-amberBrand transition-colors">
          Categories
        </Link>
        <span>/</span>
        <Link
          href={`/categories/${category.slug}`}
          className={`hover:text-amberBrand transition-colors ${
            !activeSub ? 'text-navy-800 dark:text-offwhite font-bold' : ''
          }`}
          onClick={() => setActiveSub('')}
        >
          {category.name}
        </Link>
        {activeSubcategory && (
          <>
            <span>/</span>
            <span className="text-amberBrand font-semibold">{activeSubcategory.name}</span>
          </>
        )}
      </div>

      {/* Category Hero Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amberBrand/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slateBrand/10 text-slateBrand dark:text-amberBrand border border-slateBrand/20">
              <Sparkles className="w-3.5 h-3.5 text-amberBrand" />
              <span>{activeSubcategory ? `${category.name} • ${activeSubcategory.name}` : category.name}</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300">
              {filteredBlogs.length} {filteredBlogs.length === 1 ? 'Article' : 'Articles'}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite tracking-tight">
            {activeSubcategory ? activeSubcategory.name : category.name}
          </h1>

          <p className="font-sans text-sm sm:text-base text-charcoal-600 dark:text-slate-300 leading-relaxed">
            {activeSubcategory ? activeSubcategory.description : category.description}
          </p>
        </div>

        {/* Subcategories Filter Pills */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-slateBrand dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amberBrand" />
              <span>Filter by Subtopic:</span>
            </span>
            {activeSub && (
              <button
                onClick={() => setActiveSub('')}
                className="text-amberBrand hover:underline text-[11px] font-semibold cursor-pointer"
              >
                Clear Filter (View All {categoryBlogs.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <Link
              href={`/categories/${category.slug}`}
              onClick={() => setActiveSub('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                !activeSub
                  ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              <span>All Subtopics</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                !activeSub ? 'bg-white/20 dark:bg-navy-900/30' : 'bg-slate-200 dark:bg-navy-700'
              }`}>
                {categoryBlogs.length}
              </span>
            </Link>

            {category.subcategories.map((sc) => {
              const isSelected = activeSub === sc.slug || activeSub === sc.name.toLowerCase().replace(/[\s_]+/g, '-');
              const count = subCounts[sc.slug] || 0;

              return (
                <Link
                  key={sc.slug}
                  href={`/categories/${category.slug}?sub=${sc.slug}`}
                  onClick={() => setActiveSub(sc.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm ring-2 ring-amberBrand/30'
                      : 'bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                  }`}
                >
                  <span>{sc.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected
                          ? 'bg-white/20 dark:bg-navy-900/40 text-white dark:text-navy-950'
                          : 'bg-amberBrand/20 text-amberBrand'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredBlogs.length === 0 ? (
        <div className="py-16 text-center text-charcoal-500 space-y-3 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 p-8 shadow-editorial">
          <Compass className="w-12 h-12 mx-auto text-amberBrand animate-pulse" />
          <h3 className="font-serif text-xl font-bold text-navy-800 dark:text-offwhite">
            {activeSubcategory
              ? `No published articles found in ${activeSubcategory.name}`
              : `No published articles found in ${category.name}`}
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-500 max-w-md mx-auto">
            {activeSubcategory ? (
              <>
                There are currently no published essays under this specific subtopic. View all{' '}
                <button
                  onClick={() => setActiveSub('')}
                  className="text-amberBrand font-bold underline cursor-pointer"
                >
                  {category.name} articles ({categoryBlogs.length})
                </button>{' '}
                or explore other subtopics above.
              </>
            ) : (
              `We are preparing in-depth research essays for ${category.name}. Check back soon.`
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 dark:text-slate-400">
            <span>
              Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'}
              {activeSubcategory && ` in ${activeSubcategory.name}`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((post) => (
              <BlogCard key={post.id || post.slug} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoryDetailClientView(props: CategoryDetailClientViewProps) {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-12 text-center text-slate-500 animate-pulse">
          Loading {props.category.name} articles...
        </div>
      }
    >
      <CategoryDetailContent {...props} />
    </Suspense>
  );
}
