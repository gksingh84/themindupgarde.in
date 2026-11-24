'use client';

import React, { useState, useEffect } from 'react';
import { Database, X, CheckCircle, AlertCircle, KeyRound, Globe, Server } from 'lucide-react';
import { ClientStorage } from '@/lib/client-storage';
import { useToast } from '@/context/ToastContext';
import { BlogPost } from '@/types/blog';

interface DynamoDBSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSynced: () => void;
  blogs: BlogPost[];
}

export function DynamoDBSetupModal({
  isOpen,
  onClose,
  onSynced,
  blogs,
}: DynamoDBSetupModalProps) {
  const { showToast } = useToast();
  const [tableName, setTableName] = useState('tmu_blogs');
  const [region, setRegion] = useState('ap-south-1');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = ClientStorage.getDynamoCreds();
      if (stored) {
        setTableName(stored.tableName || 'tmu_blogs');
        setRegion(stored.region || 'ap-south-1');
        setAccessKeyId(stored.accessKeyId || '');
        setSecretAccessKey(stored.secretAccessKey || '');
      }
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKeyId.trim() || !secretAccessKey.trim()) {
      setErrorMsg('Please enter both Access Key ID and Secret Access Key.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const creds = {
      tableName: tableName.trim() || 'tmu_blogs',
      region: region.trim() || 'ap-south-1',
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    };

    try {
      const res = await fetch('/api/blogs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogs,
          credentials: creds,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        ClientStorage.setDynamoCreds(creds);
        showToast(data.message || 'Successfully synced all articles to DynamoDB!', 'success');
        onSynced();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to connect to DynamoDB.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error connecting to sync endpoint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amberBrand/15 text-amberBrand flex items-center justify-center border border-amberBrand/30">
              <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-navy-800 dark:text-offwhite">
                Connect AWS DynamoDB
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-slate-400">
                Sync articles to permanently free AWS cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal-400 hover:text-navy-900 dark:hover:text-offwhite hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed break-words">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSync} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slateBrand dark:text-slate-300 block mb-1">
                Table Name
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                  placeholder="tmu_blogs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slateBrand dark:text-slate-300 block mb-1">
                AWS Region
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-semibold text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                  placeholder="ap-south-1"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slateBrand dark:text-slate-300 block mb-1">
              AWS Access Key ID
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-mono text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slateBrand dark:text-slate-300 block mb-1">
              AWS Secret Access Key
            </label>
            <input
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-mono text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
              placeholder="••••••••••••••••••••••••••••••••••••••••"
              required
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800/80 text-[11px] text-charcoal-600 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-navy-800 dark:text-offwhite">
              Why enter credentials here?
            </p>
            <p>
              This instantly connects to DynamoDB and uploads your {blogs.length} articles without having to wait for AWS Amplify rebuilds.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-slate-400 hover:text-navy-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amberBrand hover:bg-amber-400 text-navy-950 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testing & Syncing...' : 'Save & Sync to DynamoDB'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
