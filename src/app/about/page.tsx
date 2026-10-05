import React from 'react';
import Link from 'next/link';
import { Sparkles, User, BookOpen, Lightbulb, ArrowRight, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'About the Author & Blog | The Mind Upgrade',
  description: 'Learn about Gaurav Kumar Singh and the story behind The Mind Upgrade (themindupgrade.in).',
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Vision &amp; Story</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Upgrading Minds, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500">
            One Practical Insight at a Time.
          </span>
        </h1>
      </div>

      {/* About the Author Section Card */}
      <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">About the Author</h2>
            <span className="text-xs text-indigo-600 dark:text-cyan-400 font-bold block">Gaurav Kumar Singh — Founder &amp; Curious Mind</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Author Image */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-sm sm:max-w-xs">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-md opacity-25 group-hover:opacity-40 transition-opacity" />
              <img
                src="/images/gaurav-kumar-singh.jpg"
                alt="Gaurav Kumar Singh"
                className="relative w-full h-auto aspect-square object-cover rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md"
              />
            </div>
          </div>

          {/* Author Bio Text */}
          <div className="md:col-span-7 space-y-4 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
            <p className="font-semibold text-slate-900 dark:text-white text-lg">
              Hi, I’m Gaurav Kumar Singh — the curious mind behind The Mind Upgrade.
            </p>
            <p>
              I’m passionate about simplifying life’s everyday challenges — especially when it comes to money, finance, and practical knowledge we all wish we’d learned in school. With a background in engineering and a love for learning, I created this space to share what I discover, in the most relatable way possible.
            </p>
            <p className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 font-medium text-sm">
              If you’re into smart tips, real talk, and levelling up your life one insight at a time, let’s grow together!
            </p>
          </div>
        </div>
      </section>

      {/* About the Blog Section Card */}
      <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">About the Blog</h2>
            <span className="text-xs text-slate-500 block">Your go-to blog for smart, simple, and practical knowledge</span>
          </div>
        </div>

        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
          <p className="font-semibold text-slate-900 dark:text-white text-lg">
            Welcome to The Mind Upgrade — your go-to blog for smart, simple, and practical knowledge.
          </p>
          <p>
            Here, I break down the complex stuff — money, banking, insurance, and everyday life tips — into clear, bite-sized reads. Whether you’re trying to save smarter, understand your bank better, or just learn something new every day, you’re in the right place.
          </p>
          <p>
            No jargon. No fluff. Just real-world knowledge to help you upgrade your mind — one article at a time.
          </p>

          <div className="pt-4">
            <div className="p-6 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-7 h-7 text-amber-400 shrink-0" />
                <div>
                  <span className="block text-xs uppercase font-extrabold text-amber-400 tracking-wider">Our Motto</span>
                  <span className="text-lg font-extrabold text-white">Because smart living starts with smart learning.</span>
                </div>
              </div>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shrink-0 transition-all shadow-md shadow-indigo-600/30"
              >
                <span>Explore Articles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section Card */}
      <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Disclaimer</h2>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block">Important Notice for Our Readers</span>
          </div>
        </div>

        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
          <p className="font-semibold text-slate-900 dark:text-white text-lg">
            Dear Readers,
          </p>
          <p>
            I do MY best to make sure that the information shared on this website is accurate and useful, based on MY knowledge and research. However, information can change, and I may occasionally get something wrong.
          </p>
          <p>
            So, if something is important to you or could affect your money, health, career, or other major decisions, please do your own research and consider discussing it with a qualified expert before taking action.
          </p>
          <p className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 font-medium text-sm">
            I&apos;m here to share knowledge and ideas—not to replace professional advice.
          </p>
        </div>
      </section>

    </div>
  );
}
