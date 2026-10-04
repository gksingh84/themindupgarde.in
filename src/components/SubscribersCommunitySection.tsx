'use client';

import React, { useState, useEffect } from 'react';
import { Subscriber } from '@/lib/subscriber-service';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import {
  Users,
  Search,
  Mail,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  User,
} from 'lucide-react';

interface SubscribersCommunitySectionProps {
  title?: string;
  description?: string;
  isAdmin?: boolean;
}

export function SubscribersCommunitySection({
  title = 'Reader Network & Subscribers',
  description = 'List of active community subscribers receiving weekly insights',
  isAdmin = false,
}: SubscribersCommunitySectionProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/subscribers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSubscribers(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribers((prev) => [data, ...prev.filter((s) => s.id !== data.id)]);
        setNewEmail('');
        showToast(`Added ${data.email} to subscriber list!`, 'success');
      } else {
        showToast(data.error || 'Failed to add subscriber', 'error');
      }
    } catch {
      showToast('Failed to add subscriber', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from subscribers?`)) return;

    try {
      const res = await fetch(`/api/subscribers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        showToast(`Removed ${email} from subscribers list`, 'info');
      } else {
        showToast('Failed to remove subscriber', 'error');
      }
    } catch {
      showToast('Failed to remove subscriber', 'error');
    }
  };

  // Filter by Search Query
  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination Logic (Max 10 per page)
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-md">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                {subscribers.length} total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {/* Add Subscriber Form (Admin/All) */}
        <form onSubmit={handleAddSubscriber} className="flex items-center gap-2">
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Add subscriber email..."
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search subscribers by email or name..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing <span className="text-slate-900 dark:text-white font-bold">{paginatedSubscribers.length > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredSubscribers.length)}</span> of{' '}
          <span className="text-slate-900 dark:text-white font-bold">{filteredSubscribers.length}</span> subscribers (Max 10/page)
        </div>
      </div>

      {/* Subscribers Table / List */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800/80 rounded-2xl">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Subscriber</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Subscribed Date</th>
              <th className="px-4 py-3 text-center">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                  Loading subscribers list...
                </td>
              </tr>
            ) : paginatedSubscribers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                  No subscribers found matching &quot;{searchQuery}&quot;.
                </td>
              </tr>
            ) : (
              paginatedSubscribers.map((sub, index) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-400">{startIndex + index + 1}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 dark:border-indigo-800">
                      {sub.name ? sub.name[0].toUpperCase() : sub.email[0].toUpperCase()}
                    </div>
                    <span>{sub.name || sub.email.split('@')[0]}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {formatDateDDMMYYYY(sub.subscribedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{sub.status || 'Active'}</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Remove Subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (Max 10 per page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={activePage === 1}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1 text-xs">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === pageNum
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={activePage === totalPages}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
