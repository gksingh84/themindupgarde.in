'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 p-8 rounded-3xl shadow-editorial">
        <div className="w-16 h-16 rounded-2xl bg-amberBrand/10 text-amberBrand flex items-center justify-center mx-auto border border-amberBrand/20">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-navy-800 dark:text-offwhite">
            Something went wrong
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 dark:text-slate-400 leading-relaxed">
            We encountered a temporary issue while loading this page. You can try refreshing the view or return to the main publication.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-amberBrand hover:bg-amber-400 text-navy-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-charcoal-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-charcoal-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
