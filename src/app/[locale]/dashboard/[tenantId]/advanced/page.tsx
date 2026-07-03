'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import { ShieldAlert, AlertCircle, CheckCircle2, Settings } from 'lucide-react';

type Notification = {
  type: 'error' | 'success';
  msg: string;
};

export default function AdvancedSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Europe/Istanbul');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUpdateWorkspace = async () => {
    setIsSaving(true);
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: workspaceName, timezone }),
      });
      if (!res.ok) throw new Error('Failed to update workspace details.');

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const token = Cookies.get('token') || localStorage.getItem('token');
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const logoRes = await fetch(
          `${API_BASE_URL}/api/tenants/${tenantId}/logo`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!logoRes.ok) throw new Error('Failed to upload logo.');

        const logoData = await logoRes.json();
        setLogoUrl(logoData.logo_url);
        setLogoFile(null);
      }

      showNotification('success', 'Workspace settings updated successfully!');
    } catch (err) {
      showNotification(
        'error',
        'Failed to update settings. Please check your inputs.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const authRes = await fetchAPI('/api/auth/me', {
          headers: { 'x-tenant-id': tenantId },
        });

        if (!authRes.ok) throw new Error('Not logged in');
        const authData = await authRes.json();

        if (authData.role !== 'owner') {
          router.push(`/dashboard/${tenantId}`);
          return;
        }

        const tenantRes = await fetchAPI(`/api/tenants/${tenantId}`);
        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setWorkspaceName(tenantData.name || 'Workspace');
          setTimezone(tenantData.timezone || 'Europe/Istanbul');
        }
      } catch (err) {
        console.error('Advanced Settings Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [tenantId, router]);

  const showNotification = (type: 'error' | 'success', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteWorkspace = async () => {
    const confirmName = window.prompt(
      `To confirm deletion, please type the workspace name exactly: "${workspaceName}"`
    );

    if (confirmName !== workspaceName) {
      if (confirmName !== null) {
        showNotification(
          'error',
          'Workspace name did not match. Deletion cancelled.'
        );
      }
      return;
    }

    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete workspace.');

      router.push('/login');
    } catch (err: unknown) {
      showNotification(
        'error',
        'Failed to delete workspace. Ensure you have the right permissions.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 mb-10"></div>
        <div className="h-40 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto w-full p-6 md:p-10 pb-32">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Advanced Settings
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Manage critical and irreversible actions for your workspace.
            </p>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <Settings className="w-5 h-5" /> Workspace Settings
            </h3>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Workspace Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-zinc-400 font-bold">Logo</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Workspace Logo
                </label>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace Name"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
              />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="Europe/Istanbul">Europe/Istanbul</option>
              </select>
            </div>

            <button
              onClick={handleUpdateWorkspace}
              className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm overflow-hidden mb-20 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8">
            <div className="w-full md:w-1/3">
              <h3 className="text-base font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Irreversible actions. Deleting a workspace removes all data,
                projects, and team members permanently.
              </p>
            </div>

            <div className="w-full md:w-2/3 flex items-center">
              <div className="w-full p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Delete Workspace
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleDeleteWorkspace}
                  className="bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-800 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 hover:border-red-600 transition-all active:scale-95 shrink-0"
                >
                  Delete Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
