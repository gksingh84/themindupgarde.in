import React from 'react';
import Link from 'next/link';
import { Sparkles, Home, Layers, Archive, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | The Mind Upgrade',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-6">
        
        {/* Graphic */}
        <div className="w-20 h-20 rounded-3xl bg-indigo-950/80 text-cyan-400 border border-indigo-800/60 flex items-center justify-center mx-auto shadow-2xl relative">
          <Sparkles className="w-10 h-10 animate-pulse" />
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Idea Node Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The page or article you are looking for has been moved, renamed, or does not exist in our mental repository.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-semibold">
          <Link
            href="/"
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-500 flex flex-col items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/categories"
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-400 flex flex-col items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>Categories</span>
          </Link>
          <Link
            href="/archive"
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-violet-400 flex flex-col items-center gap-1.5"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </Link>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
