import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | The Mind Upgrade',
  description: 'How The Mind Upgrade collects, uses, and safeguards your personal data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-navy-700 pb-6">
        <span className="text-xs font-bold text-amberBrand uppercase tracking-wider">Legal Compliance</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite">
          Privacy Policy
        </h1>
        <p className="text-xs text-charcoal-500">Last updated: November 2026</p>
      </div>

      <div className="prose-editorial">
        <h2>1. Overview</h2>
        <p>
          At <strong>The Mind Upgrade</strong> (themindupgrade.in), we respect your personal privacy. We do not sell, rent, or trade your personal information to third-party advertising networks. This Privacy Policy details what information we collect when you visit our publication or subscribe to our newsletter.
        </p>

        <h2>2. Information We Collect</h2>
        <p>We collect information only when explicitly provided by you or automatically through standard web protocols:</p>
        <ul>
          <li><strong>Newsletter Subscriptions:</strong> Your email address and optional name provided when subscribing.</li>
          <li><strong>Reader Comments:</strong> Your display name, email, and comment text when engaging in reader discussions.</li>
          <li><strong>Aggregated Analytics:</strong> Anonymized page view statistics, referrers, and browser user-agent strings to evaluate content performance.</li>
        </ul>

        <h2>3. Newsletter and Unsubscribe Rights</h2>
        <p>
          If you subscribe to our weekly newsletter, you may unsubscribe at any time using the one-click unsubscribe link in any email footer or by contacting us at <code>contact@themindupgrade.in</code>.
        </p>

        <h2>4. Data Storage and Security</h2>
        <p>
          All data is transmitted using modern Transport Layer Security (TLS 1.3) encryption. Data is stored on secured AWS infrastructure conforming to industry standard data protection practices.
        </p>

        <h2>5. Contact Us</h2>
        <p>
          For any privacy questions or requests regarding your data, please email <a href="mailto:contact@themindupgrade.in" className="text-amberBrand underline">contact@themindupgrade.in</a>.
        </p>
      </div>
    </div>
  );
}
