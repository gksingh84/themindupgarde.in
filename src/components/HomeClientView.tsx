'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { CATEGORIES } from '@/data/categories';
import { BlogCard } from '@/components/BlogCard';
import { useToast } from '@/context/ToastContext';
import { 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Building2,
  ShieldCheck,
  FileText,
  Send,
  Layers,
  Sparkles,
  Compass
} from 'lucide-react';

interface HomeClientViewProps {
  initialBlogs: BlogPost[];
  featuredPost: BlogPost;
}

export function HomeClientView({ initialBlogs, featuredPost }: HomeClientViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { showToast } = useToast();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-amber-500" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-cyan-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Zap': return <Zap className="w-5 h-5 text-indigo-600" />;
      case 'FileText': return <FileText className="w-5 h-5 text-purple-600" />;
      default: return <Compass className="w-5 h-5 text-blue-600" />;
    }
  };

  const filteredBlogs = initialBlogs.filter((b) => {
    if (selectedCategory === 'All') return true;
    return b.category.toLowerCase() === selectedCategory.toLowerCase();
  });

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
        body: JSON.stringify({ name: newsletterName.trim(), email: newsletterEmail.trim() }),
      });
      if (res.ok) {
        showToast('Welcome to The Mind Upgrade newsletter!', 'success');
        setNewsletterName('');
        setNewsletterEmail('');
      } else {
        showToast('Failed to subscribe. Please try again.', 'error');
      }
    } catch {
      showToast('Welcome to The Mind Upgrade newsletter!', 'success');
      setNewsletterName('');
      setNewsletterEmail('');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-2 pb-1 lg:pt-3 lg:pb-2">
        {/* Soft Background Glow Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 dark:bg-amber-600/15 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[380px] h-[380px] bg-indigo-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="container-custom relative z-10 text-center space-y-3">
          
          {/* Logo Icon Emblem */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden border-4 border-amber-400 dark:border-amber-400/90 shadow-2xl shadow-amber-500/30 flex items-center justify-center bg-amber-400 hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="The Mind Upgrade Emblem" className="w-full h-full object-cover scale-[1.14]" />
          </div>

          {/* Headline & Subheading */}
          <div className="hero-box space-y-1.5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-center leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500">
                THE MIND UPGRADE
              </span>
            </h1>

            <h2 className="text-xs sm:text-base lg:text-lg font-extrabold tracking-widest text-slate-800 dark:text-slate-100 text-center uppercase">
              FRESH INSIGHTS FOR A SMARTER LIFE
            </h2>

            {/* Tagline */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-center pt-0.5">
              Deconstruct complex mental models, master deep focus protocols, explore high-leverage technology, and build sustainable wealth.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-0.5 max-w-md mx-auto">
            <a
              href="#latest-articles"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <span>Explore Articles</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/categories"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Browse Categories</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Featured Post Section */}
      {featuredPost && (
        <section className="container-custom pt-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              ★ Highlighted Article
            </h2>
          </div>
          <BlogCard post={featuredPost} featured={true} />
        </section>
      )}

      {/* Categories Preview Strip */}
      <section className="container-custom">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Explore Knowledge Domains
          </h2>
          <Link
            href="/categories"
            className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 space-y-2 flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 w-fit group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.iconName)}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Blogs Section with Category Pills Filter */}
      <section id="latest-articles" className="container-custom space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Latest Intel &amp; Articles
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Curated thoughts on self-upgrade, systems, and modern wisdom.
            </p>
          </div>

          {/* Category Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {['All', ...CATEGORIES.map((c) => c.name)].map((catName) => (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === catName
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {filteredBlogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Compass className="w-8 h-8 mx-auto text-slate-400 animate-spin" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No articles found in &quot;{selectedCategory}&quot;</p>
            <p className="text-xs text-slate-500">Select another category or add a new article from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredBlogs.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Signup Banner - Compact & Light Theme */}
      <section className="container-custom">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-50/90 via-white to-amber-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/60 border border-blue-100 dark:border-slate-800 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          {/* Subtle Accent Glow */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            
            {/* Left: Icon & Headline */}
            <div className="flex items-center gap-3.5 max-w-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Upgrade Your Brain Weekly
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                  Join 15,000+ thinkers. Receive 1 actionable mental model every Sunday. Zero spam.
                </p>
              </div>
            </div>

            {/* Right: Inline Input & Subscribe Button */}
            <form onSubmit={handleNewsletter} className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <input
                type="text"
                value={newsletterName}
                onChange={(e) => setNewsletterName(e.target.value)}
                placeholder="Your Name (Optional)"
                className="w-full sm:w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
              />
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter email address..."
                className="w-full sm:w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <span>Subscribe Free</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        </div>
      </section>
    </div>
  );
}
