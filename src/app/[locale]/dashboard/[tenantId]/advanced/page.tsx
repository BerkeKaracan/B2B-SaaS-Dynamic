'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import { ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  // Eğer bu sayfa için dil dosyasına anahtarları eklediysen t() kullanabilirsin
  // const t = useTranslations('AdvancedSettingsPage');

  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const authRes = await fetchAPI('/api/auth/me');
        if (!authRes.ok) throw new Error('Not logged in');
        const authData = await authRes.json();

        // Silme gibi kritik işlemleri sadece Owner yapabilmeli
        if (authData.role !== 'owner') {
          router.push(`/dashboard/${tenantId}`);
          return;
        }

        // Çalışma alanının adını silme onayı için çekiyoruz
        const tenantRes = await fetchAPI(`/api/tenants/${tenantId}`);
        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setWorkspaceName(tenantData.name || 'Workspace');
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

      // Başarılı silme işleminden sonra login veya ana sayfaya yönlendir
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
        {/* Üst Başlık */}
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

        {/* --- DANGER ZONE KARTI --- */}
        <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-sm overflow-hidden mb-20 relative">
          {/* Arka plan için hafif kırmızı bir parlama efekti */}
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
