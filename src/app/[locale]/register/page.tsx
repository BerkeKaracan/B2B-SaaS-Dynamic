'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import ColdStartAlert from '@/components/ColdStartAlert';
import Cookies from 'js-cookie';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getApiBaseUrl } from '@/lib/apiBase';
import AuthShell, {
  AuthCheckingScreen,
  AuthPanelNodes,
} from '@/components/auth/AuthShell';
import AuthOAuthRow from '@/components/auth/AuthOAuthRow';
import {
  authError,
  authInputWithIcon,
  authLabel,
  authLink,
  authPrimaryBtn,
} from '@/components/auth/authStyles';

export default function RegisterPage() {
  const router = useRouter();
  useAuthStore((state) => state.fetchUser);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      const savedTenant = Cookies.get('tenant_id');
      if (savedTenant) {
        router.replace(`/dashboard/${savedTenant}/projects`);
      } else {
        router.replace('/onboarding');
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsChecking(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || 'An error occurred during registration.'
        );
      }

      router.push('/login?registered=true');
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
    return <AuthCheckingScreen label="Initializing" />;
  }

  return (
    <>
      <ColdStartAlert />
      <AuthShell
        panelTitle={
          <>
            Deploy a workspace
            <br />
            in minutes.
          </>
        }
        panelSubtitle="Create your administrator account, then shape projects on a spatial canvas — portfolio demo of a multi-tenant SaaS engine."
        panelVisual={<AuthPanelNodes />}
      >
        <div className="mb-7">
          <h2
            className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-zinc-950 mb-2"
            style={{
              fontFamily: 'var(--font-auth-display), system-ui, sans-serif',
            }}
          >
            Create account
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Set up your B2 SaaS Engine profile to continue to onboarding.
          </p>
        </div>

        <AuthOAuthRow
          onGoogle={handleGoogleLogin}
          onGithub={handleGithubLogin}
          dividerLabel="Or sign up with email"
        />

        {error && (
          <div className={authError}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={authLabel}>Full name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Cooper"
                className={authInputWithIcon}
                required
              />
            </div>
          </div>

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
            <label className={authLabel}>Password</label>
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

          <div>
            <label className={authLabel}>Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={authInputWithIcon}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${authPrimaryBtn} mt-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className={authLink}>
            Sign in
          </Link>
        </p>
      </AuthShell>
    </>
  );
}
