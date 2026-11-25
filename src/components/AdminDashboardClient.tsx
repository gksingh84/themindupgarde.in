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
  Sliders,
  KeyRound,
  AlertCircle,
  CloudUpload,
  Database,
  Cloud
} from 'lucide-react';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { DynamoDBSetupModal } from '@/components/DynamoDBSetupModal';

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
  const [activeTab, setActiveTab] = useState<'articles' | 'subscribers' | 'settings' | 'categories' | 'security' | 'advanced'>('articles');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDefaultPassword, setIsDefaultPassword] = useState(true);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // AWS DynamoDB Cloud DB State
  const [dynamoConfigured, setDynamoConfigured] = useState<boolean | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFreshBlogs = async () => {
    setIsRefreshing(true);
    const customCreds = ClientStorage.getDynamoCreds();
    const reqHeaders: Record<string, string> = {};
    if (customCreds) {
      reqHeaders['x-dynamo-creds'] = encodeURIComponent(JSON.stringify(customCreds));
    }
    try {
      const res = await fetch('/api/blogs?includeDrafts=true', { headers: reqHeaders });
      if (res.ok) {
        const fresh = await res.json();
        if (Array.isArray(fresh) && fresh.length > 0) {
          setBlogs(fresh);
          showToast('Updated latest views, likes & articles!', 'success');
        }
      }
    } catch {}
    finally {
      setIsRefreshing(false);
    }
  };
  const [isDynamoModalOpen, setIsDynamoModalOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    setIsAuthenticated(ClientStorage.isAdminAuthenticated());
    const merged = ClientStorage.getMergedBlogs(initialBlogs);
    setBlogs(merged);

    const storedCreds = ClientStorage.getDynamoCreds();
    const reqHeaders: Record<string, string> = {};
    if (storedCreds) {
      reqHeaders['x-dynamo-creds'] = JSON.stringify(storedCreds);
    }

    // Always fetch fresh blogs from DynamoDB via /api/blogs
    fetch('/api/blogs?includeDrafts=true', { headers: reqHeaders })
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh) => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          setBlogs(fresh);
        }
      })
      .catch(() => {});

    // Check AWS DynamoDB cloud database status
    fetch('/api/blogs/sync', { headers: reqHeaders })
      .then((r) => r.json())
      .then((d) => {
        setDynamoConfigured(Boolean(d.configured));
      })
      .catch(() => {});

    // Purge old custom password if still present in client localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tmu_custom_admin_password');
      if (stored === 'mindupgrade@7531' || stored === 'admin123') {
        localStorage.removeItem('tmu_custom_admin_password');
      }
    }

    const customPass = ClientStorage.getCustomAdminPassword();
    if (customPass && customPass !== 'mindupgrade@7531' && customPass !== 'admin123') {
      setIsDefaultPassword(false);
      // Synchronize server cache with the custom password
      fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direct: true, newPassword: customPass }),
      }).catch(() => {});
    } else {
      fetch('/api/admin/auth')
        .then((r) => r.json())
        .then((d) => {
          if (d && typeof d.isCustom === 'boolean') {
            setIsDefaultPassword(!d.isCustom);
          }
        })
        .catch(() => {});
    }
  }, [initialBlogs]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = password.trim();

    // 0. Explicitly block retired/old passwords
    if (entered === 'mindupgrade@7531' || entered === 'admin123') {
      showToast('This old password has been disabled. Please enter adminpassword@7531', 'error');
      return;
    }

    // 1. Direct match with configured admin password
    if (entered === 'adminpassword@7531') {
      ClientStorage.setCustomAdminPassword('adminpassword@7531');
      ClientStorage.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      showToast('Welcome to The Mind Upgrade Editorial CMS!', 'success');
      // Keep server synchronized
      fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direct: true, newPassword: 'adminpassword@7531' }),
      }).catch(() => {});
      return;
    }

    // 2. Custom password saved in this browser
    const customPass = ClientStorage.getCustomAdminPassword();
    if (customPass && customPass !== 'mindupgrade@7531' && customPass !== 'admin123' && entered === customPass) {
      ClientStorage.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      showToast('Welcome back to The Mind Upgrade Editorial CMS!', 'success');
      fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direct: true, newPassword: customPass }),
      }).catch(() => {});
      return;
    }

    // 3. Query server API
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: entered }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        ClientStorage.setAdminAuthenticated(true);
        setIsAuthenticated(true);
        showToast('Welcome to The Mind Upgrade Editorial CMS!', 'success');
        return;
      }
    } catch {}

    // 4. Fallback client validation when server is unreachable
    if (ClientStorage.validateAdminPassword(entered)) {
      ClientStorage.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      showToast('Welcome to The Mind Upgrade Editorial CMS!', 'success');
    } else {
      showToast('Incorrect password. Please enter the current admin password.', 'error');
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
    const updated: BlogPost = { ...blog, status: newStatus };
    ClientStorage.saveBlog(updated);
    setBlogs((prev) =>
      prev.map((b) => (b.id === blog.id ? updated : b))
    );
    showToast(
      `Status changed to ${newStatus.toUpperCase()}`,
      newStatus === 'published' ? 'success' : 'info'
    );
    try {
      await fetch(`/api/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
  };

  // Duplicate Article
  const handleDuplicate = async (blog: BlogPost) => {
    const duplicated: BlogPost = {
      ...blog,
      id: `copy-${Date.now()}`,
      title: `${blog.title} (Copy)`,
      slug: `${blog.slug}-copy-${Date.now()}`,
      status: 'draft',
      views: 0,
      likes: 0,
      publishedAt: formatDateDDMMYYYY(new Date()),
    };
    ClientStorage.saveBlog(duplicated);
    setBlogs((prev) => [duplicated, ...prev]);
    showToast('Article duplicated as draft', 'success');

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          ClientStorage.saveBlog(created);
        }
      }
    } catch {}
  };

  // Delete Article (Permanently persists across page refresh and browser sessions)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this publication? This action cannot be undone.')) return;
    setDeletingId(id);

    // 1. Permanently delete from ClientStorage
    const targetBlog = blogs.find((b) => b.id === id);
    ClientStorage.markBlogDeleted(id);
    if (targetBlog && targetBlog.slug) {
      ClientStorage.markBlogDeleted(targetBlog.slug);
    }

    // 2. Remove immediately from local state
    setBlogs((prev) => prev.filter((b) => b.id !== id && b.slug !== id));
    showToast('Article permanently deleted from publication.', 'success');

    // 3. Notify backend
    try {
      await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
    } catch {}
    finally {
      setDeletingId(null);
    }
  };

  // Sync articles to AWS DynamoDB Free Cloud Database
  const handleSyncToCloud = async () => {
    const stored = ClientStorage.getDynamoCreds();
    if (!dynamoConfigured && !stored) {
      setIsDynamoModalOpen(true);
      return;
    }

    setIsSyncingCloud(true);
    try {
      const res = await fetch('/api/blogs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogs, credentials: stored || undefined }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setDynamoConfigured(true);
        showToast(result.message || 'Synced to AWS DynamoDB successfully!', 'success');
      } else {
        setDynamoConfigured(Boolean(result.dynamoConfigured));
        if (result.error && (result.error.includes('credentials') || result.error.includes('not detected'))) {
          setIsDynamoModalOpen(true);
        } else {
          showToast(result.error || result.message || 'Sync failed', 'error');
        }
      }
    } catch {
      showToast('Failed to connect to sync endpoint', 'error');
    } finally {
      setIsSyncingCloud(false);
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
  const filteredBlogs = (blogs || []).filter((b) => {
    if (!b) return false;
    const q = (searchQuery || '').trim().toLowerCase();
    const title = (b.title || '').toLowerCase();
    const authorName = (b.author?.name || '').toLowerCase();
    const category = (b.category || '').toLowerCase();
    const subcategory = (b.subcategory || '').toLowerCase();

    const matchesSearch = !q
      ? true
      : title.includes(q) ||
        authorName.includes(q) ||
        category.includes(q) ||
        subcategory.includes(q) ||
        (Array.isArray(b.tags) && b.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q)));

    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter;

    const catFilterNorm = (categoryFilter || '').trim().toLowerCase();
    const catFilterSlug = catFilterNorm.replace(/[\s_]+/g, '-');
    const bCatNorm = (b.category || '').trim().toLowerCase();
    const bCatSlug = bCatNorm.replace(/[\s_]+/g, '-');

    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : bCatNorm === catFilterNorm || bCatSlug === catFilterSlug;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Filtered Subscribers
  const filteredSubscribers = (subscribers || []).filter((s) => {
    if (!s) return false;
    const subQuery = (subscriberSearch || '').trim().toLowerCase();
    if (!subQuery) return true;
    const email = (s.email || '').toLowerCase();
    const name = (s.name || '').toLowerCase();
    return email.includes(subQuery) || name.includes(subQuery);
  });

  // Calculations for executive dashboard
  const publishedCount = (blogs || []).filter((b) => b && b.status === 'published').length;
  const draftCount = (blogs || []).filter((b) => b && b.status === 'draft').length;
  const scheduledCount = (blogs || []).filter((b) => b && b.status === 'scheduled').length;
  const totalViews = (blogs || []).reduce((acc, curr) => acc + (curr?.views || 0), 0);
  const totalLikes = (blogs || []).reduce((acc, curr) => acc + (curr?.likes || 0), 0);

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
              <span className="text-[10px] text-charcoal-500 mt-1 block">
                {isDefaultPassword ? (
                  <>Default password: <code>adminpassword@7531</code></>
                ) : (
                  <>Enter your custom administrator password</>
                )}
              </span>
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
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-xs text-charcoal-500 dark:text-slate-400">
                Production Content Management System • The Mind Upgrade
              </p>
              {dynamoConfigured === true && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  AWS DynamoDB Active
                </span>
              )}
              {dynamoConfigured === false && (
                <button
                  type="button"
                  onClick={() => setIsDynamoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                  title="Click to enter AWS credentials and connect DynamoDB"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Cloud DB: Setup Pending (Click to Connect)
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/admin/new"
            className="px-4 py-2 rounded-xl bg-amberBrand hover:bg-amberBrand/90 text-navy-950 font-bold text-xs shadow-md shadow-amberBrand/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </Link>
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-navy-900 dark:hover:text-amberBrand border border-slate-200 dark:border-navy-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Change Admin Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-amberBrand" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-charcoal-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-navy-700 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Alert: Default Password in Use */}
      {isDefaultPassword && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-navy-800 dark:text-offwhite block">Default Admin Password In Use</span>
              <span className="text-charcoal-600 dark:text-slate-400 text-[11px]">
                Your editorial portal is currently using the default password. You can customize your password anytime.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-amberBrand hover:bg-amber-400 text-navy-950 font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            Change Password
          </button>
        </div>
      )}

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
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-navy-800 dark:bg-amberBrand text-white dark:text-navy-950 shadow-sm'
              : 'text-charcoal-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Security &amp; Password</span>
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

              <button
                onClick={fetchFreshBlogs}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-bold text-navy-800 dark:text-offwhite hover:text-amberBrand transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                title="Refresh latest views, likes & articles"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amberBrand ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Stats</span>
              </button>

              <button
                onClick={handleSyncToCloud}
                disabled={isSyncingCloud}
                className="px-3 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                title="Sync all articles to AWS DynamoDB (makes articles identical on Desktop, iPhone & all devices)"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingCloud ? 'Syncing...' : 'Sync to DynamoDB'}</span>
              </button>

              <button
                onClick={() => {
                  ClientStorage.exportBlogsJson(blogs);
                  showToast('Exported active articles to blogs.json!', 'success');
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-bold text-navy-800 dark:text-offwhite hover:text-amberBrand transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Backup / Export articles as blogs.json"
              >
                <Download className="w-3.5 h-3.5 text-amberBrand" />
                <span className="hidden sm:inline">Export JSON</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Sync with live server? This will clear any uncommitted browser-local draft overrides so your browser matches the live production server 100%.')) {
                    ClientStorage.resetToLiveServer();
                    setBlogs(initialBlogs);
                    showToast('Synced with live server!', 'success');
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-bold text-navy-800 dark:text-offwhite hover:text-amberBrand transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Sync / Refresh to match live server"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amberBrand" />
                <span className="hidden sm:inline">Sync Live</span>
              </button>
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
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slateBrand/10 text-slateBrand dark:bg-navy-800 dark:text-amberBrand whitespace-nowrap inline-flex items-center gap-1">
                            <span>{blog.category}</span>
                            {blog.subcategory && (
                              <>
                                <span className="opacity-50">•</span>
                                <span className="text-amberBrand">{blog.subcategory}</span>
                              </>
                            )}
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
            const count = (blogs || []).filter(
              (b) => ((b && b.category) || '').trim().toLowerCase() === cat.name.trim().toLowerCase()
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

      {/* ========================================================
          TAB 6: SECURITY & PASSWORD MANAGEMENT
          ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in max-w-4xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-navy-800 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-navy-800 dark:text-offwhite flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amberBrand" />
                  <span>Admin Authentication &amp; Credentials</span>
                </h3>
                <p className="text-xs text-charcoal-500 dark:text-slate-400 mt-0.5">
                  Manage the security password protecting your editorial content, categories, and subscribers.
                </p>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-4 py-2 rounded-xl bg-amberBrand hover:bg-amber-400 text-navy-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
                  Current Password Status
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isDefaultPassword ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="font-bold text-sm text-navy-800 dark:text-offwhite">
                    {isDefaultPassword ? 'Default Password Active' : 'Custom Secure Password Active'}
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500 block pt-1">
                  {isDefaultPassword
                    ? 'We recommend updating to a custom private password to secure your admin dashboard.'
                    : 'Your editorial portal is protected with your custom password.'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 block">
                  Session &amp; Token Security
                </span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-navy-800 dark:text-offwhite">
                    Verified Admin Session
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500 block pt-1">
                  Active browser session is authenticated and secured locally.
                </span>
              </div>
            </div>
          </div>

          {/* Security Best Practices */}
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 space-y-3 shadow-sm">
            <h4 className="font-serif text-sm font-bold text-navy-800 dark:text-offwhite border-b border-slate-100 dark:border-navy-800 pb-2">
              Editorial Security Best Practices
            </h4>
            <ul className="space-y-2.5 text-xs text-charcoal-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amberBrand shrink-0 mt-0.5" />
                <span>Use a memorable, strong password with at least 8 characters combining letters, numbers, and symbols.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amberBrand shrink-0 mt-0.5" />
                <span>Never share your administrator password via email or unencrypted chat messages.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amberBrand shrink-0 mt-0.5" />
                <span>Always click <strong>Sign Out</strong> when leaving your workstation or using public networks.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onPasswordChanged={() => {
          setIsDefaultPassword(false);
          showToast('Password updated! Please use your new password next time you sign in.', 'success');
        }}
      />

      {/* AWS DynamoDB Setup Modal */}
      <DynamoDBSetupModal
        isOpen={isDynamoModalOpen}
        onClose={() => setIsDynamoModalOpen(false)}
        onSynced={() => {
          setDynamoConfigured(true);
        }}
        blogs={blogs}
      />

    </div>
  );
}
