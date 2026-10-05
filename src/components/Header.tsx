'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Search, Menu, X, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Archive', href: '/archive' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 backdrop-blur-xl ${
        scrolled
          ? 'bg-white/85 dark:bg-slate-950/85 shadow-[0_8px_30px_-20px_rgba(79,92,200,0.4)]'
          : 'bg-white/60 dark:bg-slate-950/60'
      }`}
    >
      <div className="container-custom h-[88px] flex items-center justify-between gap-6">
        <Link href="/" className="flex flex-col shrink-0">
          <span className="font-display text-[28px] sm:text-[32px] leading-none text-slate-900 dark:text-white">
            The Mind Upgrade
          </span>
          <span className="font-semibold text-[10px] sm:text-[11px] tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase mt-1.5">
            Fresh insights for a smarter life
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 mr-auto ml-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onSearchClick && (
            <>
              <button
                onClick={onSearchClick}
                className="hidden sm:flex items-center gap-2.5 pl-4 pr-8 py-3 rounded-full bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[15px] font-medium hover:bg-white transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
                <span>Search articles...</span>
              </button>
              <button
                onClick={onSearchClick}
                className="sm:hidden p-2.5 rounded-full bg-white/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
            title="Toggle light/dark theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <Link
            href="/#subscribe"
            className="hidden sm:inline-flex px-7 py-3.5 rounded-full bg-[#0f1424] text-white text-[15px] font-semibold shadow-lg shadow-slate-900/20 hover:bg-[#1c2340] transition-colors"
          >
            Subscribe
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-full bg-white/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            aria-label="Open mobile navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-4 pb-6 space-y-2 animate-fade-in shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                pathname === link.href
                  ? 'bg-[#0f1424] text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/#subscribe"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-sm font-semibold bg-[#5b66e0] text-white text-center"
          >
            Subscribe
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-4 pt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Panel</span>
          </Link>
        </div>
      )}
    </header>
  );
}
