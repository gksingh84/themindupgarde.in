'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
  RefreshCw,
  Heart,
  MessageSquare,
  UserPlus,
  Shield,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { NotificationSettings, NotificationLog } from '@/lib/notification-service';

export function AdminNotificationSettings() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    adminEmail: '',
    notifyOnComment: true,
    notifyOnLike: true,
    notifyOnSubscriber: true,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
  });

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSmtp, setShowSmtp] = useState(false);

  // Fetch settings & logs on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSettings, resLogs] = await Promise.all([
        fetch('/api/notifications/settings'),
        fetch('/api/notifications/logs'),
      ]);

      if (resSettings.ok) {
        const s = await resSettings.json();
        setSettings(s);
      }
      if (resLogs.ok) {
        const l = await resLogs.json();
        setLogs(l);
      }
    } catch (err) {
      showToast('Failed to load notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.adminEmail || !settings.adminEmail.includes('@')) {
      showToast('Please enter a valid Admin Email ID', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        showToast('Notification email settings updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Failed to save notification settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings.adminEmail) {
      showToast('Please save an Admin Email ID first', 'error');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        showToast(`Test email alert sent to ${settings.adminEmail}!`, 'success');
        fetchData(); // Refresh log inbox
      } else {
        showToast(data.error || 'Test email failed', 'error');
      }
    } catch {
      showToast('Failed to trigger test email', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all notification history logs?')) return;
    try {
      const res = await fetch('/api/notifications/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        showToast('Notification history cleared', 'info');
      }
    } catch {
      showToast('Failed to clear logs', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
        <span>Loading notification configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Email Configuration Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Email Notifications</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive instant alerts whenever a user comments, likes an article, or subscribes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send Test Alert</span>
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Email ID Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Notification Recipient Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative max-w-xl">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                placeholder="e.g. gaurav@themindupgrade.in or your-email@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              All blog alerts (comments, likes, subscribers) will be dispatched to this email.
            </p>
          </div>

          {/* Notification Event Toggles */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Notification Triggers & Event Subscriptions
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Comment Toggle */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  settings.notifyOnComment
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold">New Comments</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnComment}
                  onChange={(e) => setSettings({ ...settings, notifyOnComment: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
              </label>

              {/* Like Toggle */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  settings.notifyOnLike
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold">Article Likes</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnLike}
                  onChange={(e) => setSettings({ ...settings, notifyOnLike: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                />
              </label>

              {/* Subscriber Toggle */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  settings.notifyOnSubscriber
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold">New Subscribers</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnSubscriber}
                  onChange={(e) => setSettings({ ...settings, notifyOnSubscriber: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
              </label>
            </div>
          </div>

          {/* Optional SMTP Collapsible */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowSmtp(!showSmtp)}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Custom SMTP Email Server Configuration (Optional)</span>
              {showSmtp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSmtp && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    SMTP Host (e.g. smtp.gmail.com)
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost || ''}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort || 587}
                    onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                    placeholder="587"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    SMTP User / Account Email
                  </label>
                  <input
                    type="text"
                    value={settings.smtpUser || ''}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    placeholder="your-smtp-user@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    SMTP Password / App Password
                  </label>
                  <input
                    type="password"
                    value={settings.smtpPass || ''}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Save Email Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notification Inbox / Recent Logs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Notification History Inbox</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time record of all triggered email alerts ({logs.length} logged)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Inbox</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No notifications triggered yet. Send a test alert or wait for user activity!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {logs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        log.type === 'comment'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : log.type === 'like'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : log.type === 'subscriber'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{log.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{log.message}</p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'sent'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {log.status === 'sent' ? '✓ SENT' : 'LOGGED'}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
