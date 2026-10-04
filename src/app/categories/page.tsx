import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { getBlogsServer } from '@/lib/blog-service';
import { 
  Zap, 
  TrendingUp, 
  Building2,
  ShieldCheck,
  FileText,
  Compass, 
  ArrowRight, 
  BookOpen 
} from 'lucide-react';

export const metadata = {
  title: 'Categories | The Mind Upgrade',
  description: 'Explore curated articles grouped by Personal Finance, Banking, Insurance, Day to Day Insights, and Case Studies.',
};

export default function CategoriesPage() {
  const blogs = getBlogsServer().filter((b) => b.status === 'published');

  const getCount = (catName: string) => {
    return blogs.filter((b) => b.category.toLowerCase() === catName.toLowerCase()).length;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className="w-7 h-7 text-amber-400" />;
      case 'Building2': return <Building2 className="w-7 h-7 text-cyan-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-7 h-7 text-emerald-400" />;
      case 'Zap': return <Zap className="w-7 h-7 text-indigo-400" />;
      case 'FileText': return <FileText className="w-7 h-7 text-purple-400" />;
      default: return <Compass className="w-7 h-7 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500">
          Knowledge Taxonomy
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore by Category
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
          Filter our library of cognitive upgrades by core domain of interest.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {CATEGORIES.map((cat) => {
          const count = getCount(cat.name);
          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 p-6 sm:p-8 space-y-6 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform">
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{count} {count === 1 ? 'Article' : 'Articles'}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-400 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-2">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Browse {cat.name}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
