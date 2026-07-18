'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import AuthShell, { AuthPanelNodes } from '@/components/auth/AuthShell';
import {
  authLink,
  authPrimaryBtn,
  authSecondaryBtn,
} from '@/components/auth/authStyles';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      panelTitle={
        <>
          Reset stays
          <br />
          out of scope.
        </>
      }
      panelSubtitle="This portfolio demo does not send recovery emails. Use your existing credentials or reach out via contact."
      panelVisual={<AuthPanelNodes />}
    >
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to login
      </Link>

      <div className="mb-7">
        <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800 bg-amber-50 border border-amber-100/80 px-2.5 py-1 rounded-md mb-4">
          Portfolio demo
        </p>
        <h2
          className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-zinc-950 mb-2"
          style={{
            fontFamily: 'var(--font-auth-display), system-ui, sans-serif',
          }}
        >
          Password reset unavailable
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          No recovery link will be emailed from this build. Sign in with your
          existing account, or contact us if you need help.
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/login" className={authPrimaryBtn}>
          Return to login
        </Link>
        <Link href="/contact" className={authSecondaryBtn}>
          <Mail className="w-4 h-4" />
          Contact via email
        </Link>
      </div>

      <p className="mt-7 text-center text-sm text-zinc-500">
        Need an account?{' '}
        <Link href="/register" className={authLink}>
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
