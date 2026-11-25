'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORIES } from '@/data/categories';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldCheck, 
  Bell, 
  ArrowRight,
  Mail
} from 'lucide-react';

interface HeaderProps {
  onSearchClick?: () => void;
  onSubscribeClick?: () => void;
}

export function Header({ onSearchClick, onSubscribeClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown and drawer on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const navCategories = [
    { name: 'Personal Finance', href: '/categories/personal-finance', slug: 'personal-finance' },
    { name: 'Insurance', href: '/categories/insurance', slug: 'insurance' },
    { name: 'Psychology', href: '/categories/psychology-and-self-improvement', slug: 'psychology-and-self-improvement' },
    { name: 'Economy', href: '/categories/economy-and-current-affairs', slug: 'economy-and-current-affairs' },
    { name: 'Daily Insights', href: '/categories/daily-insights', slug: 'daily-insights' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Editorial Navigation Bar */}
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? 'bg-white/98 dark:bg-[#0E1724]/98 backdrop-blur-xl border-b border-slate-200/80 dark:border-navy-700/80 shadow-editorial'
            : 'bg-white/95 dark:bg-[#0E1724]/95 backdrop-blur-md border-b border-slate-200/50 dark:border-navy-800/60'
        }`}
      >
        <div className="max-w-[1440px] mx-auto h-18 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo / Brand Name & Tagline */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 py-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-amberBrand shadow-md shadow-amberBrand/20 shrink-0 flex items-center justify-center bg-amberBrand group-hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="The Mind Upgrade Emblem" className="w-full h-full object-cover scale-[1.12]" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-serif font-black text-base sm:text-lg tracking-tight text-navy-800 dark:text-offwhite group-hover:text-amberBrand transition-colors whitespace-nowrap leading-tight">
                THE MIND UPGRADE
              </span>
              <span className="font-sans font-bold text-[8.5px] sm:text-[9.5px] tracking-widest text-slateBrand dark:text-slate-400 uppercase whitespace-nowrap mt-0.5">
                FRESH INSIGHTS FOR A SMARTER LIFE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Never Wrap Text) */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2 shrink-0">
            <Link
              href="/"
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs 2xl:text-[13px] font-semibold tracking-wide transition-all ${
                pathname === '/'
                  ? 'text-amberBrand font-bold bg-amberBrand/10 dark:bg-amberBrand/15'
                  : 'text-charcoal-700 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-navy-800/60'
              }`}
            >
              Home
            </Link>

            {navCategories.map((cat) => {
              const fullCategory = CATEGORIES.find((c) => c.slug === cat.slug);
              const isActive = pathname.startsWith(`/categories/${cat.slug}`);

              return (
                <div
                  key={cat.slug}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(cat.slug)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={cat.href}
                    className={`whitespace-nowrap px-2.5 2xl:px-3 py-2 rounded-xl text-xs 2xl:text-[13px] font-semibold tracking-wide flex items-center gap-1 transition-all ${
                      isActive
                        ? 'text-amberBrand font-bold bg-amberBrand/10 dark:bg-amberBrand/15'
                        : 'text-charcoal-700 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-navy-800/60'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-charcoal-400 dark:text-slate-400 group-hover:text-amberBrand ${activeDropdown === cat.slug ? 'rotate-180 text-amberBrand' : ''}`} />
                  </Link>

                  {/* Dropdown Menu for Subcategories */}
                  {activeDropdown === cat.slug && fullCategory && (
                    <div className="absolute top-full left-0 w-80 pt-2 animate-fade-in z-50">
                      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-editorial-hover p-2.5 space-y-1">
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-navy-800 text-[10px] font-extrabold uppercase tracking-wider text-slateBrand dark:text-slate-400">
                          {fullCategory.name} Domains
                        </div>
                        {fullCategory.subcategories.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={`/categories/${cat.slug}?sub=${sub.slug}`}
                            className="block px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-navy-800/80 transition-colors group/item"
                          >
                            <div className="font-semibold text-charcoal-800 dark:text-slate-200 group-hover/item:text-amberBrand">
                              {sub.name}
                            </div>
                            <div className="text-[10.5px] text-charcoal-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-snug">
                              {sub.description}
                            </div>
                          </Link>
                        ))}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-navy-800">
                          <Link
                            href={cat.href}
                            className="block px-3 py-1.5 text-xs font-bold text-amberBrand hover:underline text-center"
                          >
                            Explore all {cat.name} articles &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href="/about"
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs 2xl:text-[13px] font-semibold tracking-wide transition-all ${
                pathname === '/about'
                  ? 'text-amberBrand font-bold bg-amberBrand/10 dark:bg-amberBrand/15'
                  : 'text-charcoal-700 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-navy-800/60'
              }`}
            >
              About
            </Link>
          </nav>

          {/* Action CTAs: Search, Theme Toggle, Subscribe, Admin */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={onSearchClick}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-navy-900 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand dark:hover:text-amberBrand border border-slate-200 dark:border-navy-700 transition-all cursor-pointer"
              title="Search articles"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-navy-900 text-charcoal-700 dark:text-slate-300 hover:text-amberBrand dark:hover:text-amberBrand border border-slate-200 dark:border-navy-700 transition-all cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amberBrand" />
              ) : (
                <Moon className="w-4 h-4 text-navy-800" />
              )}
            </button>

            {/* Subscribe CTA Button */}
            <button
              onClick={onSubscribeClick || (() => {
                const el = document.getElementById('newsletter-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              })}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amberBrand hover:bg-amberBrand/90 text-navy-950 shadow-sm shadow-amberBrand/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Subscribe</span>
            </button>

            {/* Admin Portal Quick Link */}
            <Link
              href="/admin"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slateBrand/10 text-slateBrand dark:text-slate-300 hover:bg-navy-800 hover:text-white dark:hover:bg-amberBrand dark:hover:text-navy-950 border border-slate-200 dark:border-navy-700 transition-all whitespace-nowrap"
              title="CMS Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-navy-900 text-charcoal-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-200 dark:border-navy-700 bg-white/98 dark:bg-navy-900/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-editorial-hover max-h-[85vh] overflow-y-auto">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              pathname === '/' ? 'bg-amberBrand text-navy-950 font-bold' : 'text-charcoal-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            Home
          </Link>

          <div className="space-y-1">
            <div className="px-3 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slateBrand dark:text-slate-400">
              Publication Domains
            </div>
            {navCategories.map((cat) => {
              const fullCategory = CATEGORIES.find((c) => c.slug === cat.slug);
              const isExpanded = mobileExpandedCat === cat.slug;

              return (
                <div key={cat.slug} className="rounded-xl overflow-hidden border border-slate-100 dark:border-navy-800">
                  <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-navy-800/50">
                    <Link
                      href={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-bold text-charcoal-900 dark:text-slate-200 hover:text-amberBrand whitespace-nowrap"
                    >
                      {cat.name}
                    </Link>
                    <button
                      onClick={() => setMobileExpandedCat(isExpanded ? null : cat.slug)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      aria-label={`Expand ${cat.name} subcategories`}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180 text-amberBrand' : ''}`} />
                    </button>
                  </div>
                  {isExpanded && fullCategory && (
                    <div className="px-3 py-2 space-y-1.5 bg-white dark:bg-navy-900 border-t border-slate-100 dark:border-navy-800">
                      {fullCategory.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/categories/${cat.slug}?sub=${sub.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-xs py-1 text-charcoal-600 dark:text-slate-400 hover:text-amberBrand"
                        >
                          • {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-navy-800 space-y-2">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-xs font-semibold text-charcoal-700 dark:text-slate-300 hover:text-amberBrand"
            >
              About The Mind Upgrade
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-1.5 text-xs font-semibold text-charcoal-700 dark:text-slate-300 hover:text-amberBrand"
            >
              Contact &amp; Inquiries
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amberBrand hover:underline"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>CMS Admin Panel</span>
            </Link>
          </div>
        </div>
      )}

    </header>
  );
}
