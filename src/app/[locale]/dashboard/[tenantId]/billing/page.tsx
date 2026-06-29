'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  Check,
  Database,
  Users,
} from 'lucide-react';

type Notification = {
  type: 'error' | 'success';
  msg: string;
};

export default function BillingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const router = useRouter();

  // Çeviri hook'unu çağırıyoruz
  const t = useTranslations('BillingPage');

  const [tier, setTier] = useState<string>('Free Plan');
  const [membersCount, setMembersCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const authRes = await fetchAPI('/api/auth/me');
        if (!authRes.ok) throw new Error('Not logged in');
        const authData = await authRes.json();

        if (authData.role !== 'owner' && authData.role !== 'admin') {
          router.push(`/dashboard/${tenantId}`);
          return;
        }

        const [tenantRes, teamRes, projRes] = await Promise.all([
          fetchAPI(`/api/tenants/${tenantId}`),
          fetchAPI(`/api/tenants/${tenantId}/team`),
          fetchAPI(`/api/records?tenant_id=${tenantId}`),
        ]);

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          if (tenantData.tier === 'pro') setTier('Pro Plan');
          else if (tenantData.tier === 'advanced') setTier('Advanced Plan');
          else setTier('Free Plan');
        }

        if (teamRes.ok) {
          const membersData = await teamRes.json();
          setMembersCount(membersData.length || 0);
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          if (Array.isArray(projData)) {
            const actualItems = projData.filter(
              (item: { module_name?: string }) =>
                item.module_name !== 'workspace_modules'
            );
            setProjectsCount(actualItems.length);
          }
        }
      } catch (err) {
        console.error('Billing Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [tenantId, router]);

  const showNotification = (type: 'error' | 'success', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpgradeTier = async (newTier: 'free' | 'advanced' | 'pro') => {
    setIsUpgrading(true);
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/tier`, {
        method: 'PUT',
        body: JSON.stringify({ tier: newTier }),
      });

      if (res.ok) {
        let planName = 'Free Plan';
        if (newTier === 'pro') planName = 'Pro Plan';
        if (newTier === 'advanced') planName = 'Advanced Plan';

        setTier(planName);
        showNotification('success', `Successfully updated to ${planName}!`);
      } else {
        showNotification('error', 'Failed to update plan.');
      }
    } catch (e) {
      showNotification('error', 'Server connection error.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getProjectLimit = () => {
    if (tier === 'Pro Plan') return 'Unlimited';
    if (tier === 'Advanced Plan') return 50;
    return 5;
  };

  const getMemberLimit = () => {
    if (tier === 'Pro Plan') return 'Unlimited';
    if (tier === 'Advanced Plan') return 50;
    return 3;
  };

  const calculatePercentage = (current: number, limit: string | number) => {
    if (limit === 'Unlimited') return 0;
    return Math.min((current / (limit as number)) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 mb-10"></div>
        <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          <div className="h-96 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          <div className="h-96 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] dark:bg-black min-h-screen font-sans transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto w-full p-6 md:p-10 pb-32">
        {/* Üst Başlık */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <CreditCard className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {t('title')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              {t('subtitle')}
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

        {/* --- KULLANIM (USAGE) KARTLARI --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Proje Kullanımı */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                <Database className="w-4 h-4 text-indigo-500" />{' '}
                {t('projectsUsage')}
              </div>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {projectsCount} /{' '}
                {getProjectLimit() === 'Unlimited' ? '∞' : getProjectLimit()}
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 relative"
                style={{
                  width: `${calculatePercentage(projectsCount, getProjectLimit())}%`,
                }}
              >
                {getProjectLimit() === 'Unlimited' && (
                  <div className="absolute inset-0 bg-indigo-400 opacity-50 w-full"></div>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
              {getProjectLimit() === 'Unlimited'
                ? t('unlimitedPro')
                : t('upgradeForMore')}
            </p>
          </div>

          {/* Üye Kullanımı */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                <Users className="w-4 h-4 text-emerald-500" />{' '}
                {t('teamMembers')}
              </div>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {membersCount} /{' '}
                {getMemberLimit() === 'Unlimited' ? '∞' : getMemberLimit()}
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative"
                style={{
                  width: `${calculatePercentage(membersCount, getMemberLimit())}%`,
                }}
              >
                {getMemberLimit() === 'Unlimited' && (
                  <div className="absolute inset-0 bg-emerald-400 opacity-50 w-full"></div>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
              {getMemberLimit() === 'Unlimited'
                ? t('unlimitedMembers')
                : t('additionalSeats')}
            </p>
          </div>
        </div>

        {/* --- FİYATLANDIRMA / PAKETLER (PRICING) --- */}
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
          {t('availablePlans')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE PLAN */}
          <div
            className={`relative bg-white dark:bg-zinc-900 border rounded-3xl p-8 flex flex-col transition-all ${tier === 'Free Plan' ? 'border-zinc-900 dark:border-white shadow-md ring-1 ring-zinc-900 dark:ring-white' : 'border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'}`}
          >
            {tier === 'Free Plan' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {t('currentPlan')}
              </div>
            )}
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t('freePlan')}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 min-h-[40px]">
              {t('freeDesc')}
            </p>
            <div className="my-6">
              <span className="text-4xl font-black text-zinc-900 dark:text-white">
                $0
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                {t('mo')}
              </span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{' '}
                {t('freeFeature1')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{' '}
                {t('freeFeature2')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{' '}
                {t('freeFeature3')}
              </li>
            </ul>
            <button
              onClick={() => handleUpgradeTier('free')}
              disabled={tier === 'Free Plan' || isUpgrading}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${tier === 'Free Plan' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed' : 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:border-zinc-900 dark:hover:border-zinc-500'}`}
            >
              {tier === 'Free Plan' ? t('active') : t('downgradeFree')}
            </button>
          </div>

          {/* ADVANCED PLAN */}
          <div
            className={`relative bg-white dark:bg-zinc-900 border rounded-3xl p-8 flex flex-col transition-all ${tier === 'Advanced Plan' ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500' : 'border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'}`}
          >
            {tier === 'Advanced Plan' ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {t('currentPlan')}
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {t('mostPopular')}
              </div>
            )}
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" /> {t('advancedPlan')}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 min-h-[40px]">
              {t('advancedDesc')}
            </p>
            <div className="my-6">
              <span className="text-4xl font-black text-zinc-900 dark:text-white">
                $29
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                {t('mo')}
              </span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />{' '}
                {t('advFeature1')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />{' '}
                {t('advFeature2')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />{' '}
                {t('advFeature3')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />{' '}
                {t('advFeature4')}
              </li>
            </ul>
            <button
              onClick={() => handleUpgradeTier('advanced')}
              disabled={tier === 'Advanced Plan' || isUpgrading}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${tier === 'Advanced Plan' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
            >
              {tier === 'Advanced Plan' ? t('active') : t('upgradeAdvanced')}
            </button>
          </div>

          {/* PRO PLAN */}
          <div
            className={`relative bg-zinc-950 dark:bg-zinc-950 border rounded-3xl p-8 flex flex-col transition-all ${tier === 'Pro Plan' ? 'border-zinc-700 shadow-2xl ring-1 ring-zinc-700' : 'border-zinc-800 shadow-lg hover:border-zinc-700'}`}
          >
            {tier === 'Pro Plan' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-zinc-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {t('currentPlan')}
              </div>
            )}
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" /> {t('proPlan')}
            </h3>
            <p className="text-sm text-zinc-400 mt-2 min-h-[40px]">
              {t('proDesc')}
            </p>
            <div className="my-6">
              <span className="text-4xl font-black text-white">$99</span>
              <span className="text-zinc-500 font-medium">{t('mo')}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{' '}
                {t('proFeature1')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{' '}
                {t('proFeature2')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{' '}
                {t('proFeature3')}
              </li>
              <li className="flex items-start gap-3 text-sm text-zinc-300 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{' '}
                {t('proFeature4')}
              </li>
            </ul>
            <button
              onClick={() => handleUpgradeTier('pro')}
              disabled={tier === 'Pro Plan' || isUpgrading}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${tier === 'Pro Plan' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-md hover:shadow-lg'}`}
            >
              {tier === 'Pro Plan' ? t('active') : t('upgradePro')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
