'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Sparkles, Smartphone, ExternalLink } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export interface SharePostData {
  title: string;
  slug: string;
  coverImage?: string;
  category?: string;
  readTime?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SharePostData;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true);
    }
  }, []);

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Construct absolute canonical URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://themindupgrade.in';
  const postUrl = `${origin}/blog/${post.slug}`;
  const encodedUrl = encodeURIComponent(postUrl);
  const shareTitle = `"${post.title}" — The Mind Upgrade`;
  const shareSummary = `Read "${post.title}" on The Mind Upgrade: ${postUrl}`;
  const encodedText = encodeURIComponent(shareSummary);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const input = document.createElement('input');
        input.value = postUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      showToast('Article link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy link automatically.', 'error');
    }
  };

  const handleWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title}\n\nRead more: ${postUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const tweetText = encodeURIComponent(`"${post.title}" via @TheMindUpgrade`);
    const twUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${tweetText}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedIn = () => {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(liUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInstagram = async () => {
    // If mobile native share is available, it allows sharing directly to Instagram Stories / Feed / Direct
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out "${post.title}" on The Mind Upgrade`,
          url: postUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback: Copy link and offer to open Instagram
    await handleCopyLink();
    showToast('Link copied! Paste it in your Instagram Story, Bio, or DM.', 'info');
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Read "${post.title}" on The Mind Upgrade`,
          url: postUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-navy-800 dark:text-offwhite transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between bg-slate-50/60 dark:bg-navy-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amberBrand/15 text-amberBrand flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="share-modal-title" className="font-serif text-base sm:text-lg font-bold tracking-tight">
                Share this Story
              </h3>
              <p className="text-xs text-charcoal-500 dark:text-slate-400">
                Spread ideas with your network & community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-charcoal-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Preview Card */}
        <div className="p-5 border-b border-slate-100 dark:border-navy-800 bg-slate-50/30 dark:bg-navy-950/20">
          <div className="flex items-center gap-3.5">
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-navy-700 shadow-sm"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              {post.category && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slateBrand/10 text-slateBrand dark:text-amberBrand">
                  {post.category}
                </span>
              )}
              <h4 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite line-clamp-2 leading-snug">
                {post.title}
              </h4>
              {post.readTime && (
                <span className="text-[11px] text-charcoal-400 dark:text-slate-500">
                  {post.readTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Social Platforms Grid */}
        <div className="p-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-slate-500">
            Share directly to
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.144 4.178 4.287-1.123z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">WhatsApp</div>
                <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Chat & Status</div>
              </div>
            </button>

            {/* Twitter / X */}
            <button
              onClick={handleTwitter}
              className="flex items-center gap-3 p-3 rounded-2xl border border-slate-300 dark:border-navy-700 bg-slate-100/60 dark:bg-navy-800/60 hover:bg-slate-200/80 dark:hover:bg-navy-700 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-black dark:bg-offwhite text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">X (Twitter)</div>
                <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Post & Tag</div>
              </div>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleLinkedIn}
              className="flex items-center gap-3 p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">LinkedIn</div>
                <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Professional Feed</div>
              </div>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebook}
              className="flex items-center gap-3 p-3 rounded-2xl border border-blue-600/20 bg-blue-600/5 hover:bg-blue-600/15 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.82 0-1.611.162-2.007.606-.396.444-.45 1.149-.45 2.115v1.264h4.354l-.57 3.667h-3.784v7.98c5.44-.757 9.61-5.438 9.61-11.085C24 6.012 18.627.639 12 .639S0 6.012 0 12.606c0 5.647 4.17 10.328 9.101 11.085z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Facebook</div>
                <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Feed & Groups</div>
              </div>
            </button>

            {/* Instagram */}
            <button
              onClick={handleInstagram}
              className="flex items-center gap-3 p-3 rounded-2xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/15 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Instagram</div>
                <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Story & DM</div>
              </div>
            </button>

            {/* Native OS Share (if supported) or Email */}
            {hasNativeShare ? (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-3 p-3 rounded-2xl border border-amberBrand/30 bg-amberBrand/5 hover:bg-amberBrand/15 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-amberBrand flex items-center justify-center text-navy-950 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">More Apps</div>
                  <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Phone Share Sheet</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`Check out this insightful article on The Mind Upgrade:\n\n${post.title}\n${postUrl}`)}`;
                }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 text-navy-900 dark:text-white transition-all group cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">Email</div>
                  <div className="text-[10px] text-charcoal-400 dark:text-slate-400">Send by Mail</div>
                </div>
              </button>
            )}
          </div>

          {/* Copy Link Section */}
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 dark:text-slate-500 mb-2">
              Or copy link
            </div>
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <input
                type="text"
                readOnly
                value={postUrl}
                className="w-full bg-transparent text-xs text-charcoal-700 dark:text-slate-300 focus:outline-none select-all font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-amberBrand text-navy-950 hover:bg-amber-400 shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
