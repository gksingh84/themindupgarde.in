'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { CATEGORIES } from '@/data/categories';
import { BlogCard } from '@/components/BlogCard';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

interface HomeClientViewProps {
  initialBlogs: BlogPost[];
  featuredPost: BlogPost;
}

const DOMAIN_TAGLINES: Record<string, string> = {
  'personal-finance': 'Money & systems',
  banking: 'The rails of money',
  insurance: 'Risk & protection',
  'day-to-day-insights': 'Everyday insights',
  'case-studies': 'How it actually works',
};

export function HomeClientView({ initialBlogs, featuredPost }: HomeClientViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { showToast } = useToast();

  const filteredBlogs = initialBlogs.filter(
    (b) => selectedCategory === 'All' || b.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', email: newsletterEmail.trim() }),
      });
      showToast(
        res.ok ? 'Welcome to The Mind Upgrade newsletter!' : 'Failed to subscribe. Please try again.',
        res.ok ? 'success' : 'error'
      );
      if (res.ok) setNewsletterEmail('');
    } catch {
      showToast('Welcome to The Mind Upgrade newsletter!', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <div className="pb-20 space-y-16 sm:space-y-20 text-slate-900 dark:text-slate-100">
      {/* Featured hero card */}
      {featuredPost && (
        <section className="container-custom pt-8 sm:pt-10">
          <div className="rounded-[40px] bg-gradient-to-br from-[#eceefd] via-[#f4f7fe] to-[#f8fafe] dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(79,92,200,0.45)] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="flex flex-col justify-between gap-8 order-2 lg:order-1 min-w-0">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800 text-[13px] font-semibold uppercase tracking-wide text-[#5b66e0]">
                  <Sparkles className="w-4 h-4" />
                  Featured · {featuredPost.category}
                </span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-[60px] leading-[1.05] text-slate-900 dark:text-white">
                  {featuredPost.title}
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl line-clamp-4">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#c9ece6] flex items-center justify-center font-display text-2xl text-slate-600 overflow-hidden">
                    {featuredPost.author.showPhoto !== false && featuredPost.author.avatar ? (
                      <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-full h-full object-cover" />
                    ) : (
                      featuredPost.author.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{featuredPost.author.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {featuredPost.readTime} · {formatDateDDMMYYYY(featuredPost.publishedAt)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#5b66e0] hover:bg-[#4b56d0] text-white font-semibold shadow-lg shadow-indigo-500/30 transition-colors"
                >
                  Read article <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="order-1 lg:order-2 block rounded-[28px] overflow-hidden min-h-[260px] lg:min-h-[520px] bg-slate-200"
            >
              <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700" />
            </Link>
          </div>
        </section>
      )}

      {/* Knowledge domains */}
      <section className="container-custom">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-4xl sm:text-5xl">Knowledge domains</h2>
          <Link href="/categories" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
            Browse every field
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat, i) => {
            const count = initialBlogs.filter((b) => b.category === cat.name).length;
            return (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group rounded-[28px] card-soft p-7 space-y-3 hover:-translate-y-1 transition-transform duration-300"
              >
                <p className={`text-[13px] font-semibold uppercase tracking-wide ${i % 3 === 1 ? 'text-teal-600' : 'text-[#5b66e0]'}`}>
                  {cat.name}
                </p>
                <p className="text-xl font-medium text-slate-900 dark:text-white">
                  {DOMAIN_TAGLINES[cat.slug] ?? cat.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {count} {count === 1 ? 'article' : 'articles'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest */}
      <section id="latest-articles" className="container-custom space-y-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <h2 className="font-display text-4xl sm:text-5xl">Latest</h2>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {['All', ...CATEGORIES.map((c) => c.name)].map((catName) => (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-5 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === catName
                    ? 'bg-[#0f1424] text-white shadow-md'
                    : 'bg-white/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-white'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="py-14 text-center space-y-2 card-soft rounded-[28px]">
            <Compass className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No articles found in &quot;{selectedCategory}&quot;</p>
            <p className="text-sm text-slate-500">Select another category or add a new article from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section id="subscribe" className="container-custom scroll-mt-28">
        <div className="rounded-[36px] card-soft p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-display text-4xl sm:text-5xl leading-tight">Get one sharp idea in your inbox each week</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg">
              Mental models, money systems, and occasional deep work on thinking better. No noise.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row items-stretch gap-3">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 min-w-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-full bg-[#5b66e0] hover:bg-[#4b56d0] text-white font-semibold shadow-lg shadow-indigo-500/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              Join the upgrade
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
