'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { IconLock, IconCheck, IconLoader2, IconArrowLeft, IconEye, IconEyeOff } from '@tabler/icons-react';
import { authService } from '@/services/auth';
import { Layout } from '@/components/common/Layout';

export function ResetPasswordClient() {
  const t = useTranslations();
  const params = useParams<{ uid: string; token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('auth.validation.password'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.validation.passwordMatch'));
      return;
    }

    setIsLoading(true);
    try {
      // Backend expects token in format "uid-token"
      const combinedToken = `${params.uid}-${params.token}`;
      await authService.confirmPasswordReset(combinedToken, password);
      setSuccess(true);
    } catch (err: any) {
      const detail = err?.response?.data?.error;
      setError(detail || t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-slate-50">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-stone-100 text-center max-w-md w-full">
          {success ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <IconCheck size={32} className="text-green-600" strokeWidth={2} />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('auth.passwordChanged')}
              </h1>
              <p className="text-gray-500 mb-8">
                {t('auth.passwordChangedDesc')}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-eco-blue text-white font-semibold hover:bg-eco-blueDark transition-all"
              >
                {t('auth.backToLogin')}
              </Link>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-eco-blue/10 flex items-center justify-center">
                  <IconLock size={32} className="text-eco-blue" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('auth.resetYourPassword')}
              </h1>
              <p className="text-gray-500 mb-8">
                {t('auth.resetYourPasswordDesc')}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('settings.newPassword')}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-eco-blue focus:ring-1 focus:ring-eco-blue outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPassword')}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-eco-blue focus:ring-1 focus:ring-eco-blue outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 rounded-full bg-eco-blue text-white font-semibold hover:bg-eco-blueDark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <IconLoader2 size={18} className="animate-spin" /> : null}
                  {t('auth.resetPassword')}
                </button>
              </form>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-6 text-sm text-gray-500 hover:text-eco-blue"
              >
                <IconArrowLeft size={16} />
                {t('auth.backToLogin')}
              </Link>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
