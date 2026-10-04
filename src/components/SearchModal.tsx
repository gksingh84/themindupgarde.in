'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { BlogPost } from '@/types/blog';
import { Search, X, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

export function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlogPost[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(posts.slice(0, 5));
      return;
    }

    const fuse = new Fuse(posts, {
      keys: ['title', 'excerpt', 'category', 'tags'],
      threshold: 0.3,
    });

    const searchRes = fuse.search(query).map((res) => res.item);
    setResults(searchRes);
  }, [query, posts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-indigo-950/50">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mental models, deep work, AI, habits..."
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Search Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 pb-2">
            <span>{query ? `Results (${results.length})` : 'Popular Searches'}</span>
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm">No articles found matching &quot;{query}&quot;</p>
              <p className="text-xs text-slate-600">Try searching for productivity, mindset, or AI.</p>
            </div>
          ) : (
            results.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={onClose}
                className="group flex items-start gap-4 p-3 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700/60"
              >
                <div className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 relative">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950 text-cyan-400 border border-indigo-800/50">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                    {post.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {post.excerpt}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all self-center" />
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
