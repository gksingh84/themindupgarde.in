'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { Mail, MessageSquare, Send, Globe, ChevronDown, ChevronRight, HelpCircle, Sparkles } from 'lucide-react';

export function ContactClientView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Editorial Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showToast('Thank you! Your editorial inquiry has been received.', 'success');
      setName('');
      setEmail('');
      setMessage('');
    }, 800);
  };

  const faqs = [
    {
      q: 'How frequently is new content published on The Mind Upgrade?',
      a: 'We publish 2 to 3 deep-dive, research-backed articles every week across Personal Finance, Insurance Awareness, Cognitive Psychology, Economy, and Daily Insights.',
    },
    {
      q: 'Can I submit a guest article or pitch an essay?',
      a: 'Yes! We actively welcome contributions from domain practitioners, economists, and certified planners. Check out our Write for Us guidelines.',
    },
    {
      q: 'Is the weekly newsletter digest free?',
      a: '100% free forever. Every week, we deliver thoughtful articles and practical perspectives directly to your inbox with zero marketing noise.',
    },
    {
      q: 'How can I report a correction or suggest a topic?',
      a: 'Send us a note through this form or email our editorial desk directly at contact@themindupgrade.in.',
    },
  ];

  return (
    <div className="container-custom py-10 sm:py-16 max-w-5xl space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slateBrand/10 text-slateBrand dark:text-amberBrand text-xs font-bold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5 text-amberBrand" />
          <span>Get in Touch</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-navy-800 dark:text-offwhite tracking-tight">
          Editorial Inquiries &amp; Feedback
        </h1>
        <p className="font-sans text-sm sm:text-base text-charcoal-600 dark:text-slate-300 leading-relaxed">
          Have a question about an article, a suggestion for a mental model, or a collaboration proposal? We would love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
            <MessageSquare className="w-4 h-4 text-amberBrand" />
            <h2 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">
              Send a Direct Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Gaurav Singh"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite"
              >
                <option value="Editorial Inquiry">Editorial Inquiry</option>
                <option value="Guest Post Pitch">Guest Post Pitch</option>
                <option value="Article Correction">Article Correction / Feedback</option>
                <option value="Topic Request">Topic Suggestion</option>
                <option value="Other">General Message</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                Message *
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your perspective or proposal in detail..."
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Contact Info & FAQs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Info Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-4">
            <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Publication Coordinates
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amberBrand/15 text-amberBrand">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[10px]">Email Address</span>
                  <a href="mailto:contact@themindupgrade.in" className="font-semibold text-navy-800 dark:text-offwhite hover:text-amberBrand">
                    contact@themindupgrade.in
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slateBrand/15 text-slateBrand">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[10px]">Official Domain</span>
                  <span className="font-mono text-navy-800 dark:text-offwhite">themindupgrade.in</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-2">
              <HelpCircle className="w-4 h-4 text-amberBrand" />
              <h3 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite uppercase tracking-wider">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-100 dark:border-navy-800 overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-bold text-navy-800 dark:text-offwhite hover:text-amberBrand transition-colors cursor-pointer bg-slate-50/50 dark:bg-navy-950/40"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-amberBrand' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-3 text-xs text-charcoal-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
