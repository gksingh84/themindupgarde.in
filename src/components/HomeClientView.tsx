'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { CATEGORIES } from '@/data/categories';
import { BlogCard } from '@/components/BlogCard';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import { ClientStorage } from '@/lib/client-storage';
import { 
  ArrowRight, 
  Coins, 
  ShieldCheck, 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Compass, 
  Send, 
  Sparkles, 
  Award, 
  Flame, 
  Clock, 
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface HomeClientViewProps {
  initialBlogs: BlogPost[];
  featuredPost: BlogPost;
  editorsPicks?: BlogPost[];
  popularPosts?: BlogPost[];
}

export function HomeClientView({ 
  initialBlogs, 
  featuredPost,
  editorsPicks = [],
  popularPosts = [] 
}: HomeClientViewProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [heroPost, setHeroPost] = useState<BlogPost | null>(featuredPost || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [popularPeriod, setPopularPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterAgreed, setNewsletterAgreed] = useState(false);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const merged = ClientStorage.getMergedBlogs(initialBlogs);
    setBlogs(merged);
    const updatedHero = merged.find((b) => b.id === featuredPost?.id || b.slug === featuredPost?.slug) || merged[0] || null;
    setHeroPost(updatedHero);

    // Fetch fresh articles from DynamoDB cloud database
    fetch('/api/blogs')
      .then((res) => (res.ok ? res.json() : null))
      .then((cloudBlogs) => {
        if (Array.isArray(cloudBlogs) && cloudBlogs.length > 0) {
          const freshMerged = ClientStorage.getMergedBlogs(cloudBlogs);
          setBlogs(freshMerged);
          const freshHero =
            freshMerged.find((b) => b.id === featuredPost?.id || b.slug === featuredPost?.slug) ||
            freshMerged[0] ||
            null;
          setHeroPost(freshHero);
        }
      })
      .catch(() => {});
  }, [initialBlogs, featuredPost]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins':
        return <Coins className="w-5 h-5 text-amberBrand" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-slateBrand" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-navy-800 dark:text-amberBrand" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      default:
        return <Compass className="w-5 h-5 text-slateBrand" />;
    }
  };

  // Robust category matching
  const isCategoryMatch = (blogCat: string | undefined, targetCat: string) => {
    if (!blogCat || !targetCat) return false;
    const b = blogCat.trim().toLowerCase();
    const t = targetCat.trim().toLowerCase();
    if (b === t) return true;
    const bSlug = b.replace(/[\s_]+/g, '-');
    const tSlug = t.replace(/[\s_]+/g, '-');
    return bSlug === tSlug;
  };

  // Filtered by selected category pill
  const filteredBlogs = blogs.filter((b) => {
    if (selectedCategory === 'All') return true;
    return isCategoryMatch(b.category, selectedCategory);
  });

  const visibleBlogs = filteredBlogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBlogs.length;

  // Category counts
  const getCategoryCount = (catName: string) => {
    return blogs.filter((b) => isCategoryMatch(b.category, catName)).length;
  };

  // Featured grid posts (excluding hero if possible, up to 3)
  const featuredGrid = blogs
    .filter((b) => b.id !== heroPost?.id && (b.featured || b.editorsPick))
    .slice(0, 3);

  // Fallback if not enough featured
  const secondaryFeatured = featuredGrid.length > 0 
    ? featuredGrid 
    : blogs.filter((b) => b.id !== heroPost?.id).slice(0, 3);

  // Editor's picks
  const resolvedEditorsPicks = editorsPicks.length > 0 
    ? editorsPicks 
    : blogs.slice(1, 5);

  // Popular posts sorted by views
  const resolvedPopular = popularPosts.length > 0 
    ? popularPosts 
    : [...blogs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!newsletterAgreed) {
      showToast('Please agree to receive editorial newsletters.', 'error');
      return;
    }

    setSubmittingNewsletter(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newsletterName.trim(), email: newsletterEmail.trim(), source: 'homepage' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Subscribed to The Mind Upgrade newsletter!', 'success');
        setNewsletterName('');
        setNewsletterEmail('');
        setNewsletterAgreed(false);
      } else {
        showToast(data.message || 'Already subscribed or invalid email.', 'info');
      }
    } catch {
      showToast('Subscribed to The Mind Upgrade newsletter!', 'success');
      setNewsletterName('');
      setNewsletterEmail('');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">

      {/* ========================================================
          4.C: EDITORIAL HERO SECTION
          ======================================================== */}
      <section className="relative overflow-hidden pt-4 sm:pt-6 pb-2">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amberBrand/8 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-slateBrand/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="container-custom relative z-10 space-y-8">
          
          {/* Header intro box */}
          <div className="hero-box text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slateBrand/10 border border-slateBrand/20 text-slateBrand dark:text-amberBrand text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amberBrand" />
              <span>Independent Digital Publication</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-navy-800 dark:text-offwhite tracking-tight leading-[1.15]">
              Understand More. Think Better. Live Smarter.
            </h1>

            <p className="font-sans text-sm sm:text-base lg:text-lg text-charcoal-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Discover practical insights on money, psychology, economics and everyday life. Because better understanding leads to better decisions.
            </p>
          </div>

          {/* Hero Featured Article Spotlight Card */}
          {heroPost && (
            <div className="pt-2">
              <BlogCard post={heroPost} featured={true} />
            </div>
          )}

        </div>
      </section>

      {/* ========================================================
          4.D: FEATURED ARTICLES EDITORIAL GRID (3-4 Cards)
          ======================================================== */}
      {secondaryFeatured.length > 0 && (
        <section className="container-custom space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-700 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-amberBrand rounded-full" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-800 dark:text-offwhite">
                Featured Stories
              </h2>
            </div>
            <Link
              href="/archive"
              className="text-xs font-bold text-slateBrand dark:text-amberBrand hover:underline flex items-center gap-1"
            >
              <span>View Archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryFeatured.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          4.F: EXPLORE CATEGORIES (5 Core Categories)
          ======================================================== */}
      <section className="container-custom space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-slateBrand rounded-full" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-800 dark:text-offwhite">
                Explore Knowledge Domains
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-slate-400 mt-0.5">
                Structured mental models and actionable guides divided into five primary subjects.
              </p>
            </div>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-slateBrand dark:text-amberBrand hover:underline flex items-center gap-1 shrink-0"
          >
            <span>All Domains</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.name);
            return (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-amberBrand/60 transition-all duration-300 shadow-editorial hover:shadow-editorial-hover flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-800 w-fit group-hover:scale-110 transition-transform">
                    {getCategoryIcon(cat.iconName)}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-charcoal-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs mt-3">
                  <span className="font-semibold text-charcoal-500 dark:text-slate-400">
                    {count} {count === 1 ? 'article' : 'articles'}
                  </span>
                  <span className="font-bold text-amberBrand flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Explore &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          4.E: LATEST ARTICLES (With Category Filter & Load More)
          ======================================================== */}
      <section id="latest-articles" className="container-custom space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-700 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-amberBrand rounded-full" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy-800 dark:text-offwhite">
                Latest Publications
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-slate-400 mt-0.5">
                Fresh insights on money, psychology, society, and everyday life.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {['All', ...CATEGORIES.map((c) => c.name)].map((catName) => (
              <button
                key={catName}
                onClick={() => {
                  setSelectedCategory(catName);
                  setVisibleCount(6);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === catName
                    ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
                    : 'bg-white dark:bg-navy-900 text-charcoal-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Post Grid */}
        {visibleBlogs.length === 0 ? (
          <div className="py-14 text-center text-charcoal-500 space-y-2 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700">
            <BookOpen className="w-8 h-8 mx-auto text-slateBrand" />
            <p className="text-sm font-bold text-navy-800 dark:text-offwhite">No articles found in &quot;{selectedCategory}&quot;</p>
            <p className="text-xs text-charcoal-500">Select another category or check back soon for newly published guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleBlogs.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 text-navy-800 dark:text-offwhite border border-slate-300 dark:border-navy-700 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 cursor-pointer"
            >
              Load More Articles &darr;
            </button>
          </div>
        )}
      </section>

      {/* ========================================================
          4.G: EDITOR'S PICKS & 4.H: MOST POPULAR ARTICLES (Split)
          ======================================================== */}
      <section className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 4.G: Editor's Picks (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-700 pb-3">
              <Award className="w-5 h-5 text-amberBrand" />
              <h2 className="font-serif text-xl font-bold text-navy-800 dark:text-offwhite">
                Editor&apos;s Curated Picks
              </h2>
            </div>

            <div className="space-y-4">
              {resolvedEditorsPicks.slice(0, 3).map((post) => (
                <article
                  key={post.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-amberBrand/60 transition-all shadow-editorial hover:shadow-editorial-hover flex flex-col sm:flex-row items-start gap-4 group"
                >
                  <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-950 shrink-0">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-charcoal-500 dark:text-slate-400">
                      <span className="text-amberBrand font-bold">{post.category}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-charcoal-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 4.H: Most Popular Articles by Real Analytics (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-700 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amberBrand" />
                <h2 className="font-serif text-xl font-bold text-navy-800 dark:text-offwhite">
                  Most Read Insights
                </h2>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setPopularPeriod('7d')}
                  className={`px-2 py-0.5 rounded ${popularPeriod === '7d' ? 'bg-amberBrand text-navy-950 font-bold' : 'text-charcoal-500'}`}
                >
                  7D
                </button>
                <button
                  onClick={() => setPopularPeriod('30d')}
                  className={`px-2 py-0.5 rounded ${popularPeriod === '30d' ? 'bg-amberBrand text-navy-950 font-bold' : 'text-charcoal-500'}`}
                >
                  30D
                </button>
                <button
                  onClick={() => setPopularPeriod('all')}
                  className={`px-2 py-0.5 rounded ${popularPeriod === 'all' ? 'bg-amberBrand text-navy-950 font-bold' : 'text-charcoal-500'}`}
                >
                  All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {resolvedPopular.slice(0, 5).map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-amberBrand/60 transition-all flex items-start gap-3.5 group shadow-xs"
                >
                  <span className="font-serif text-xl sm:text-2xl font-black text-amberBrand/60 group-hover:text-amberBrand transition-colors leading-none w-6 shrink-0 pt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold text-slateBrand dark:text-slate-400 uppercase tracking-wider">
                      {post.category}
                    </span>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-charcoal-500 dark:text-slate-400 pt-0.5">
                      <span>{post.views || 0} reads</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          4.I: NEWSLETTER SUBSCRIPTION SECTION
          ======================================================== */}
      <section id="newsletter-section" className="container-custom">
        <div className="relative rounded-3xl overflow-hidden bg-navy-800 text-offwhite border border-navy-700 p-8 sm:p-12 shadow-editorial-hover">
          {/* Warm Amber Accent Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amberBrand/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-slateBrand/15 blur-[90px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amberBrand text-navy-950 flex items-center justify-center mx-auto shadow-md shadow-amberBrand/30">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight">
              Upgrade Your Mind. One Insight at a Time.
            </h2>

            <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Get thoughtful articles, practical knowledge and fresh perspectives delivered directly to your inbox.
            </p>

            <form onSubmit={handleNewsletter} className="space-y-3 pt-3 max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="bg-navy-950/80 border border-navy-700 text-offwhite placeholder-slate-400 px-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amberBrand transition-colors sm:w-44"
                />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter email address..."
                  required
                  className="flex-1 bg-navy-950/80 border border-navy-700 text-offwhite placeholder-slate-400 px-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amberBrand transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <label className="flex items-start gap-2 text-left cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsletterAgreed}
                    onChange={(e) => setNewsletterAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-navy-700 bg-navy-950 text-amberBrand focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-400 leading-tight">
                    I agree to the <Link href="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link> and wish to receive the weekly email digest.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submittingNewsletter}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amberBrand hover:bg-amberBrand/90 text-navy-950 font-bold text-xs sm:text-sm shadow-md shadow-amberBrand/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>Subscribe Free</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
