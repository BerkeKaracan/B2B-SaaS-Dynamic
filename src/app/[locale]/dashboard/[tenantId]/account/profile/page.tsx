'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  User,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Briefcase,
  Clock,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

export default function ProfileSettingsPage() {
  const { user, updateProfile, uploadAvatar } = useAuthStore();
  const t = useTranslations('profileSettingsPage');

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [timezone, setTimezone] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const allTimezones = Intl.supportedValuesOf('timeZone');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(user.full_name || '');
      setJobTitle(user.job_title || '');
      setTimezone(
        user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    }
  }, [user]);

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await updateProfile({
        full_name: fullName,
        job_title: jobTitle,
        timezone: timezone,
      });

      setStatusMessage({
        type: 'success',
        text: t('messages.updateSuccess'),
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage({ type: 'error', text: t('messages.updateError') });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFileUpload(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: t('messages.invalidImage') });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    setStatusMessage(null);
    try {
      await uploadAvatar(file);
      setStatusMessage({
        type: 'success',
        text: t('messages.avatarSuccess'),
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage({ type: 'error', text: t('messages.avatarError') });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'US';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto w-full p-6 sm:p-10 pb-32">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight mb-2">
          {t('title')}
        </h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {t('description')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
            {t('sections.profilePicture')}
          </h2>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative group shrink-0">
              {previewUrl || user.avatar_url ? (
                <Image
                  src={previewUrl || user.avatar_url || ''}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center text-2xl font-extrabold shadow-sm border-2 border-transparent">
                  {user.initials || getInitials(fullName)}
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-zinc-900 dark:text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group
                  ${
                    isDragging
                      ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50'
                      : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/50'
                  }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/gif"
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <UploadCloud
                    className={`w-6 h-6 mb-1 transition-colors ${isDragging ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}
                  />
                  <p className="text-sm font-medium text-center">
                    <span className="text-zinc-900 dark:text-white font-bold">
                      {t('upload.clickToUpload')}
                    </span>{' '}
                    {t('upload.dragAndDrop')}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {t('upload.rules')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
                {t('sections.personalInfo')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-300 ml-1">
                    {t('fields.fullName')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-white/10 dark:text-white transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-300 ml-1">
                    {t('fields.jobTitle')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Briefcase className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-white/10 dark:text-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-300 ml-1">
                      {t('fields.email')}
                    </label>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md uppercase">
                      {t('hints.readOnly')}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                    {t('hints.emailChangeWarning')}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-4">
                {t('sections.preferences')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-300 ml-1">
                    {t('fields.timezone')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Clock className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-white/10 dark:text-white transition-all shadow-sm appearance-none"
                    >
                      {allTimezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-300 ml-1">
                    {t('fields.language')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Globe className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <select
                      value={locale}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-white/10 dark:text-white transition-all shadow-sm appearance-none"
                    >
                      <option value="en">English (US)</option>
                      <option value="tr">Türkçe (TR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {statusMessage.text}
              </div>
            )}

            <div className="pt-4 flex justify-end border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('buttons.saving')}
                  </>
                ) : (
                  t('buttons.saveChanges')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
