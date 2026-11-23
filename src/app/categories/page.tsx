import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServer } from '@/lib/blog-service';
import { 
  Coins, 
  ShieldCheck, 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Compass, 
  ArrowRight, 
  BookOpen,
  Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'Content Domains | The Mind Upgrade',
  description: 'Explore curated articles in Personal Finance, Insurance, Psychology, Economy, and Practical Everyday Knowledge.',
};

export default function CategoriesPage() {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');

  const getCount = (catName: string) => {
    return blogs.filter((b) => b.category.toLowerCase() === catName.toLowerCase()).length;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins':
        return <Coins className="w-6 h-6 text-amberBrand" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-slateBrand" />;
      case 'Brain':
        return <Brain className="w-6 h-6 text-navy-800 dark:text-amberBrand" />;
      case 'TrendingUp':
        return <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'Lightbulb':
        return <Lightbulb className="w-6 h-6 text-amber-500" />;
      default:
        return <Compass className="w-6 h-6 text-slateBrand" />;
    }
  };

  return (
    <div className="container-custom py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slateBrand/10 text-slateBrand dark:text-amberBrand text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amberBrand" />
          <span>Knowledge Structure</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite tracking-tight">
          Explore Knowledge Domains
        </h1>
        <p className="font-sans text-sm sm:text-base text-charcoal-700 dark:text-slate-300 leading-relaxed">
          Comprehensive, research-backed essays organized across five primary disciplines of human life and decision making.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {CATEGORIES.map((cat) => {
          const count = getCount(cat.name);
          return (
            <div
              key={cat.slug}
              className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-amberBrand/60 p-6 sm:p-8 space-y-6 transition-all duration-300 shadow-editorial hover:shadow-editorial-hover flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-100 dark:border-navy-700">
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300">
                    <BookOpen className="w-3 h-3 text-amberBrand" />
                    <span>{count} {count === 1 ? 'Article' : 'Articles'}</span>
                  </span>
                </div>

                <div>
                  <Link href={`/categories/${cat.slug}`}>
                    <h2 className="font-serif text-2xl font-bold text-navy-800 dark:text-offwhite hover:text-amberBrand transition-colors">
                      {cat.name}
                    </h2>
                  </Link>
                  <p className="text-charcoal-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mt-2">
                    {cat.description}
                  </p>
                </div>

                {/* Subcategories list */}
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
                    Core Subtopics:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/categories/${cat.slug}?sub=${sub.slug}`}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-navy-950 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand border border-slate-200 dark:border-navy-800 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-bold text-amberBrand">
                <Link
                  href={`/categories/${cat.slug}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <span>Explore All {cat.name} Articles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
