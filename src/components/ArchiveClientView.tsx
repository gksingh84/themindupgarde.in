'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { Calendar, Clock, ChevronDown, ChevronRight, Search, BookOpen, ArrowUpRight } from 'lucide-react';

interface ArchiveClientViewProps {
  grouped: Record<string, BlogPost[]>;
  totalCount: number;
}

export function ArchiveClientView({ grouped, totalCount }: ArchiveClientViewProps) {
  const monthYears = Object.keys(grouped);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    monthYears.reduce((acc, my) => ({ ...acc, [my]: true }), {})
  );
  const [query, setQuery] = useState('');

  const toggleSection = (monthYear: string) => {
    setOpenSections((prev) => ({ ...prev, [monthYear]: !prev[monthYear] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500">
          Chronological Index
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Complete Article Archive
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
          Browse through {totalCount} published articles organized by date.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter archive by title or category..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Accordion Grouped List */}
      <div className="space-y-6">
        {monthYears.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No articles in archive yet.
          </div>
        ) : (
          monthYears.map((monthYear) => {
            const posts = grouped[monthYear].filter((p) => {
              if (!query.trim()) return true;
              const q = query.toLowerCase();
              return (
                p.title.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
              );
            });

            if (posts.length === 0) return null;
            const isOpen = openSections[monthYear] ?? true;

            return (
              <div
                key={monthYear}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(monthYear)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {monthYear}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold border border-blue-500 shadow-2xs">
                      {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Article Entries */}
                {isOpen && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                              {post.category}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDateDDMMYYYY(post.publishedAt)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 self-end sm:self-center">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {post.readTime}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
