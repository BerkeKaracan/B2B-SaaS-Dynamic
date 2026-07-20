'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Cookies from 'js-cookie';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-react';
import { fetchAPI } from '@/services/api';
import {
  establishClientSession,
  fetchRealtimeAccessToken,
  hasClientSession,
  setClientTenantId,
} from '@/lib/authCookies';
import AuthShell, {
  AuthCheckingScreen,
  AuthPanelNodes,
} from '@/components/auth/AuthShell';
import AuthOAuthRow from '@/components/auth/AuthOAuthRow';
import {
  authError,
  authInput,
  authInputWithIcon,
  authLabel,
  authLink,
  authPrimaryBtn,
} from '@/components/auth/authStyles';

export default function LoginPage() {
  const router = useRouter();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingAuth, setPendingAuth] = useState<{
    access_token: string;
    refresh_token: string;
    factor_id: string;
    tenant_id: string;
  } | null>(null);

  const finishLogin = async (accessToken: string, tenantId?: string) => {
    // BFF already Set-Cookie on login response; this is a safe backup.
    try {
      await establishClientSession(accessToken);
    } catch (err) {
      console.warn('establishClientSession backup failed:', err);
    }

    if (fetchUser) {
      await fetchUser();
    }

    const resolvedTenant = tenantId || '';
    if (!resolvedTenant) {
      Cookies.remove('tenant_id');
      router.push('/onboarding');
      return;
    }

    setClientTenantId(resolvedTenant);
    await redirectUser(resolvedTenant, accessToken);
  };

  const redirectUser = async (tenantId: string, token: string) => {
    try {
      // Prefer BFF (HttpOnly) once session is set; fall back to explicit bearer for hop
      const res = await fetchAPI(`/api/tenants/${tenantId}`);

      if (res.ok) {
        const data = await res.json();
        if (data.slug) {
          const host = window.location.hostname;
          const isLocal =
            host.includes('localhost') || host.includes('127.0.0.1');
          const baseDomain =
            process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
            'b2-b-saa-s-dynamic.vercel.app';

          if (host.includes(baseDomain) || isLocal) {
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : '';
            const targetDomain = isLocal ? 'localhost' : baseDomain;
            const expectedHost = `${data.slug}.${targetDomain}`;

            if (host !== expectedHost && host !== `www.${expectedHost}`) {
              // Cookie hop across subdomain — never put JWT in the URL hash
              const cookieDomain = isLocal ? undefined : `.${baseDomain}`;
              const hopToken = token || (await fetchRealtimeAccessToken()) || '';
              if (hopToken) {
                await establishClientSession(hopToken, cookieDomain);
              }
              setClientTenantId(tenantId, cookieDomain);
              window.location.href = `${protocol}//${expectedHost}${port}/login`;
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Subdomain redirection error:', error);
    }

    router.push(`/dashboard/${tenantId}`);
  };

  useEffect(() => {
    const verifyToken = async () => {
      // Strip any legacy hash tokens from history (do not consume as auth)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      try {
        // Never hit FastAPI /me without a session cookie (causes 401 spam)
        const authed = await hasClientSession();
        if (!authed) {
          setIsChecking(false);
          return;
        }

        const res = await fetchAPI('/api/auth/me');

        if (res.ok) {
          const data = await res.json();
          const tenantId =
            data.tenant_id || data.user?.tenant_id || Cookies.get('tenant_id');

          if (tenantId && tenantId !== 'undefined' && tenantId !== 'null') {
            await redirectUser(tenantId, '');
          } else {
            router.replace('/onboarding');
          }
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsChecking(false);
      }
    };

    verifyToken();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed.');
      }

      if (data.mfa_required && data.factor_id) {
        setPendingAuth({
          access_token: data.access_token,
          refresh_token: data.refresh_token || '',
          factor_id: data.factor_id,
          tenant_id: data.tenant_id || '',
        });
        setMfaRequired(true);
        setMfaCode('');
        return;
      }

      await finishLogin(data.access_token, data.tenant_id || data.user?.tenant_id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuth) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetchAPI('/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          factor_id: pendingAuth.factor_id,
          code: mfaCode.trim(),
          access_token: pendingAuth.access_token,
          refresh_token: pendingAuth.refresh_token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
              : 'Invalid authenticator code.';
        throw new Error(message || 'Invalid authenticator code.');
      }

      await finishLogin(
        data.access_token,
        data.tenant_id || pendingAuth.tenant_id
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getOAuthRedirectUrl = () => {
    return `${window.location.origin}/login`;
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  if (isChecking) {
    return <AuthCheckingScreen label="Authenticating" />;
  }

  return (
    <AuthShell
      panelTitle={
        <>
          Your workspace,
          <br />
          one canvas.
        </>
      }
      panelSubtitle="Sign in to the B2 SaaS Engine portfolio demo — spatial projects, RBAC, and live collaboration."
      panelVisual={<AuthPanelNodes />}
    >
      <div className="mb-7">
        <h2
          className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-zinc-950 mb-2"
          style={{ fontFamily: 'var(--font-auth-display), system-ui, sans-serif' }}
        >
          {mfaRequired ? 'Authenticator code' : 'Welcome back'}
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          {mfaRequired
            ? 'Enter the 6-digit code from Google Authenticator.'
            : 'Sign in to continue to your workspace.'}
        </p>
      </div>

      {!mfaRequired && (
        <AuthOAuthRow
          onGoogle={handleGoogleLogin}
          onGithub={handleGithubLogin}
        />
      )}

      {error && (
        <div className={authError}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {mfaRequired ? (
        <form className="space-y-5" onSubmit={handleMfaSubmit}>
          <div>
            <label className={authLabel}>Authenticator code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\s/g, ''))}
              placeholder="123456"
              className={`${authInput} tracking-[0.35em] text-center font-mono`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || mfaCode.trim().length < 6}
            className={authPrimaryBtn}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </>
            ) : (
              'Verify and continue'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMfaRequired(false);
              setPendingAuth(null);
              setMfaCode('');
              setError('');
            }}
            className="w-full text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Back to password
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={authLabel}>Work email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={authInputWithIcon}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${authLabel} mb-0`}>Password</label>
              <Link
                href="/forgot"
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={authInputWithIcon}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`${authPrimaryBtn} mt-2`}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Continue to workspace'
            )}
          </button>
        </form>
      )}

      {!mfaRequired && (
        <p className="mt-7 text-center text-sm text-zinc-500">
          New here?{' '}
          <Link href="/register" className={authLink}>
            Create an account
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
