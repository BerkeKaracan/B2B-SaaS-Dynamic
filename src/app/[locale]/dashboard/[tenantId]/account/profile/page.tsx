"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  User,
  Mail,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

export default function ProfileSettingsPage() {
  const { user, updateProfile, uploadAvatar } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.full_name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(user.full_name);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await updateProfile({ full_name: fullName });
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully.",
      });

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        text: "Please select a valid image file.",
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);
    try {
      await uploadAvatar(file);
      setStatusMessage({
        type: "success",
        text: "Avatar uploaded successfully.",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({ type: "error", text: "Failed to upload avatar." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto w-full p-6 sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight mb-2">
          Personal Profile
        </h1>
        <p className="text-sm font-medium text-zinc-500">
          Update your photo and personal details here.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-extrabold text-zinc-900 mb-6 uppercase tracking-widest">
            Profile Picture
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border border-zinc-200 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-950 text-white flex items-center justify-center text-2xl font-extrabold shadow-sm">
                  {user.initials || getInitials(user.full_name)}
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 text-zinc-700 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Change picture"}
                </button>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                JPG, GIF or PNG. Max size of 2MB.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-extrabold text-zinc-900 mb-6 uppercase tracking-widest">
            Personal Information
          </h2>

          <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="text-[13px] font-extrabold text-zinc-700 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/50 border border-zinc-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 focus:bg-white transition-all shadow-sm text-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-extrabold text-zinc-700 ml-1">
                  Email Address
                </label>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md uppercase">
                  Read Only
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/50 border border-zinc-200/50 rounded-xl text-sm font-medium text-zinc-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-zinc-500 ml-1">
                To change your email address, please contact workspace admin.
              </p>
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
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {statusMessage.text}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || fullName === user.full_name}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
