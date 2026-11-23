import React from 'react';

export const metadata = {
  title: 'Terms & Conditions | The Mind Upgrade',
  description: 'Terms and conditions governing the use of The Mind Upgrade publication.',
};

export default function TermsPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-navy-700 pb-6">
        <span className="text-xs font-bold text-amberBrand uppercase tracking-wider">User Agreement</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-charcoal-500">Last updated: November 2026</p>
      </div>

      <div className="prose-editorial">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and reading <strong>The Mind Upgrade</strong> (themindupgrade.in), you agree to comply with and be bound by these Terms and Conditions. If you disagree with any part of these terms, please discontinue use of the website.
        </p>

        <h2>2. Intellectual Property Rights</h2>
        <p>
          Unless otherwise stated, all written articles, custom illustrations, mental model frameworks, and visual assets are the exclusive intellectual property of The Mind Upgrade and protected by copyright laws. You may quote brief excerpts with clear attribution and a direct hyperlink to the original article.
        </p>

        <h2>3. Educational Disclaimer</h2>
        <p>
          All content published on this platform is for educational, informational, and cognitive development purposes only. None of the articles constitute certified financial advice, legal counsel, or medical diagnosis. Please refer to our detailed Disclaimer.
        </p>

        <h2>4. Reader Conduct and Comments</h2>
        <p>
          We encourage thoughtful debate in our discussion sections. Comments containing hate speech, spam, abusive language, or unverified promotional links will be removed during moderation.
        </p>
      </div>
    </div>
  );
}
