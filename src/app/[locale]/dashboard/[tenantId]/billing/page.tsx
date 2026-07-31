'use client';
import React, { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { fetchAPI } from '@/services/api';
import { CreditCard, CheckCircle2, Receipt, AlertCircle } from 'lucide-react';
import BillingPlanCards from '@/components/billing/BillingPlanCards';
import { getPlan, type PlanId } from '@/lib/plans';
import {
  convertFromUsd,
  formatMoney,
  normalizeCurrency,
  type FxRatesMap,
  type SupportedCurrency,
} from '@/lib/currency';
import { useTenantStore } from '@/store/useTenantStore';

interface TenantData {
  id: string;
  name: string;
  tier: string;
  currency?: string;
}

const FALLBACK_RATES: FxRatesMap = {
  USD: 1,
  EUR: 0.88,
  GBP: 0.75,
  TRY: 47,
};

export default function BillingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const t = useTranslations('BillingPage');
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;
  const updateTenantState = useTenantStore((state) => state.updateTenantState);
  const storeTenant = useTenantStore((state) => state.tenant);

  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [teamMemberCount, setTeamMemberCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [fxRates, setFxRates] = useState<FxRatesMap>(FALLBACK_RATES);
  const [fxSource, setFxSource] = useState<'live' | 'fallback'>('fallback');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Prefer live workspace settings currency (settings page updates the store).
  const currency: SupportedCurrency = normalizeCurrency(
    storeTenant?.currency || tenant?.currency
  );

  /** Demo self-upgrade only when explicitly enabled for local/dev UI. */
  const allowDemoTierSwitch =
    process.env.NEXT_PUBLIC_ALLOW_DEMO_TIER_SWITCH === 'true' ||
    process.env.NEXT_PUBLIC_ALLOW_DEMO_TIER_SWITCH === '1';

  const strictNoCacheHeaders = {
    'x-tenant-id': tenantId,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const fetchOptions = {
          headers: strictNoCacheHeaders,
          cache: 'no-store' as RequestCache,
        };

        const [tenantRes, teamRes, fxRes] = await Promise.all([
          fetchAPI(
            `/api/tenants/${tenantId}?t=${new Date().getTime()}`,
            fetchOptions
          ),
          fetchAPI(
            `/api/tenants/${tenantId}/team?t=${new Date().getTime()}`,
            fetchOptions
          ),
          fetchAPI(`/api/fx/rates?base=USD&symbols=EUR,GBP,TRY`),
        ]);

        if (tenantRes.status === 401 || teamRes.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setTenant(tenantData);
          updateTenantState({
            id: tenantData.id,
            name: tenantData.name,
            tier: tenantData.tier,
            currency: tenantData.currency,
          });
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMemberCount(teamData.length || 1);
        }

        if (fxRes.ok) {
          const fxData = await fxRes.json();
          const rates = (fxData.rates ?? {}) as FxRatesMap;
          setFxRates({
            USD: 1,
            EUR: rates.EUR ?? FALLBACK_RATES.EUR,
            GBP: rates.GBP ?? FALLBACK_RATES.GBP,
            TRY: rates.TRY ?? FALLBACK_RATES.TRY,
          });
          setFxSource(fxData.source === 'live' ? 'live' : 'fallback');
        } else {
          setFxRates(FALLBACK_RATES);
          setFxSource('fallback');
        }
      } catch (error) {
        console.error('Failed to load billing or team data', error);
        setFxRates(FALLBACK_RATES);
        setFxSource('fallback');
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const formatUsdPrice = (amountUsd: number) =>
    formatMoney(convertFromUsd(amountUsd, currency, fxRates), currency);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpgradePlan = async (selectedTier: PlanId) => {
    if (!tenant) return;
    if (tenant.tier === selectedTier) return;

    if (!allowDemoTierSwitch) {
      setIsUpdating(true);
      try {
        const res = await fetchAPI(`/api/tenants/${tenantId}/tier-request`, {
          method: 'POST',
          headers: strictNoCacheHeaders,
          body: JSON.stringify({ tier: selectedTier }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            typeof data?.detail === 'string'
              ? data.detail
              : 'Could not send the upgrade request.'
          );
        }
        showNotification(
          'success',
          `Request for ${selectedTier.toUpperCase()} sent to the administrator.`
        );
      } catch (err) {
        showNotification(
          'error',
          err instanceof Error ? err.message : 'Could not send the request.'
        );
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/tier`, {
        method: 'PUT',
        headers: strictNoCacheHeaders,
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const detail =
          typeof errBody?.detail === 'string'
            ? errBody.detail
            : 'Plan changes must go through billing.';
        throw new Error(detail);
      }

      setTenant({ ...tenant, tier: selectedTier });
      updateTenantState({ tier: selectedTier });
      showNotification(
        'success',
        `Demo tier switched to ${selectedTier.toUpperCase()} (no charge).`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error updating plan. Please try again.';
      showNotification('error', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const rawTier = tenant?.tier || 'basic';
  const currentTier: PlanId =
    rawTier === 'advanced' || rawTier === 'pro' || rawTier === 'basic'
      ? rawTier
      : 'basic';
  const seatLimit = getPlan(currentTier).seatLimit;
  const usagePercentage = Math.min(100, (teamMemberCount / seatLimit) * 100);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-zinc-100 rounded-xl mb-8"></div>
      </div>
    );
  }

  return (
    // Scroll lives on DashboardClientWrapper <main> — do not nest overflow here.
    <div className="bg-[#FAFAFB] font-sans">
      <div className="max-w-300 mx-auto w-full p-6 md:p-10 pb-32">
        <div className="mb-10">
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50 px-4 py-3 text-sky-950">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
            <p className="text-sm font-medium leading-relaxed">
              <span className="font-bold">{t('demoBannerTitle')}</span>
              {' — '}
              {t('demoBannerBody')}
            </p>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-zinc-900" />
                {t('title')}
              </h1>
              <p className="text-sm text-zinc-500 mt-1 font-medium">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold tracking-wide text-zinc-800 shadow-sm">
                {t('displayCurrency')}: {currency}
              </span>
              {fxSource === 'fallback' ? (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {t('fxFallback', { currency })}
                </p>
              ) : (
                <p className="text-xs text-zinc-400 font-medium">
                  {t('fxLive', { currency })}
                </p>
              )}
            </div>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-semibold">{notification.msg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  {t('currentSubscription')}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-zinc-900 capitalize">
                    {currentTier} {t('planSuffix')}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    {t('active')}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-medium text-zinc-500">
                  {t('nextReview')}
                </p>
                <p className="text-base font-bold text-zinc-900">
                  {t('nextReviewHint')}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-zinc-700">
                  {t('teamSeatsUsage')}
                </span>
                <span className="text-sm font-medium text-zinc-500">
                  {teamMemberCount} /{' '}
                  {seatLimit === 999 ? t('unlimited') : seatLimit} {t('seats')}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usagePercentage >= 90 ? 'bg-red-500' : 'bg-sky-600'}`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              {usagePercentage >= 100 && currentTier !== 'pro' && (
                <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {t('seatLimitReached')}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 bg-zinc-900 rounded-2xl shadow-sm p-6 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-4">
                {t('paymentMethod')}
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center border border-white/20 shrink-0">
                  <CreditCard className="w-4 h-4 text-zinc-300" />
                </div>
                <div>
                  <p className="text-base font-bold tracking-tight">
                    {t('paymentEmptyTitle')}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {t('paymentEmptyBody')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BillingPlanCards
          mode="workspace"
          formatPrice={formatUsdPrice}
          currentTier={currentTier}
          onSelectPlan={handleUpgradePlan}
          isUpdating={isUpdating}
          requestMode={!allowDemoTierSwitch}
          upgradesDisabledReason={
            allowDemoTierSwitch ? undefined : t('upgradesDisabledReason')
          }
          isAnnual={isAnnual}
          onAnnualChange={setIsAnnual}
        />

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100/80 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-500" /> {t('invoiceHistory')}
              </h3>
            </div>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-1">
              <Receipt className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm font-bold text-zinc-900">
              {t('invoiceEmptyTitle')}
            </p>
            <p className="text-sm text-zinc-500 max-w-md">
              {t('invoiceEmptyBody')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
