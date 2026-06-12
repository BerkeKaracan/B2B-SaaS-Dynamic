"use client";
import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Shield,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function SecuritySettingsPage() {
  const { updatePassword } = useAuthStore();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 6) {
      setStatusMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(newPassword);
      setStatusMessage({
        type: "success",
        text: "Password updated successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setStatusMessage({ type: "error", text: error.message });
      } else {
        setStatusMessage({ type: "error", text: "Failed to update password." });
      }
    } finally {
      setIsSaving(false);
    }
  };

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
                  Your account uses standard email & password authentication.
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
                  statusMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {statusMessage.type === "success" ? (
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
                  "Update Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
