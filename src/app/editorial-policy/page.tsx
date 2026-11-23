import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Editorial Policy | The Mind Upgrade',
  description: 'Our editorial standards, research rigor, independence, and fact-checking protocols.',
};

export default function EditorialPolicyPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-navy-700 pb-6">
        <span className="text-xs font-bold text-amberBrand uppercase tracking-wider">Publishing Standards</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite">
          Editorial Policy
        </h1>
        <p className="text-xs text-charcoal-500">Last updated: November 2026</p>
      </div>

      <div className="prose-editorial">
        <h2>1. Commitment to Truth &amp; Independence</h2>
        <p>
          The Mind Upgrade is dedicated to producing objective, research-backed, and practical insights. We maintain strict editorial separation between educational content and commercial sponsors.
        </p>

        <h2>2. Fact-Checking and Mathematical Rigor</h2>
        <p>
          Whenever our essays address tax regimes, insurance mechanics, interest compounding, or macroeconomic data, numbers are calculated from primary sources: RBI policy reports, Ministry of Finance notifications, IRDAI bulletins, and peer-reviewed behavioral economics literature.
        </p>

        <h2>3. Transparency on AI Assistance</h2>
        <p>
          While modern computational research tools assist our editors in synthesis and data verification, every article is outlined, rigorously structured, fact-checked, and authored by human writers committed to high-calibre prose.
        </p>

        <h2>4. Corrections Policy</h2>
        <p>
          If you detect a factual discrepancy in any of our published guides, please contact our editorial desk at <a href="mailto:editorial@themindupgrade.in" className="text-amberBrand underline">editorial@themindupgrade.in</a>. We issue prompt corrections with transparent update notes.
        </p>
      </div>
    </div>
  );
}
