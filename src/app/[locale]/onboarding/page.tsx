'use client';
import React, { useEffect, useState } from 'react';
import { authService, fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import { AlertCircle, ArrowRight, Loader2, User, Users } from 'lucide-react';
import AuthShell, {
  AuthCheckingScreen,
  AuthPanelNodes,
} from '@/components/auth/AuthShell';
import {
  authError,
  authInput,
  authLabel,
  authPrimaryBtn,
} from '@/components/auth/authStyles';

interface OnboardingResponseData {
  tenant_id?: string;
  detail?: string;
}

export default function OnboardingPage() {
  const [usageType, setUsageType] = useState<'individual' | 'team' | null>(
    null
  );
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetchAPI('/api/auth/me');

        if (!res.ok) {
          window.location.href = '/login';
          return;
        }

        const data = await res.json();
        const tenant =
          data.tenant_id ||
          data.user?.tenant_id ||
          Cookies.get('tenant_id') ||
          localStorage.getItem('tenant_id');

        if (tenant && tenant !== 'undefined' && tenant !== 'null') {
          Cookies.set('tenant_id', tenant, { expires: 7 });
          localStorage.setItem('tenant_id', tenant);
          window.location.href = `/dashboard/${tenant}/projects`;
        } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsChecking(false);
        }
      } catch {
        window.location.href = '/login';
      }
    };

    verifySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageType) {
      setError('Please select how you want to use the system.');
      return;
    }
    if (usageType === 'team' && !workspaceName.trim()) {
      setError('Workspace name is required for team usage.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.completeOnboarding({
        usage_type: usageType,
        workspace_name: usageType === 'team' ? workspaceName : undefined,
      });

      const data = (await res.json()) as OnboardingResponseData;

      if (!res.ok) {
        if (
          res.status === 401 ||
          (data.detail && String(data.detail).toUpperCase().includes('JWT'))
        ) {
          Cookies.remove('token');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(data.detail || 'Onboarding failed. Please try again.');
      }

      if (data.tenant_id) {
        localStorage.setItem('tenant_id', data.tenant_id);
        Cookies.set('tenant_id', data.tenant_id, { expires: 7 });

        window.location.href = `/dashboard/${data.tenant_id}/projects`;
      } else {
        throw new Error('Invalid response from server: Missing tenant ID.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during onboarding.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return <AuthCheckingScreen label="Verifying session" />;
  }

  return (
    <AuthShell
      formMaxWidthClassName="max-w-[480px]"
      panelTitle={
        <>
          Name your
          <br />
          workspace.
        </>
      }
      panelSubtitle="Choose a personal space or a team tenant — then open the spatial canvas."
      panelVisual={<AuthPanelNodes />}
    >
      <div className="mb-7">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 mb-3"
          style={{ fontFamily: 'var(--font-auth-mono), monospace' }}
        >
          Step 1 of 1
        </p>
        <h2
          className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-zinc-950 mb-2"
          style={{
            fontFamily: 'var(--font-auth-display), system-ui, sans-serif',
          }}
        >
          How will you use it?
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          This creates your first tenant. You can invite teammates later from
          workspace settings.
        </p>
      </div>

      {error && (
        <div className={authError}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUsageType('individual')}
            className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all ${
              usageType === 'individual'
                ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                usageType === 'individual'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 mb-1">
              Just for me
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Personal workspace for solo projects.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setUsageType('team')}
            className={`flex flex-col items-start text-left p-4 rounded-xl border transition-all ${
              usageType === 'team'
                ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                usageType === 'team'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 mb-1">
              With my team
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Company tenant — invite others next.
            </p>
          </button>
        </div>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            usageType === 'team'
              ? 'max-h-32 opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div>
            <label className={authLabel}>Workspace name</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Acme Corp."
              className={authInput}
              required={usageType === 'team'}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !usageType}
          className={authPrimaryBtn}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating workspace…
            </>
          ) : (
            <>
              Continue to canvas
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
