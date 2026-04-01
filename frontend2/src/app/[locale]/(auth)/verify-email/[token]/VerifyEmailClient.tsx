'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { IconCheck, IconX, IconMail, IconLoader2, IconInfoCircle } from '@tabler/icons-react';
import { authService } from '@/services/auth';
import { useAuth } from '@/providers/AuthProvider';

type VerificationStatus = 'loading' | 'success' | 'already_verified' | 'error' | 'expired';

export function VerifyEmailClient({ token }: { token: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage(t('auth.verification.noToken') || 'Missing verification token.');
    }
  }, [token, t]);

  // If already logged in and verification succeeded or already verified, redirect
  useEffect(() => {
    if (isAuthenticated && (status === 'success' || status === 'already_verified')) {
      router.push('/projects');
    }
  }, [isAuthenticated, status, router]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await authService.verifyEmail(verificationToken);
      if (response.data?.already_verified) {
        setStatus('already_verified');
        setMessage(t('auth.verification.alreadyVerified') || 'Your email has already been verified.');
      } else {
        setStatus('success');
        setMessage(t('auth.verification.success'));
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; expired?: boolean; already_verified?: boolean }; status?: number } };
      if (err.response?.data?.already_verified) {
        setStatus('already_verified');
        setMessage(t('auth.verification.alreadyVerified') || 'Your email has already been verified.');
      } else if (err.response?.status === 400 && err.response?.data?.expired) {
        setStatus('expired');
        setMessage(t('auth.verification.expired'));
      } else {
        setStatus('error');
        setMessage(t('auth.verification.error'));
      }
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      await authService.sendVerificationEmail();
      setResendSuccess(true);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-stone-100 text-center max-w-md w-full">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 rounded-full bg-eco-primary/10 flex items-center justify-center">
              <IconLoader2 size={32} className="text-eco-primary animate-spin" strokeWidth={1.5} />
            </div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <IconCheck size={32} className="text-green-600" strokeWidth={2} />
            </div>
          )}
          {status === 'already_verified' && (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <IconInfoCircle size={32} className="text-blue-600" strokeWidth={1.5} />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <IconX size={32} className="text-red-600" strokeWidth={2} />
            </div>
          )}
          {status === 'expired' && (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <IconMail size={32} className="text-amber-600" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
          {status === 'loading' && (t('auth.verification.verifying') || 'Verifying...')}
          {status === 'success' && (t('auth.verification.successTitle') || 'Email verified!')}
          {status === 'already_verified' && (t('auth.verification.alreadyVerifiedTitle') || 'Already verified')}
          {status === 'error' && (t('auth.verification.errorTitle') || 'Verification error')}
          {status === 'expired' && (t('auth.verification.expiredTitle') || 'Link expired')}
        </h1>

        {/* Message */}
        <p className="text-gray-500 mb-8">
          {message}
        </p>

        {/* Actions */}
        {(status === 'success' || status === 'already_verified' || status === 'error') && (
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark transition-all shadow-lg hover:-translate-y-0.5"
          >
            {t('auth.verification.goToLogin') || 'Log in'}
          </Link>
        )}

        {status === 'expired' && !resendSuccess && (
          <button
            onClick={handleResendEmail}
            disabled={resendLoading}
            className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? (
              <IconLoader2 size={18} className="animate-spin" />
            ) : (
              <IconMail size={18} />
            )}
            {t('auth.verification.resendEmail') || 'Resend email'}
          </button>
        )}

        {resendSuccess && (
          <p className="text-green-600 font-medium">
            {t('auth.verification.emailSent') || 'A new verification email has been sent!'}
          </p>
        )}
      </div>
    </div>
  );
}
