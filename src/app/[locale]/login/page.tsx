'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Cookies from 'js-cookie';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiBase';
import { fetchAPI } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  const redirectUser = async (tenantId: string, token: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
              window.location.href = `${protocol}//${expectedHost}${port}/login#access_token=${token}&tenant_id=${tenantId}`;
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
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = params.get('access_token');
        const urlTenant = params.get('tenant_id');

        if (accessToken) {
          Cookies.set('token', accessToken, { expires: 7 });
          if (urlTenant) Cookies.set('tenant_id', urlTenant, { expires: 7 });
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      const token = Cookies.get('token');
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetchAPI('/api/auth/me');

        if (res.ok) {
          const data = await res.json();
          const tenantId =
            data.tenant_id || data.user?.tenant_id || Cookies.get('tenant_id');

          if (tenantId && tenantId !== 'undefined' && tenantId !== 'null') {
            await redirectUser(tenantId, token);
          } else {
            router.replace('/onboarding');
          }
        } else {
          router.replace('/register');
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

      Cookies.set('token', data.access_token, { expires: 7 });

      if (fetchUser) {
        await fetchUser();
      }

      const tenantId = data.tenant_id || data.user?.tenant_id;

      if (!tenantId || tenantId === '') {
        Cookies.remove('tenant_id');
        router.push('/onboarding');
        return;
      }

      Cookies.set('tenant_id', tenantId, { expires: 7 });
      await redirectUser(tenantId, data.access_token);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafb]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">
            Authenticating
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fafafb] font-sans text-zinc-900 selection:bg-indigo-200 overflow-hidden relative">
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-zinc-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shadow-lg">
            <span className="text-zinc-950 text-sm font-black font-mono">
              B2
            </span>
          </div>
          <span className="text-base font-extrabold tracking-tight uppercase text-white">
            SaaS Engine
          </span>
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto mt-10">
          <h1 className="text-5xl font-black leading-[1.05] tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
            Design your workflow. <br /> Scale your business.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12 font-medium">
            Join thousands of teams operating on the most advanced node-based
            database architecture ever built.
          </p>

          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 shadow-2xl transform -rotate-1 hover:rotate-0 transition-all duration-700 group">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></span>
                <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                  Live Canvas Engine
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                Connected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-700/30 group-hover:border-zinc-600/50 transition-colors">
                <div className="h-2.5 w-1/3 bg-zinc-600 rounded-full mb-3"></div>
                <div className="h-1.5 w-full bg-zinc-700 rounded-full mb-2.5"></div>
                <div className="h-1.5 w-2/3 bg-zinc-700 rounded-full"></div>
              </div>
              <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-700/30 group-hover:border-zinc-600/50 transition-colors">
                <div className="h-2.5 w-1/2 bg-indigo-500/50 rounded-full mb-3"></div>
                <div className="h-1.5 w-full bg-zinc-700 rounded-full mb-2.5"></div>
                <div className="h-1.5 w-4/5 bg-zinc-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-10">
          <span>© {new Date().getFullYear()} SaaS Engine Inc.</span>
          <span>SOC2 Type II Certified</span>
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10 bg-transparent">
        <div className="w-full max-w-[440px] relative z-10">
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/80 relative">
            <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-lg border border-zinc-800">
                <span className="text-white text-base font-black font-mono">
                  B2
                </span>
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">
                Welcome back
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Sign in to your SaaS Engine workspace
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300 rounded-2xl text-[13px] font-bold text-zinc-700 transition-all shadow-sm hover:shadow active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300 rounded-2xl text-[13px] font-bold text-zinc-700 transition-all shadow-sm hover:shadow active:scale-95"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                GitHub
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white px-4 text-zinc-400">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded-2xl flex items-start gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm placeholder:text-zinc-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                    Password
                  </label>
                  <Link
                    href="/forgot"
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-sm placeholder:text-zinc-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-950 text-white rounded-2xl py-4 text-sm font-bold mt-2 hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Continue to Workspace'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-zinc-500">
              New to the engine?{' '}
              <Link
                href="/register"
                className="font-extrabold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
