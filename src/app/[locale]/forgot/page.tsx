"use client";
import React, { useState } from "react";
import Link from "next/link";
import BrandLogo, { BrandMark } from "@/components/brand/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send reset link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 font-sans text-zinc-900 selection:bg-blue-200 overflow-hidden relative">
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-zinc-950 text-white p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10">
          <BrandLogo size="md" inverted showTagline href={false} />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto mt-10">
          <h1 className="text-5xl font-black leading-[1.05] tracking-tighter mb-6 text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-500">
            Secure your workflow.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12 font-medium">
            Get back to your workspace securely. We use enterprise-grade
            encryption to protect your dynamic block data.
          </p>

          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                  Security Protocol
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                Active
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                <svg
                  className="w-5 h-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                End-to-End Encryption
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                <svg
                  className="w-5 h-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure Token Authentication
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] font-black text-zinc-600 uppercase tracking-widest mt-10">
          <span>© {new Date().getFullYear()} SaaS Engine Inc.</span>
          <span>SOC2 Type II Certified</span>
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative z-10 bg-[#fafafb] lg:bg-transparent">
        <div className="absolute hidden lg:block top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-white/50 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-[420px] relative z-10">
          <div className="bg-white p-8 sm:p-12 rounded-4xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-zinc-200/60 relative">
            {!success && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-950 text-xs font-semibold mb-8 transition-colors group/back"
              >
                <svg
                  className="w-3.5 h-3.5 transform group-hover/back:-translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to login
              </Link>
            )}

            <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
              <BrandMark size="md" />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">
                {success ? "Check your email" : "Reset password"}
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                {success
                  ? "We sent a recovery link to your email address."
                  : "Enter your email address and we'll send you a recovery link."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50/50 border border-red-100/80 text-red-600 text-sm font-medium rounded-xl flex items-start gap-2.5">
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

            {success ? (
              <div className="space-y-6">
                <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl text-sm font-medium text-zinc-600">
                  Recovery link sent to: <br />
                  <span className="text-zinc-950 font-semibold">{email}</span>
                </div>

                <Link
                  href="/login"
                  className="w-full bg-zinc-950 text-white rounded-xl py-3 text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Return to login
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-zinc-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-zinc-950/5 focus:border-zinc-950 transition-all placeholder:text-zinc-400 shadow-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-zinc-950 text-white rounded-xl py-3 text-sm font-semibold mt-6 hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Sending link...
                    </>
                  ) : (
                    "Send recovery link"
                  )}
                </button>
              </form>
            )}

            {!success && (
              <p className="mt-8 text-center text-[13px] font-medium text-zinc-500">
                Don&apos;t need a reset?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-zinc-950 hover:underline transition-all"
                >
                  Cancel
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
