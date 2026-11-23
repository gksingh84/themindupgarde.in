import React from 'react';

export const metadata = {
  title: 'Cookie Policy | The Mind Upgrade',
  description: 'How The Mind Upgrade uses cookies and local browser storage.',
};

export default function CookiePolicyPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-6">
      <div className="space-y-2 border-b border-slate-200 dark:border-navy-700 pb-6">
        <span className="text-xs font-bold text-amberBrand uppercase tracking-wider">Browser Storage</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite">
          Cookie Policy
        </h1>
        <p className="text-xs text-charcoal-500">Last updated: November 2026</p>
      </div>

      <div className="prose-editorial">
        <h2>1. What Are Cookies and Local Storage?</h2>
        <p>
          Cookies and local storage are small text files stored in your web browser that allow websites to remember your preferences and session states between page visits.
        </p>

        <h2>2. How We Use Browser Storage</h2>
        <ul>
          <li><strong>Theme Preferences:</strong> We store your choice of Light or Dark mode in your browser so you don&apos;t have to toggle it on every page.</li>
          <li><strong>Personal Library / Bookmarks:</strong> Saved articles and reading list preferences are stored in local storage for instantaneous offline access.</li>
          <li><strong>Search History:</strong> Recent search terms during your current browsing session are kept in temporary session storage.</li>
          <li><strong>Analytics:</strong> Anonymous visit counters to count unique reads per publication.</li>
        </ul>

        <h2>3. Managing Your Cookies</h2>
        <p>
          You can disable or clear cookies at any time through your browser settings. The core reading experience of The Mind Upgrade will continue to function without cookies.
        </p>
      </div>
    </div>
  );
}
