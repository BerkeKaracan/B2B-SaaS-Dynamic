'use client';
import React, { useState, useEffect, use } from 'react';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  Download,
  Zap,
  Shield,
  Building,
  AlertCircle,
} from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  tier: string;
}

type PlanType = 'basic' | 'advanced' | 'pro';

const MOCK_INVOICES = [
  {
    id: 'INV-2026-004',
    date: 'Jul 01, 2026',
    amount: '$49.00',
    status: 'Paid',
  },
  {
    id: 'INV-2026-003',
    date: 'Jun 01, 2026',
    amount: '$49.00',
    status: 'Paid',
  },
  {
    id: 'INV-2026-002',
    date: 'May 01, 2026',
    amount: '$49.00',
    status: 'Paid',
  },
];

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
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

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

        const [tenantRes, teamRes] = await Promise.all([
          fetchAPI(
            `/api/tenants/${tenantId}?t=${new Date().getTime()}`,
            fetchOptions
          ),
          fetchAPI(
            `/api/tenants/${tenantId}/team?t=${new Date().getTime()}`,
            fetchOptions
          ),
        ]);

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setTenant(tenantData);
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMemberCount(teamData.length || 1); 
        }
      } catch (error) {
        console.error('Failed to load billing or team data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpgradePlan = async (selectedTier: PlanType) => {
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
        `Successfully upgraded to ${selectedTier.toUpperCase()} plan!`
      );
    } catch (err: unknown) {
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

  const currentTier = tenant?.tier || 'basic';

  const activeUsage = {
    basic: { max: 3, current: teamMemberCount },
    advanced: { max: 50, current: teamMemberCount },
    pro: { max: 999, current: teamMemberCount },
  }[currentTier as PlanType] || { max: 3, current: teamMemberCount };

  const usagePercentage = Math.min(
    100,
    (activeUsage.current / activeUsage.max) * 100
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
    <div className="flex-1 overflow-y-auto bg-[#FAFAFB] min-h-screen font-sans">
      <div className="max-w-[1200px] mx-auto w-full p-6 md:p-10 pb-32">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-zinc-900" />
            Billing & Plans
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-medium">
            Manage your workspace subscription, payment methods, and billing
            history.
          </p>
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
                  {activeUsage.current} /{' '}
                  {activeUsage.max === 999 ? 'Unlimited' : activeUsage.max}{' '}
                  seats
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

        <div className="flex justify-center mb-8">
          <div className="bg-zinc-100 p-1 rounded-xl flex items-center shadow-inner">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isAnnual ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Annually{' '}
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div
            className={`relative bg-white border rounded-2xl shadow-sm p-8 transition-all ${currentTier === 'basic' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200/80 hover:border-zinc-300'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-100 rounded-lg">
                <Zap className="w-5 h-5 text-zinc-700" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Basic</h3>
            </div>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-4xl font-black text-zinc-900">$0</span>
              <span className="text-sm font-medium text-zinc-500 mb-1">
                /{isAnnual ? 'year' : 'month'}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Up to 3 team members',
                'Basic project management',
                'Community support',
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-600 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{' '}
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={currentTier === 'basic' || isUpdating}
              onClick={() => handleUpgradePlan('basic')}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50"
            >
              {currentTier === 'basic' ? 'Current Plan' : 'Downgrade'}
            </button>
          </div>

          <div
            className={`relative bg-white border rounded-2xl shadow-sm p-8 transition-all ${currentTier === 'advanced' ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-zinc-200/80 hover:border-zinc-300'}`}
          >
            {currentTier !== 'advanced' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Building className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Advanced</h3>
            </div>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-4xl font-black text-zinc-900">
                ${isAnnual ? '470' : '49'}
              </span>
              <span className="text-sm font-medium text-zinc-500 mb-1">
                /{isAnnual ? 'year' : 'month'}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Up to 50 team members',
                'Advanced analytics dashboard',
                'Priority email support',
                'Custom user roles',
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-600 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />{' '}
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={currentTier === 'advanced' || isUpdating}
              onClick={() => handleUpgradePlan('advanced')}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTier === 'advanced' ? 'bg-white border border-zinc-200 text-zinc-900' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
            >
              {currentTier === 'advanced'
                ? 'Current Plan'
                : 'Upgrade to Advanced'}
            </button>
          </div>

          <div
            className={`relative bg-white border rounded-2xl shadow-sm p-8 transition-all ${currentTier === 'pro' ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200/80 hover:border-zinc-300'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-900 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Pro</h3>
            </div>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-4xl font-black text-zinc-900">
                ${isAnnual ? '1900' : '199'}
              </span>
              <span className="text-sm font-medium text-zinc-500 mb-1">
                /{isAnnual ? 'year' : 'month'}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited team members',
                'Dedicated account manager',
                '24/7 phone support',
                'Audit logs & compliance',
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-zinc-600 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />{' '}
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={currentTier === 'pro' || isUpdating}
              onClick={() => handleUpgradePlan('pro')}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTier === 'pro' ? 'bg-white border border-zinc-200 text-zinc-900' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md hover:shadow-lg'}`}
            >
              {currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

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
            {MOCK_INVOICES.map((invoice) => (
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
