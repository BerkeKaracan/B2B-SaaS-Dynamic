'use client';
import React, { useState, useEffect, use, useMemo } from 'react';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  Download,
  AlertCircle,
} from 'lucide-react';
import BillingPlanCards from '@/components/billing/BillingPlanCards';
import { getPlan, type PlanId } from '@/lib/plans';
import {
  convertFromUsd,
  formatMoney,
  normalizeCurrency,
  type FxRatesMap,
  type SupportedCurrency,
} from '@/lib/currency';

interface TenantData {
  id: string;
  name: string;
  tier: string;
  currency?: string;
}

const MOCK_INVOICE_META = [
  { id: 'INV-2026-004', date: 'Jul 01, 2026', amountUsd: 49 },
  { id: 'INV-2026-003', date: 'Jun 01, 2026', amountUsd: 49 },
  { id: 'INV-2026-002', date: 'May 01, 2026', amountUsd: 49 },
] as const;

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
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;

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

  const currency: SupportedCurrency = normalizeCurrency(tenant?.currency);

  const strictNoCacheHeaders = {
    'x-tenant-id': tenantId,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

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

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setTenant(tenantData);
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

  const invoices = useMemo(
    () =>
      MOCK_INVOICE_META.map((invoice) => ({
        ...invoice,
        amount: formatUsdPrice(invoice.amountUsd),
        status: 'Paid' as const,
      })),
    // formatUsdPrice closes over currency + fxRates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, fxRates]
  );

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpgradePlan = async (selectedTier: PlanId) => {
    if (!tenant) return;
    if (tenant.tier === selectedTier) return;

    setIsUpdating(true);
    try {
      const res = await fetchAPI(`/api/tenants/${tenantId}/tier`, {
        method: 'PUT',
        headers: strictNoCacheHeaders,
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (!res.ok) {
        throw new Error('Failed to update subscription plan.');
      }

      setTenant({ ...tenant, tier: selectedTier });
      showNotification(
        'success',
        `Demo tier switched to ${selectedTier.toUpperCase()} (no charge).`
      );
    } catch {
      showNotification('error', 'Error updating plan. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextBillingDate = () => {
    const nextDate = new Date();
    if (isAnnual) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const rawTier = tenant?.tier || 'basic';
  const currentTier: PlanId =
    rawTier === 'advanced' || rawTier === 'pro' || rawTier === 'basic'
      ? rawTier
      : 'basic';
  const seatLimit = getPlan(currentTier).seatLimit;
  const usagePercentage = Math.min(
    100,
    (teamMemberCount / seatLimit) * 100
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-zinc-100 rounded-xl mb-8"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] h-full min-h-[100dvh] font-sans">
      <div className="max-w-[1200px] mx-auto w-full p-6 md:p-10 pb-32">
        <div className="mb-10">
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-amber-900">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">
              <span className="font-bold">Portfolio demo</span> — no real
              charges, Stripe, or payment methods. Plan buttons only switch a
              demo tier for this workspace.
            </p>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-zinc-900" />
            Billing & Plans
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-medium">
            Switch demo tiers and explore usage UI. Nothing here is billed.
          </p>
          {fxSource === 'fallback' && (
            <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Approximate rates (live FX unavailable). Prices shown in{' '}
              {currency}.
            </p>
          )}
          {fxSource === 'live' && (
            <p className="text-xs text-zinc-400 mt-2 font-medium">
              Prices converted from USD to {currency} using live ECB rates.
            </p>
          )}
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
                  Current Subscription
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-zinc-900 capitalize">
                    {currentTier} Plan
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-medium text-zinc-500">
                  Next billing date
                </p>
                <p className="text-base font-bold text-zinc-900">
                  {getNextBillingDate()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-zinc-700">
                  Team Seats Usage
                </span>
                <span className="text-sm font-medium text-zinc-500">
                  {teamMemberCount} /{' '}
                  {seatLimit === 999 ? 'Unlimited' : seatLimit} seats
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usagePercentage >= 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              {usagePercentage >= 100 && currentTier !== 'pro' && (
                <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> You have reached your seat
                  limit. Upgrade to add more members.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 bg-zinc-900 rounded-2xl shadow-sm p-6 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-4">
                Payment Method
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center border border-white/20">
                  <span className="text-xs font-black italic">VISA</span>
                </div>
                <div>
                  <p className="text-base font-bold tracking-widest">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-xs text-zinc-400">Expires 12/28</p>
                </div>
              </div>
            </div>
            <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 w-max mt-6 transition-colors">
              Update payment method
            </button>
          </div>
        </div>

        <BillingPlanCards
          mode="workspace"
          formatPrice={formatUsdPrice}
          currentTier={currentTier}
          onSelectPlan={handleUpgradePlan}
          isUpdating={isUpdating}
          isAnnual={isAnnual}
          onAnnualChange={setIsAnnual}
        />

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100/80 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-500" /> Invoice History
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Download past invoices for your accounting department.
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 px-6 hover:bg-zinc-50/50 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="text-sm font-bold text-zinc-900">
                    {invoice.id}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">
                    {invoice.date}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-bold text-zinc-900">
                    {invoice.amount}
                  </span>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-md">
                    {invoice.status}
                  </span>
                  <button
                    className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
