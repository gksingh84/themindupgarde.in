import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Write for Us | The Mind Upgrade',
  description: 'Contribute high-leverage essays, economic analyses, and behavioral psychology guides.',
};

export default function WriteForUsPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-navy-700 pb-6">
        <span className="text-xs font-bold text-amberBrand uppercase tracking-wider">Contributor Guidelines</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite">
          Write for The Mind Upgrade
        </h1>
        <p className="text-xs text-charcoal-500">Share your analytical depth with our growing community of thinkers.</p>
      </div>

      <div className="prose-editorial">
        <h2>What We Look For</h2>
        <p>
          We are seeking domain practitioners, certified planners, psychologists, economists, and clear thinkers who can explain complex real-world phenomena with clarity, elegance, and practical utility.
        </p>

        <h2>Core Subject Areas</h2>
        <ul>
          <li><strong>Personal Finance:</strong> Systematic wealth building, debt optimization, tax planning, and behavioural finance.</li>
          <li><strong>Insurance:</strong> Deep dives into policy wordings, claims mechanics, and consumer protection.</li>
          <li><strong>Psychology:</strong> Cognitive biases, mental models, habit architectures, and decision making under uncertainty.</li>
          <li><strong>Economy:</strong> Macro trends, banking policy, supply chains, and industrial analysis.</li>
          <li><strong>Daily Insights:</strong> Everyday consumer rights, technology shifts, and life lessons.</li>
        </ul>

        <h2>Submission Guidelines</h2>
        <ol>
          <li>Send a 2-paragraph pitch or complete draft (1,000 to 2,500 words) in clean markdown or Google Docs format.</li>
          <li>Include specific examples, mathematical computations, and real-world case studies rather than generic high-level advice.</li>
          <li>Include a short 2-sentence author bio and your LinkedIn profile.</li>
        </ol>

        <div className="callout callout-key">
          <strong>Submit Your Pitch:</strong> Email pitches to <a href="mailto:contribute@themindupgrade.in" className="text-amberBrand underline font-bold">contribute@themindupgrade.in</a> with the subject line <code>[Pitch] - Your Title Proposal</code>.
        </div>
      </div>
    </div>
  );
}
