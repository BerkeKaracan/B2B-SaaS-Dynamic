'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

type AdminTenant = {
  id: string;
  name: string | null;
  slug: string | null;
  tier: string | null;
  created_at: string | null;
};

const TIERS = ['basic', 'advanced', 'pro'] as const;

export default function PlatformAdminPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const showNotice = (type: 'success' | 'error', msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadTenants = async (initial = false) => {
    if (!initial) setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.status === 404 || res.status === 401) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      showNotice('error', 'Failed to load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch-on-mount: all setState happens after the awaited response, but the
    // static purity rule flags the sync call — loading already starts true.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTenants(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTier = async (tenantId: string, tier: string) => {
    setUpdatingId(tenantId);
    try {
      const res = await fetch('/api/admin/tenants/tier', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, tier }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof data?.detail === 'string' ? data.detail : 'Update failed'
        );
      }
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, tier } : t))
      );
      showNotice('success', `Tier set to ${tier.toUpperCase()}.`);
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'Update failed'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAFB]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-500">Not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFB] font-sans">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
              <Shield className="w-6 h-6" /> Platform Admin
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">
              Manage workspace plans. Changes apply instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadTenants()}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {notice && (
          <div
            className={`mb-6 p-3.5 rounded-xl flex items-center gap-2.5 border text-sm font-semibold ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {notice.msg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm divide-y divide-zinc-100 overflow-hidden">
            {tenants.length === 0 && (
              <p className="p-6 text-sm text-zinc-500 font-medium">
                No workspaces found.
              </p>
            )}
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">
                    {tenant.name || tenant.slug || tenant.id}
                  </p>
                  <p className="text-xs text-zinc-400 font-medium truncate">
                    {tenant.id}
                    {tenant.slug ? ` · ${tenant.slug}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {TIERS.map((tier) => {
                    const isCurrent =
                      (tenant.tier || 'basic').toLowerCase() === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        disabled={isCurrent || updatingId === tenant.id}
                        onClick={() => setTier(tenant.id, tier)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed ${
                          isCurrent
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40'
                        }`}
                      >
                        {updatingId === tenant.id && !isCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          tier
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
