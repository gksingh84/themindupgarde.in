'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { useToast } from '@/context/ToastContext';
import { 
  Send, 
  Globe, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Mail
} from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please confirm your consent to receive newsletter updates.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source: 'footer' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Thank you for subscribing to The Mind Upgrade!', 'success');
        setEmail('');
        setName('');
        setAgreed(false);
      } else {
        showToast(data.message || 'Already subscribed or invalid email.', 'info');
      }
    } catch {
      showToast('Thank you for subscribing to The Mind Upgrade!', 'success');
      setEmail('');
      setName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#14243A] text-slate-300 border-t border-navy-700/60 pt-12 pb-8 relative overflow-hidden transition-colors">
      
      {/* Subtle Warm Amber Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amberBrand/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="container-custom relative z-10 space-y-10">
        
        {/* Main 4-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-navy-700/60">
          
          {/* Column 1 & 2: Brand Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amberBrand shadow-md shadow-amberBrand/20 shrink-0 flex items-center justify-center bg-amberBrand group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.png" alt="The Mind Upgrade Emblem" className="w-full h-full object-cover scale-[1.12]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-lg tracking-tight text-white group-hover:text-amberBrand transition-colors">
                  THE MIND UPGRADE
                </span>
                <span className="font-sans font-bold text-[9px] tracking-widest text-slate-400 uppercase">
                  FRESH INSIGHTS FOR A SMARTER LIFE
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              An independent digital publication dedicated to helping thoughtful readers master money, psychology, modern economics, and practical life knowledge.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-amberBrand bg-amberBrand/10 border border-amberBrand/20 px-3 py-1 rounded-full">
                <Globe className="w-3.5 h-3.5" />
                <span className="font-mono">themindupgrade.in</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>contact@themindupgrade.in</span>
              </div>
            </div>
          </div>

          {/* Column 3: Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide uppercase">
              Publication
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-amberBrand transition-colors">
                  Home Page
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amberBrand transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-amberBrand transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link href="/archive" className="hover:text-amberBrand transition-colors">
                  Archive Index
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amberBrand transition-colors">
                  Editorial Inquiries
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-amberBrand hover:underline inline-flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin CMS</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Content Categories */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide uppercase">
              Knowledge Domains
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="hover:text-amberBrand transition-colors flex items-center justify-between group"
                  >
                    <span>{cat.name}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amberBrand" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Newsletter Subscription */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide uppercase">
              Newsletter
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Get thoughtful articles and fresh perspectives delivered directly to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name (Optional)"
                className="w-full bg-navy-950/80 border border-navy-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amberBrand transition-colors"
              />
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full bg-navy-950/80 border border-navy-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amberBrand transition-colors pr-10"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-amberBrand hover:bg-amberBrand/90 text-navy-950 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Submit newsletter subscription"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-navy-700 bg-navy-950 text-amberBrand focus:ring-0"
                />
                <span className="text-[10px] text-slate-400 leading-tight">
                  I agree to receive editorial newsletters and accept the{' '}
                  <Link href="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link>.
                </span>
              </label>
            </form>
          </div>

        </div>

        {/* Legal & Editorial Policy Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </Link>
            <Link href="/cookie-policy" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <Link href="/editorial-policy" className="hover:text-white transition-colors">
              Editorial Policy
            </Link>
            <Link href="/write-for-us" className="hover:text-white transition-colors">
              Write for Us
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-lg bg-navy-950/60 hover:text-amberBrand transition-colors" 
              aria-label="X / Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-lg bg-navy-950/60 hover:text-amberBrand transition-colors" 
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-lg bg-navy-950/60 hover:text-amberBrand transition-colors" 
              aria-label="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 border-t border-navy-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} THE MIND UPGRADE (themindupgrade.in). All rights reserved.
          </p>
          <p className="text-[11px] text-slate-400">
            Independent publication. Not investment or legal advice.
          </p>
        </div>

      </div>
    </footer>
  );
}
