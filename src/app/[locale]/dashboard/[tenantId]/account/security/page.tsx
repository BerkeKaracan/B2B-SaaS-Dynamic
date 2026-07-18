'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchAPI } from '@/services/api';
import Cookies from 'js-cookie';
import {
  Shield,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';

type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  status?: string | null;
};

type MfaStatus = {
  enabled: boolean;
  factors: MfaFactor[];
};

type EnrollData = {
  factor_id: string;
  qr_code: string;
  secret: string;
  uri: string;
};

function getSessionToken(): string {
  const token =
    Cookies.get('token') ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (!token) {
    throw new Error('You are not signed in. Please log in again.');
  }
  if (!Cookies.get('token')) {
    Cookies.set('token', token, { expires: 7 });
  }
  return token;
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getSessionToken()}` };
}

export default function SecuritySettingsPage() {
  const { updatePassword } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [disableMode, setDisableMode] = useState(false);

  const loadMfaStatus = useCallback(async () => {
    setMfaLoading(true);
    try {
      const res = await fetchAPI('/api/auth/mfa/status', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load 2FA status');
      const data = (await res.json()) as MfaStatus;
      setMfaStatus(data);
    } catch {
      setMfaStatus({ enabled: false, factors: [] });
    } finally {
      setMfaLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load MFA status on mount
    void loadMfaStatus();
  }, [loadMfaStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(newPassword);
      setStatusMessage({
        type: 'success',
        text: 'Password updated successfully.',
      });
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update password.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEnroll = async () => {
    setMfaMessage(null);
    setMfaBusy(true);
    setDisableMode(false);
    try {
      const res = await fetchAPI('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Failed to start 2FA enrollment'
        );
      }
      setEnrollData(data as EnrollData);
      setMfaCode('');
    } catch (error: unknown) {
      setMfaMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to start 2FA enrollment',
      });
    } finally {
      setMfaBusy(false);
    }
  };

  const confirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    setMfaMessage(null);
    setMfaBusy(true);
    try {
      const res = await fetchAPI('/api/auth/mfa/verify-enrollment', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          factor_id: enrollData.factor_id,
          code: mfaCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Invalid authenticator code'
        );
      }
      if (data.access_token) {
        Cookies.set('token', data.access_token, { expires: 7 });
        localStorage.setItem('token', data.access_token);
      }
      setEnrollData(null);
      setMfaCode('');
      setMfaMessage({
        type: 'success',
        text: 'Google Authenticator is now enabled.',
      });
      await loadMfaStatus();
    } catch (error: unknown) {
      setMfaMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Invalid authenticator code',
      });
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    const factorId = mfaStatus?.factors?.[0]?.id;
    if (!factorId) return;

    setMfaMessage(null);
    setMfaBusy(true);
    try {
      const res = await fetchAPI(`/api/auth/mfa/factors/${factorId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ code: mfaCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Could not disable 2FA'
        );
      }
      setDisableMode(false);
      setMfaCode('');
      setMfaMessage({
        type: 'success',
        text: 'Two-factor authentication disabled.',
      });
      setMfaStatus(data as MfaStatus);
    } catch (error: unknown) {
      setMfaMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Could not disable 2FA',
      });
    } finally {
      setMfaBusy(false);
    }
  };

  const qrSrc = enrollData?.qr_code
    ? enrollData.qr_code.startsWith('data:')
      ? enrollData.qr_code
      : `data:image/svg+xml;utf8,${encodeURIComponent(enrollData.qr_code)}`
    : '';

  return (
    <div className="max-w-4xl mx-auto w-full p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight mb-2">
          Security & Password
        </h1>
        <p className="text-sm font-medium text-zinc-500">
          Manage your password and secure your account.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-950 text-white border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Account is Protected
                </h3>
                <p className="text-sm text-zinc-400 font-medium">
                  {mfaStatus?.enabled
                    ? 'Password + Google Authenticator (2FA) are enabled.'
                    : 'Your account uses standard email & password authentication.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-extrabold text-zinc-900 mb-6 uppercase tracking-widest flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            Change Password
          </h2>

          <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-extrabold text-zinc-700 ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 focus:bg-white transition-all shadow-sm text-zinc-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-extrabold text-zinc-700 ml-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 focus:bg-white transition-all shadow-sm text-zinc-900"
                  required
                />
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {statusMessage.text}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-extrabold text-zinc-900 mb-2 uppercase tracking-widest flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-zinc-400" />
            Two-factor authentication
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Use Google Authenticator (or any TOTP app) for an extra login step.
          </p>

          {mfaLoading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking 2FA status...
            </div>
          ) : (
            <div className="space-y-6 max-w-xl">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  mfaStatus?.enabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                }`}
              >
                {mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
              </div>

              {mfaMessage && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
                    mfaMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {mfaMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {mfaMessage.text}
                </div>
              )}

              {enrollData ? (
                <form onSubmit={confirmEnrollment} className="space-y-4">
                  <p className="text-sm text-zinc-600">
                    Scan this QR code with Google Authenticator, then enter the
                    6-digit code to confirm.
                  </p>
                  {qrSrc && (
                    <div className="bg-white border border-zinc-200 rounded-xl p-4 w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSrc}
                        alt="Authenticator QR code"
                        className="w-48 h-48"
                      />
                    </div>
                  )}
                  {enrollData.secret && (
                    <p className="text-xs font-mono text-zinc-500 break-all">
                      Manual key: {enrollData.secret}
                    </p>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={mfaCode}
                    onChange={(e) =>
                      setMfaCode(e.target.value.replace(/\s/g, ''))
                    }
                    placeholder="123456"
                    className="w-full px-4 py-2.5 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm font-medium tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={mfaBusy || mfaCode.trim().length < 6}
                      className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {mfaBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Confirm & enable
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEnrollData(null);
                        setMfaCode('');
                      }}
                      className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : disableMode ? (
                <form onSubmit={disableMfa} className="space-y-4">
                  <p className="text-sm text-zinc-600">
                    Enter a current authenticator code to disable 2FA.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={mfaCode}
                    onChange={(e) =>
                      setMfaCode(e.target.value.replace(/\s/g, ''))
                    }
                    placeholder="123456"
                    className="w-full px-4 py-2.5 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm font-medium tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={mfaBusy || mfaCode.trim().length < 6}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60"
                    >
                      {mfaBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Disable 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisableMode(false);
                        setMfaCode('');
                      }}
                      className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : mfaStatus?.enabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setDisableMode(true);
                    setMfaCode('');
                    setMfaMessage(null);
                  }}
                  disabled={mfaBusy}
                  className="px-5 py-2.5 border border-red-200 text-red-700 text-sm font-bold rounded-xl hover:bg-red-50"
                >
                  Disable authenticator
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startEnroll}
                  disabled={mfaBusy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-60"
                >
                  {mfaBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  Enable Google Authenticator
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
