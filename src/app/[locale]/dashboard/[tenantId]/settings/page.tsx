'use client';
import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Settings,
  UploadCloud,
} from 'lucide-react';

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
  const t = useTranslations('settingsPage');

  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Europe/Istanbul');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const allTimezones = Intl.supportedValuesOf('timeZone');

  useEffect(() => {
    if (logoFile) {
      const objectUrl = URL.createObjectURL(logoFile);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [logoFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setLogoFile(e.dataTransfer.files[0]);
    }
  };

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

      showNotification('success', t('notifications.success'));
    } catch (err) {
      showNotification('error', t('notifications.error'));
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
          setLogoUrl(tenantData.logo_url || '');
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
      t('deletePrompt', { name: workspaceName })
    );

    if (confirmName !== workspaceName) {
      if (confirmName !== null) {
        showNotification('error', t('notifications.matchError'));
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
      showNotification('error', t('notifications.deleteError'));
    }
  };

  const getSafeUrl = (url: string | null) => {
    if (!url) return '';
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    ) {
      return url;
    }
    return '';
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
              {t('title')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              {t('description')}
            </p>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-400'}`}
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
              <Settings className="w-5 h-5" /> {t('workspaceSettings')}
            </h3>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {previewUrl || logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getSafeUrl(previewUrl || logoUrl)}
                    alt="Workspace Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-zinc-400 font-bold text-sm uppercase tracking-wider">
                    {t('logoText')}
                  </span>
                )}
              </div>

              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 ml-1">
                  {t('logoLabel')}
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center w-full py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group
                    ${
                      isDragging
                        ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50'
                        : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/50'
                    }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg, image/png, image/gif, image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <UploadCloud
                      className={`w-8 h-8 mb-1 transition-colors ${isDragging ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}
                    />
                    <p className="text-sm font-medium text-center">
                      <span className="text-zinc-900 dark:text-white font-bold">
                        {t('clickToUpload')}
                      </span>{' '}
                      {t('dragAndDrop')}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {t('supportedFormats')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                  {t('nameLabel')}
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                  {t('timezoneLabel')}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:focus:ring-white/10"
                >
                  {allTimezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleUpdateWorkspace}
                className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? t('savingButton') : t('saveButton')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm overflow-hidden mb-20 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-6 p-6 lg:p-8">
            <div className="w-full md:w-1/3">
              <h3 className="text-base font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> {t('dangerZone')}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {t('dangerZoneDesc')}
              </p>
            </div>

            <div className="w-full md:w-2/3 flex items-center">
              <div className="w-full p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {t('deleteWorkspace')}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t('deleteDesc')}
                  </p>
                </div>
                <button
                  onClick={handleDeleteWorkspace}
                  className="bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-800 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 hover:border-red-600 transition-all active:scale-95 shrink-0"
                >
                  {t('deleteWorkspace')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
