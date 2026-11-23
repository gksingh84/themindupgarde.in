import React from 'react';

export const metadata = {
  title: 'Financial & General Disclaimer | The Mind Upgrade',
  description: 'Important financial, investment, and general educational disclaimers.',
};

export default function DisclaimerPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-navy-700 pb-6">
        <span className="text-xs font-bold text-amberBrand uppercase tracking-wider">Legal Notice</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite">
          General &amp; Financial Disclaimer
        </h1>
        <p className="text-xs text-charcoal-500">Last updated: November 2026</p>
      </div>

      <div className="prose-editorial">
        <h2>1. Not Financial or Investment Advice</h2>
        <p>
          The Mind Upgrade is an educational publishing platform. The articles, case studies, formulas, and calculations presented on this website are intended solely to enhance financial literacy and conceptual understanding.
        </p>
        <p>
          We are <strong>NOT</strong> a SEBI-registered investment advisor, portfolio manager, or research analyst. Nothing contained on this site should be construed as a direct recommendation or solicitation to buy, sell, or hold any security, mutual fund, derivative, insurance contract, or financial instrument.
        </p>

        <h2>2. Individual Responsibility &amp; Professional Counsel</h2>
        <p>
          Financial circumstances differ widely for every individual based on age, income, dependents, liabilities, and risk tolerance. Before making significant financial or insurance decisions, readers should consult an independent, certified financial planner (CFP) or fee-only registered investment advisor.
        </p>

        <h2>3. Insurance Awareness</h2>
        <p>
          Discussions concerning health insurance, term life policies, and claim settlement processes are educational summaries of insurance principles and IRDAI regulations. Policy wordings, sub-limits, exclusions, and premiums vary between insurance companies. Always read the policy schedule and prospectus issued by your insurer thoroughly.
        </p>
      </div>
    </div>
  );
}
