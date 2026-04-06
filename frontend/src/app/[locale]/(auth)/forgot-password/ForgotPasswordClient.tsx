'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { IconMail, IconArrowLeft, IconCheck, IconLoader2 } from '@tabler/icons-react';
import { authService } from '@/services/auth';
import { Layout } from '@/components/common/Layout';

export function ForgotPasswordClient() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch {
      setError(t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-stone-100 text-center max-w-md w-full">
          {success ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <IconCheck size={32} className="text-green-600" strokeWidth={2} />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('auth.resetEmailSent')}
              </h1>
              <p className="text-gray-500 mb-8">
                {t('auth.resetEmailSentDesc')}
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
                  <IconMail size={32} className="text-eco-blue" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('auth.forgotPassword')}
              </h1>
              <p className="text-gray-500 mb-8">
                {t('auth.forgotPasswordDesc')}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email')}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-eco-blue focus:ring-1 focus:ring-eco-blue outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 rounded-full bg-eco-blue text-white font-semibold hover:bg-eco-blueDark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <IconLoader2 size={18} className="animate-spin" /> : null}
                  {t('auth.sendResetLink')}
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
