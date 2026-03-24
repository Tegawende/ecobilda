'use client';


import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useForm } from '@mantine/form';
import { useTranslations, useLocale } from 'next-intl';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '@/services/auth';
import { profileService } from '@/services/profile';
import { setAuthTokens } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import { DateOfBirthSelect } from '@/components/common/DateOfBirthSelect';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  dob_day: string;
  dob_month: string;
  dob_year: string;
  terms: boolean;
}

interface AuthenticationFormProps {
  initialType?: 'login' | 'register';
}

// Local Input component with proper types (replaces inline 'any' version)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: React.ReactNode;
  description?: string;
  rightSection?: React.ReactNode;
}

const Input = ({ label, error, rightSection, description, className, ...props }: InputProps) => (
  <div className="flex flex-col gap-1.5 relative">
    {label && <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>}
    <div className="relative">
      <input
        className={className || `w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 focus:ring-red-100' : 'border-gray-400 focus:border-black focus:ring-black/10'} focus:outline-none focus:ring-1 transition-all text-gray-900 placeholder-gray-500`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {rightSection && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 font-semibold cursor-pointer select-none underline text-sm">
          {rightSection}
        </div>
      )}
    </div>
    {description && <p className="text-xs text-gray-500 ml-1">{description}</p>}
    {error && (
      <div className="flex items-center gap-1 mt-1 ml-1 text-xs text-red-600" role="alert">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <span>{error}</span>
      </div>
    )}
  </div>
);

// Check if email exists in the system (calls real API or mock based on env)
const checkEmailExists = async (email: string): Promise<boolean> => {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  const normalizedEmail = email.toLowerCase().trim();

  // Always recognize the mock test email
  if (normalizedEmail === 'test@test.be') {
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }

  if (useMock) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    // In mock mode, any email with 'test' is considered existing
    return normalizedEmail.includes('test');
  }

  try {
    const response = await authService.checkEmail(email);
    return response.exists;
  } catch {
    return false;
  }
};

export function AuthenticationForm({ initialType: _initialType = 'login' }: AuthenticationFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { refreshUser } = useAuth();

  // Steps: 'email' -> 'login' OR 'register' OR 'google-register'
  const [step, setStep] = useState<'email' | 'login' | 'register' | 'google-register' | 'verification-sent'>('email');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [email, setEmail] = useState(''); // Shared email state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleAuthData, setGoogleAuthData] = useState<{ tokens: any; user: any } | null>(null);

  // Form for the initial email step
  const emailForm = useForm({
    initialValues: { email: '' },
    validate: {
      email: (val) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : t('auth.validation.email')),
    },
  });

  const loginForm = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      password: (val) => (val.length >= 1 ? null : t('auth.validation.password')),
    },
  });

  const registerForm = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      dob_day: '',
      dob_month: '',
      dob_year: '',
      terms: true,
    },
    validate: {
      password: (val) => {
        // Skip password validation for Google register (no password needed)
        if (step === 'google-register') return null;
        const regex = /^(?=.*[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!regex.test(val)) return t('auth.validation.passwordComplexity');
        return null;
      },
      first_name: (val) => (val.length >= 2 ? null : t('auth.validation.firstName')),
      last_name: (val) => (val.length >= 2 ? null : t('auth.validation.lastName')),
      dob_year: (val, values) => {
        if (!val || !values.dob_month || !values.dob_day) return t('auth.validation.birthDateRequired');
        const year = parseInt(val);
        const month = parseInt(values.dob_month);
        const day = parseInt(values.dob_day);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age >= 18 ? null : t('auth.validation.ageRequirement');
      },
      terms: (val) => {
        // Skip terms validation for Google register
        if (step === 'google-register') return null;
        return val ? null : t('auth.validation.terms');
      },
    },
  });

  const handleEmailSubmit = async (values: { email: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const exists = await checkEmailExists(values.email);
      setEmail(values.email);
      if (exists) {
        setStep('login');
        loginForm.setFieldValue('email', values.email);
      } else {
        setStep('register');
        registerForm.setFieldValue('email', values.email);
      }
    } catch (err) {
      setError('Error checking email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(data);
      router.push('/projects');
    } catch (err: any) {
      setError(t('auth.errorLogin'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const registerData = {
        email: data.email,
        password: data.password,
        password_confirm: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.dob_year && data.dob_month && data.dob_day
          ? `${data.dob_year}-${data.dob_month.padStart(2, '0')}-${data.dob_day.padStart(2, '0')}`
          : '',
        terms: data.terms,
        locale,
      };
      await authService.register(registerData as any);
      setSubmittedEmail(data.email);
      setStep('verification-sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(t('auth.errorRegister'));
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        const { tokens, user, created } = await authService.googleLogin(tokenResponse.access_token);
        if (created) {
          // New Google user: show "finish signing up" form
          setGoogleAuthData({ tokens, user });
          setStep('google-register');
          // Pre-fill name from Google
          registerForm.setFieldValue('first_name', user.first_name || '');
          registerForm.setFieldValue('last_name', user.last_name || '');
          setEmail(user.email);
        } else {
          // Existing user: login directly
          setAuthTokens(tokens);
          await refreshUser();
          router.push('/projects');
        }
      } catch (err: any) {
        setError(t('auth.errorLogin'));
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError(t('auth.errorLogin'));
    },
  });

  const handleGoogleRegister = async (values: any) => {
    if (!googleAuthData) return;
    setIsLoading(true);
    setError(null);
    try {
      // Store tokens first
      setAuthTokens(googleAuthData.tokens);
      // Build date of birth string
      const dobString = values.dob_year && values.dob_month && values.dob_day
        ? `${values.dob_year}-${values.dob_month.padStart(2, '0')}-${values.dob_day.padStart(2, '0')}`
        : undefined;
      // Update profile with additional info
      await profileService.updateProfile({
        first_name: values.first_name,
        last_name: values.last_name,
        date_of_birth: dobString,
      });
      await refreshUser();
      router.push('/projects');
    } catch (err: any) {
      setError(t('auth.errorRegister'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('email');
    setError(null);
    setShowPassword(false);
    setGoogleAuthData(null);
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-stone-100 relative w-full mx-auto" style={{ maxWidth: 450 }}>
      {/* Header Section */}
      {step !== 'verification-sent' && (
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-center relative">
        {(step === 'login' || step === 'register' || step === 'google-register') && (
          <button
            onClick={resetFlow}
            className="absolute left-0 p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
            title={t('common.back')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="w-full text-center text-base font-bold text-gray-800">
          {step === 'email' && t('auth.loginOrSignup')}
          {step === 'login' && t('auth.login')}
          {step === 'register' && t('auth.finishSignup')}
          {step === 'google-register' && t('auth.finishSignup')}
        </h1>
      </div>
      )}

      <div className="mb-6">
        {step === 'email' && <h2 className="text-2xl font-semibold text-gray-800 mb-6">{t('auth.welcome')}</h2>}
      </div>

      {step === 'email' && (
        <>
          <form onSubmit={emailForm.onSubmit(handleEmailSubmit)} className="flex flex-col gap-4">
            <Input
              placeholder="Email"
              type="email"
              {...emailForm.getInputProps('email')}
              className="w-full px-4 py-3.5 rounded-lg border border-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center text-base"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : t('auth.continue')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-gray-500 font-medium">or</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => googleLogin()}
              className="flex items-center justify-between px-4 py-3 border border-gray-400 rounded-lg hover:bg-gray-50 hover:border-black transition-all text-sm font-semibold text-gray-800 cursor-pointer w-full relative h-12"
            >
              <div className="absolute left-4">
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <span className="flex-1 text-center">{t('auth.googleLogin')}</span>
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      {step === 'login' && (
        <form onSubmit={loginForm.onSubmit(handleLogin)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="p-4 rounded-xl border border-gray-400 text-gray-800 text-base">
              {email}
            </div>
          </div>

          <Input
            label={t('auth.password')}
            placeholder={t('auth.password')}
            type={showPassword ? "text" : "password"}
            {...loginForm.getInputProps('password')}
            rightSection={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none text-gray-500 hover:text-gray-700">
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all mt-4"
          >
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
          </button>

          <div className="text-center mt-2">
            <Link href="/forgot-password" className="text-sm font-semibold text-gray-800 hover:underline decoration-1 underline-offset-2">
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={registerForm.onSubmit(handleRegister)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-bold ml-1">{t('auth.contactInfo')}</label>
            <div className="px-4 py-3 rounded-xl border border-gray-400 text-gray-500 text-base bg-gray-50">
              {email}
            </div>
            {/* Helper text removed */}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-bold ml-1">{t('auth.legalName')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={t('auth.firstName')} {...registerForm.getInputProps('first_name')} className="w-full px-4 py-3 rounded-lg border border-gray-400 focus:border-black focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 placeholder-gray-500" />
              <Input placeholder={t('auth.lastName')} {...registerForm.getInputProps('last_name')} className="w-full px-4 py-3 rounded-lg border border-gray-400 focus:border-black focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 placeholder-gray-500" />
            </div>
            {/* Helper text removed */}
          </div>

          <DateOfBirthSelect
            values={{ dob_day: registerForm.values.dob_day, dob_month: registerForm.values.dob_month, dob_year: registerForm.values.dob_year }}
            onChange={(field, value) => registerForm.setFieldValue(field, value)}
            error={registerForm.errors.dob_year as string}
            variant="auth"
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.password')}
            type={showPassword ? "text" : "password"}
            {...registerForm.getInputProps('password')}
            rightSection={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none text-gray-500 hover:text-gray-700">
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            }
          />

          <p className="text-xs text-gray-500 leading-snug">
            By selecting <strong>{t('auth.agreeAndContinue')}</strong>, I agree to Ecobilda's <Link href="/terms" className="text-blue-600 underline">Terms of Service</Link> and acknowledge the <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
          </p>

          <button type="submit" disabled={isLoading} className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all mt-2 disabled:opacity-70 text-base">
            {isLoading ? t('auth.registering') : t('auth.agreeAndContinue')}
          </button>
        </form>
      )}

      {step === 'google-register' && (
        <form onSubmit={registerForm.onSubmit(handleGoogleRegister)} className="flex flex-col gap-5">
          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-bold ml-1">{t('auth.contactInfo')}</label>
            <div className="px-4 py-3 rounded-xl border border-gray-400 text-gray-500 text-base bg-gray-50">
              {email}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-bold ml-1">{t('auth.legalName')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={t('auth.firstName')} {...registerForm.getInputProps('first_name')} className="w-full px-4 py-3 rounded-lg border border-gray-400 focus:border-black focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 placeholder-gray-500" />
              <Input placeholder={t('auth.lastName')} {...registerForm.getInputProps('last_name')} className="w-full px-4 py-3 rounded-lg border border-gray-400 focus:border-black focus:ring-2 focus:ring-black outline-none transition-all text-gray-900 placeholder-gray-500" />
            </div>
          </div>

          <DateOfBirthSelect
            values={{ dob_day: registerForm.values.dob_day, dob_month: registerForm.values.dob_month, dob_year: registerForm.values.dob_year }}
            onChange={(field, value) => registerForm.setFieldValue(field, value)}
            error={registerForm.errors.dob_year as string}
            variant="auth"
          />

          <button type="submit" disabled={isLoading} className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all mt-2 disabled:opacity-70 text-base">
            {isLoading ? t('auth.registering') : t('auth.agreeAndContinue')}
          </button>
        </form>
      )}

      {step === 'verification-sent' && (
        <div className="text-center py-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.registrationSuccess.title')}</h2>
          <p className="text-gray-600 mb-2">{t('auth.registrationSuccess.message')}</p>
          <p className="text-sm font-medium text-gray-800 mb-4">{submittedEmail}</p>
          <p className="text-xs text-gray-500 mb-8">{t('auth.registrationSuccess.spamNote')}</p>
          <button
            onClick={resetFlow}
            className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all"
          >
            {t('auth.registrationSuccess.backToLogin')}
          </button>
        </div>
      )}
    </div>
  );
}
