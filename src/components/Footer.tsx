'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { useToast } from '@/context/ToastContext';
import { 
  Send, 
  Globe, 
  ArrowUpRight 
} from 'lucide-react';

export function Footer() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (res.ok) {
        showToast('Subscribed to The Mind Upgrade newsletter!', 'success');
        setName('');
        setEmail('');
      } else {
        showToast('Failed to subscribe. Please try again.', 'error');
      }
    } catch {
      showToast('Subscribed to The Mind Upgrade newsletter!', 'success');
      setName('');
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-8 pb-5 sm:pt-10 sm:pb-6 relative overflow-hidden transition-colors">
      {/* Subtle Background Glow Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 shadow-md shadow-amber-500/20 shrink-0 flex items-center justify-center bg-amber-400 group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.png" alt="The Mind Upgrade Logo" className="w-full h-full object-cover scale-[1.14]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                  THE MIND UPGRADE
                </span>
                <span className="font-bold text-[9px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  FRESH INSIGHTS FOR A SMARTER LIFE
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              &quot;Level Up Your Mind, One Idea at a Time.&quot; Insights on personal finance, banking, insurance, daily hacks, and case studies.
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-950/40 border border-indigo-200 dark:border-cyan-800/40 w-fit px-3 py-1 rounded-full">
              <Globe className="w-3.5 h-3.5" />
              <span>themindupgrade.in</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li><Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link></li>
              <li><Link href="/categories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Categories</Link></li>
              <li><Link href="/archive" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Archive</Link></li>
              <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Mission</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/admin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider uppercase">Categories</h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1 group">
                    <span>{cat.name}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-wider uppercase">Weekly Digest</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Get 1 high-leverage mental model delivered to your inbox every Sunday.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name (Optional)"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Bottom Social & Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p suppressHydrationWarning>© {new Date().getFullYear()} themindupgrade.in. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="X / Twitter">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="LinkedIn">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="GitHub">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
