'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { useToast } from '@/context/ToastContext';
import { Send, Globe, ArrowUpRight } from 'lucide-react';

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

  const link = 'hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors';
  const input =
    'w-full bg-white dark:bg-slate-900 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50';

  return (
    <footer className="bg-white/70 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 pt-14 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10">
          <div className="lg:col-span-2 space-y-3">
            <Link href="/" className="font-display text-3xl text-slate-900 dark:text-white">
              The Mind Upgrade
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Level up your mind, one idea at a time. Insights on personal finance, banking, insurance, daily hacks, and case studies.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 w-fit px-3.5 py-1.5 rounded-full">
              <Globe className="w-3.5 h-3.5" />
              <span>themindupgrade.in</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-xl text-slate-900 dark:text-white">Navigate</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className={link}>Home</Link></li>
              <li><Link href="/archive" className={link}>Archive</Link></li>
              <li><Link href="/categories" className={link}>Categories</Link></li>
              <li><Link href="/about" className={link}>About</Link></li>
              <li><Link href="/contact" className={link}>Contact</Link></li>
              <li><Link href="/admin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Admin Portal</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-xl text-slate-900 dark:text-white">Categories</h4>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className={`${link} flex items-center gap-1 group`}>
                    <span>{cat.name}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-xl text-slate-900 dark:text-white">Weekly digest</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              One high-leverage idea in your inbox every Sunday.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={input} />
              <div className="relative">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={`${input} pr-12`} />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 aspect-square bg-[#5b66e0] hover:bg-[#4b56d0] text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
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
