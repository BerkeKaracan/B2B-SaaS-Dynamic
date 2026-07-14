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
  Globe2,
  Coins,
  Building2,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { useTenantStore } from '@/store/useTenantStore';
import { getApiBaseUrl } from '@/lib/apiBase';

type Notification = {
  type: 'error' | 'success';
  msg: string;
};

const fieldClassName =
  'w-full px-4 py-3 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 focus:bg-white transition-all dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500 dark:focus:ring-white/10 dark:focus:border-zinc-500 dark:focus:bg-zinc-800';

export default function AdvancedSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();
  const t = useTranslations('settingsPage');
  const updateTenantState = useTenantStore((state) => state.updateTenantState);

  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Europe/Istanbul');
  const [currency, setCurrency] = useState<string>('TRY');
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
        body: JSON.stringify({ name: workspaceName, timezone, currency }),
      });
      if (!res.ok) throw new Error('Failed to update workspace details.');

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const token = Cookies.get('token') || localStorage.getItem('token');

        const logoRes = await fetch(
          `${getApiBaseUrl()}/api/tenants/${tenantId}/logo`,
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
        updateTenantState({ logo_url: logoData.logo_url });
      }

      updateTenantState({
        name: workspaceName,
        timezone,
        currency,
      });

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
          setCurrency(tenantData.currency || 'TRY');
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

  // CodeQL XSS Taint Bypass (Strict Sanitization)
  const getSafeUrl = (url: string | null) => {
    if (!url) return '';

    if (!/^(https?:\/\/|blob:|data:image\/|\/)/i.test(url)) {
      return '';
    }

    return encodeURI(url);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen">
        <div className="max-w-[920px] mx-auto w-full p-6 md:p-10 animate-pulse space-y-6">
          <div className="h-16 bg-zinc-200/70 dark:bg-zinc-800 rounded-2xl w-2/3" />
          <div className="h-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
          <div className="h-40 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[920px] mx-auto w-full p-6 md:p-10 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 md:mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Settings className="w-5 h-5 text-zinc-900 dark:text-white" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {t('title')}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium leading-relaxed max-w-xl">
                {t('description')}
              </p>
            </div>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Branding */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-zinc-800/40 dark:to-transparent">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                  {t('branding')}
                </h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                {t('brandingDesc')}
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-zinc-50 dark:ring-zinc-800/80">
                    {previewUrl || logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getSafeUrl(previewUrl || logoUrl)}
                        alt="Workspace Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                    )}
                  </div>
                  {logoFile && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold px-2.5 py-1 shadow-sm">
                      {t('newPreview')}
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 ml-0.5">
                    {t('logoLabel')}
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center w-full py-7 px-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 group
                      ${
                        isDragging
                          ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50 scale-[1.01]'
                          : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/80 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/40 dark:bg-zinc-900/40'
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
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isDragging
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-600 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-300'
                        }`}
                      >
                        <UploadCloud className="w-5 h-5" />
                      </div>
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
            </div>
          </section>

          {/* General */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                  {t('workspaceSettings')}
                </h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                {t('generalDesc')}
              </p>
            </div>

            <div className="p-6 md:p-8">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 ml-0.5">
                {t('nameLabel')}
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className={fieldClassName}
              />
            </div>
          </section>

          {/* Localization */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Globe2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-widest">
                  {t('localization')}
                </h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                {t('localizationDesc')}
              </p>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 ml-0.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  {t('timezoneLabel')}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={fieldClassName}
                >
                  {allTimezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5 ml-0.5">
                  <Coins className="w-3.5 h-3.5" />
                  {t('currencyLabel')}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={fieldClassName}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Save bar */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg shadow-zinc-900/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {t('unsavedHint')}
              </p>
              <button
                onClick={handleUpdateWorkspace}
                className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('savingButton')}
                  </>
                ) : (
                  t('saveButton')
                )}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <section className="bg-white dark:bg-zinc-900 border border-red-200/80 dark:border-red-900/40 rounded-2xl shadow-sm overflow-hidden relative mt-2">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/[0.06] via-transparent to-transparent pointer-events-none" />

            <div className="relative px-6 md:px-8 py-5 border-b border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-extrabold text-red-600 dark:text-red-500 uppercase tracking-widest">
                  {t('dangerZone')}
                </h2>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                {t('dangerZoneDesc')}
              </p>
            </div>

            <div className="relative p-6 md:p-8">
              <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/20 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {t('deleteWorkspace')}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {t('deleteDesc')}
                  </p>
                </div>
                <button
                  onClick={handleDeleteWorkspace}
                  className="bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-800 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 hover:border-red-600 transition-all active:scale-[0.98] shrink-0"
                >
                  {t('deleteWorkspace')}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
