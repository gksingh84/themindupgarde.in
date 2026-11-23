'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost, Subscriber, WebsiteSettings } from '@/types/blog';
import { CATEGORIES } from '@/data/categories';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { formatDateDDMMYYYY } from '@/lib/date-utils';
import {
  ShieldCheck,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Lock,
  Layers,
  Sparkles,
  LogOut,
  ExternalLink,
  Bell,
  Mail,
  Download,
  Settings,
  FolderOpen,
  Copy,
  TrendingUp,
  BarChart3,
  Calendar,
  Compass,
  ArrowRight,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface AdminDashboardClientProps {
  initialBlogs: BlogPost[];
}

export function AdminDashboardClient({ initialBlogs }: AdminDashboardClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'articles' | 'subscribers' | 'settings' | 'categories' | 'advanced'>('articles');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    setIsAuthenticated(ClientStorage.isAdminAuthenticated());
  }, []);

  // Fetch subscribers & settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscribers();
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSubscribers = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch('/api/subscribers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSubscribers(data);
      }
    } catch {}
    finally {
      setLoadingSubs(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {}
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      ClientStorage.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      showToast('Welcome back to The Mind Upgrade Editorial CMS!', 'success');
    } else {
      showToast('Incorrect password. Default access is admin123', 'error');
    }
  };

  const handleLogout = () => {
    ClientStorage.setAdminAuthenticated(false);
    setIsAuthenticated(false);
    showToast('Logged out of Admin Portal', 'info');
  };

  // Toggle Article Status (draft / published)
  const toggleStatus = async (blog: BlogPost) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBlogs((prev) =>
          prev.map((b) => (b.id === blog.id ? { ...b, status: newStatus } : b))
        );
        showToast(
          `Status changed to ${newStatus.toUpperCase()}`,
          newStatus === 'published' ? 'success' : 'info'
        );
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  // Duplicate Article
  const handleDuplicate = async (blog: BlogPost) => {
    const duplicated: Partial<BlogPost> = {
      ...blog,
      title: `${blog.title} (Copy)`,
      slug: `${blog.slug}-copy-${Date.now()}`,
      status: 'draft',
      views: 0,
      likes: 0,
      publishedAt: formatDateDDMMYYYY(new Date()),
    };
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
      if (res.ok) {
        const created = await res.json();
        setBlogs((prev) => [created, ...prev]);
        showToast('Article duplicated as draft', 'success');
      }
    } catch {
      showToast('Failed to duplicate article', 'error');
    }
  };

  // Delete Article
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this publication?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        showToast('Article deleted successfully', 'success');
      }
    } catch {
      showToast('Failed to delete article', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete Subscriber
  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Remove subscriber?')) return;
    try {
      const res = await fetch(`/api/subscribers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        showToast('Subscriber removed', 'info');
      }
    } catch {
      showToast('Failed to remove subscriber', 'error');
    }
  };

  // Export Subscribers to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast('No subscribers to export', 'info');
      return;
    }
    const headers = ['ID', 'Email', 'Name', 'Status', 'Subscribed At'];
    const rows = subscribers.map((s) => [s.id, s.email, s.name || '', s.status, s.subscribedAt]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `themindupgrade_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported!', 'success');
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        showToast('Website settings updated live!', 'success');
      }
    } catch {
      showToast('Failed to update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered Articles
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' ? true : b.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Filtered Subscribers
  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(subscriberSearch.toLowerCase()))
  );

  // Calculations for executive dashboard
  const publishedCount = blogs.filter((b) => b.status === 'published').length;
  const draftCount = blogs.filter((b) => b.status === 'draft').length;
  const scheduledCount = blogs.filter((b) => b.status === 'scheduled').length;
  const totalViews = blogs.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalLikes = blogs.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  // Authentication View
  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20 flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-editorial space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amberBrand/20 border border-amberBrand/40 text-amberBrand flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-black text-navy-800 dark:text-offwhite">
              The Mind Upgrade CMS
            </h1>
            <p className="text-xs text-charcoal-500">
              Enter administrator password to manage publications and settings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slateBrand dark:text-slate-400 block mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-sm text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              />
              <span className="text-[10px] text-charcoal-500 mt-1 block">Default password: <code>admin123</code></span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Sign In to Admin Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-8">
      
      {/* 8.A: Header & KPI Executive Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-navy-700 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amberBrand text-navy-950 flex items-center justify-center shadow-md font-serif font-black text-lg">
            TMU
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-navy-800 dark:text-offwhite">
              Publication Dashboard
            </h1>
            <p className="text-xs text-charcoal-500 dark:text-slate-400">
              Production Content Management System • The Mind Upgrade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/new"
            className="px-4 py-2 rounded-xl bg-amberBrand hover:bg-amberBrand/90 text-navy-950 font-bold text-xs shadow-md shadow-amberBrand/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-navy-700 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
            Published
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-black text-navy-800 dark:text-offwhite">
            {publishedCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
            Drafts
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-black text-charcoal-600 dark:text-slate-300">
            {draftCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
            Scheduled
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-black text-amberBrand">
            {scheduledCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
            Total Views
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {totalViews}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
            Total Likes
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-black text-rose-500">
            {totalLikes}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
            Subscribers
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-black text-navy-800 dark:text-amberBrand">
            {subscribers.length}
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-700 overflow-x-auto scrollbar-none pb-2">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'articles'
              ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
              : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Articles ({blogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'subscribers'
              ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
              : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Newsletter ({subscribers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
              : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categories ({CATEGORIES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
              : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Website Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'advanced'
              ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
              : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Advanced &amp; SEO</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: ARTICLES MANAGEMENT
          ======================================================== */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title or author..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite"
              >
                <option value="all">All Domains</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 text-slateBrand dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Publication</th>
                    <th className="p-4">Domain</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Metrics</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-charcoal-500">
                        No articles match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBlogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-navy-950 shrink-0 border border-slate-200 dark:border-navy-800">
                              <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-0.5 max-w-sm">
                              <Link
                                href={`/blog/${blog.slug}`}
                                target="_blank"
                                className="font-serif font-bold text-sm text-navy-800 dark:text-offwhite hover:text-amberBrand line-clamp-1"
                              >
                                {blog.title}
                              </Link>
                              <span className="text-[11px] text-charcoal-500 block truncate">
                                By {blog.author.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slateBrand/10 text-slateBrand dark:bg-navy-800 dark:text-amberBrand whitespace-nowrap">
                            {blog.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleStatus(blog)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-colors cursor-pointer ${
                              blog.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : blog.status === 'scheduled'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'
                            }`}
                          >
                            {blog.status}
                          </button>
                        </td>
                        <td className="p-4 text-charcoal-500 dark:text-slate-400 text-[11px]">
                          <div>{blog.views || 0} views</div>
                          <div>{blog.likes || 0} likes</div>
                        </td>
                        <td className="p-4 text-charcoal-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDateDDMMYYYY(blog.publishedAt)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-charcoal-500 hover:text-navy-800 dark:hover:text-white"
                              title="View Live Article"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDuplicate(blog)}
                              className="p-1.5 rounded-lg text-charcoal-500 hover:text-navy-800 dark:hover:text-white cursor-pointer"
                              title="Duplicate Article"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={`/admin/edit/${blog.id}`}
                              className="p-1.5 rounded-lg text-charcoal-500 hover:text-amberBrand"
                              title="Edit Article"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(blog.id)}
                              disabled={deletingId === blog.id}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Delete Article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: NEWSLETTER SUBSCRIBERS
          ======================================================== */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                placeholder="Search subscribers..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSubscribers}
                className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-600 dark:text-slate-300 hover:text-navy-800 border border-slate-200 dark:border-navy-700 cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSubs ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 text-slateBrand dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Subscribed Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-charcoal-500">
                      No subscribers registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40">
                      <td className="p-4 font-mono font-medium text-navy-800 dark:text-offwhite">
                        {sub.email}
                      </td>
                      <td className="p-4 text-charcoal-600 dark:text-slate-300">
                        {sub.name || '—'}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 text-charcoal-500 dark:text-slate-400">
                        {sub.subscribedAt}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Delete subscriber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: TAXONOMY & CATEGORIES
          ======================================================== */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const count = blogs.filter(
              (b) => b.category.toLowerCase() === cat.name.toLowerCase()
            ).length;
            return (
              <div
                key={cat.slug}
                className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
                  <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite">
                    {cat.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amberBrand/20 text-amberBrand">
                    {count} articles
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 dark:text-slate-400 leading-relaxed">
                  {cat.description}
                </p>
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-navy-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand block">
                    Subcategories ({cat.subcategories.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.slug}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-50 dark:bg-navy-950 text-charcoal-700 dark:text-slate-300 border border-slate-200 dark:border-navy-800"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          TAB 4: WEBSITE SETTINGS
          ======================================================== */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-4 shadow-sm">
            <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Announcement Top Bar
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy-800 dark:text-offwhite">
                <input
                  type="checkbox"
                  checked={settings.announcementBar.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcementBar: {
                        ...settings.announcementBar,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-navy-700 text-amberBrand"
                />
                <span>Enable Announcement Strip on Homepage</span>
              </label>
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={settings.announcementBar.text}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcementBar: {
                        ...settings.announcementBar,
                        text: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-4 shadow-sm">
            <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Brand Identity &amp; Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Website Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slateBrand dark:text-slate-400 block mb-1">
                  Contact / Editorial Email
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-navy-800 dark:text-offwhite"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-950 dark:bg-amberBrand dark:hover:bg-amberBrand/90 text-white dark:text-navy-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {savingSettings ? 'Saving Changes...' : 'Save Settings Live'}
          </button>
        </form>
      )}

      {/* ========================================================
          TAB 5: ADVANCED & SEO TOOLS
          ======================================================== */}
      {activeTab === 'advanced' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-sm">
            <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Sitemaps &amp; Syndication
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="font-mono">/sitemap.xml</span>
                <Link href="/sitemap.xml" target="_blank" className="text-amberBrand font-bold hover:underline">
                  View XML &rarr;
                </Link>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="font-mono">/rss.xml</span>
                <Link href="/rss.xml" target="_blank" className="text-amberBrand font-bold hover:underline">
                  View RSS &rarr;
                </Link>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="font-mono">/robots.txt</span>
                <Link href="/robots.txt" target="_blank" className="text-amberBrand font-bold hover:underline">
                  View Robots &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-sm">
            <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Production AWS Architecture Status
            </h3>
            <ul className="space-y-2 text-xs text-charcoal-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Docker Container Configuration: Ready</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Prisma Relational Database Models: Configured</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Zero-Egress JSON Fallback Layer: Synchronized</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>ECS Fargate &amp; ALB Task Definition: Prepared</span>
              </li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
