import React from 'react';
import Link from 'next/link';
import { Sparkles, User, BookOpen, Lightbulb, ArrowRight, ShieldCheck, Compass, Coins, Brain, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'About the Publication & Author | The Mind Upgrade',
  description: 'The story, philosophy, and mission behind The Mind Upgrade (themindupgrade.in).',
};

export default function AboutPage() {
  return (
    <div className="container-custom py-10 sm:py-16 max-w-5xl space-y-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slateBrand/10 text-slateBrand dark:text-amberBrand border border-slateBrand/20">
          <Sparkles className="w-3.5 h-3.5 text-amberBrand" />
          <span>Our Vision &amp; Mission</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-navy-800 dark:text-offwhite tracking-tight leading-tight">
          Fresh Insights for a Smarter Life.
        </h1>

        <p className="font-sans text-sm sm:text-base text-charcoal-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          The Mind Upgrade is an independent publishing platform designed to help ordinary people understand money, psychology, modern economics, and practical everyday decision making.
        </p>
      </div>

      {/* About the Author Section */}
      <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-navy-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amberBrand/20 text-amberBrand flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy-800 dark:text-offwhite">About the Founder</h2>
            <span className="text-xs text-amberBrand font-bold block">Gaurav Kumar Singh — Founder &amp; Author</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Author Image */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-xs">
              <div className="absolute -inset-1 bg-amberBrand/20 rounded-3xl blur-md" />
              <img
                src="/images/gaurav-kumar-singh.jpg"
                alt="Gaurav Kumar Singh"
                className="relative w-full h-auto aspect-square object-cover rounded-2xl border-2 border-slate-200 dark:border-navy-700 shadow-md"
              />
            </div>
          </div>

          {/* Author Story */}
          <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-charcoal-700 dark:text-slate-300 leading-relaxed">
            <p>
              Hi, I&apos;m <strong>Gaurav Kumar Singh</strong>. I created <strong>The Mind Upgrade</strong> because I realized that the most critical domains governing our quality of life—how money compounds, how insurance policies actually settle claims, how cognitive biases deceive us, and how macroeconomic tides affect everyday citizens—are rarely explained in a clear, objective, and practical manner.
            </p>
            <p>
              My goal is to deconstruct complex topics into actionable mental models. Whether dissecting the mathematical difference between term insurance and endowment plans, or analyzing the second-order consequences of central bank policies, our commitment is simple: <em>never publish fluff, prioritize research rigor, and respect the reader&apos;s time.</em>
            </p>
          </div>
        </div>
      </section>

      {/* Core Knowledge Pillars */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-800 dark:text-offwhite">
            Our Five Editorial Pillars
          </h2>
          <p className="text-xs text-charcoal-500 dark:text-slate-400">
            Every published guide falls squarely within one of these essential domains.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-amberBrand/15 w-fit text-amberBrand">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">Personal Finance</h3>
            <p className="text-xs text-charcoal-600 dark:text-slate-400 leading-relaxed">
              Systematic wealth accumulation, the 50/30/20 cash flow rule, smart debt pay-off, and retirement compounding.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-slateBrand/15 w-fit text-slateBrand">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">Insurance Awareness</h3>
            <p className="text-xs text-charcoal-600 dark:text-slate-400 leading-relaxed">
              Understanding room rent caps, pre-existing condition exclusions, pure term life covers, and claim settlements.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-navy-800/20 text-navy-800 dark:text-amberBrand w-fit">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">Psychology &amp; Growth</h3>
            <p className="text-xs text-charcoal-600 dark:text-slate-400 leading-relaxed">
              Second-order thinking, cognitive biases, dopamine management, habit architectures, and stoic equilibrium.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 w-fit">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">Economy &amp; Current Affairs</h3>
            <p className="text-xs text-charcoal-600 dark:text-slate-400 leading-relaxed">
              Macroeconomic trends, RBI monetary policy committee decisions, inflation dynamics, and global supply chains.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 w-fit">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">Daily Insights</h3>
            <p className="text-xs text-charcoal-600 dark:text-slate-400 leading-relaxed">
              Everyday consumer rights, retail psychological traps, dark UX patterns in apps, and practical life hacks.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="p-8 sm:p-12 rounded-3xl bg-navy-800 text-offwhite border border-navy-700 text-center space-y-4">
        <h2 className="font-serif text-2xl sm:text-3xl font-black">
          Join Thoughtful Thinkers Across the Globe
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Level up your personal sovereignty, understand the forces shaping your money and mind, and make better decisions every single day.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-amberBrand hover:bg-amberBrand/90 text-navy-950 font-bold text-xs shadow-md transition-all"
          >
            Explore Publications &rarr;
          </Link>
        </div>
      </section>

    </div>
  );
}
