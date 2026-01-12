
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth';
import { mockAuthService } from '../../services/mockServices';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date | null;
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
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
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
    // TODO: Call actual API endpoint to check email existence
    // const response = await authService.checkEmail(email);
    // return response.exists;

    // For now, return false to always show registration
    await new Promise(resolve => setTimeout(resolve, 300));
    return false;
  } catch {
    return false;
  }
};

export function AuthenticationForm({ initialType: _initialType = 'login' }: AuthenticationFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Steps: 'email' -> 'login' OR 'register'
  const [step, setStep] = useState<'email' | 'login' | 'register'>('email');
  const [email, setEmail] = useState(''); // Shared email state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form for the initial email step
  const emailForm = useForm({
    initialValues: { email: '' },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : t('auth.validation.email')),
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
      date_of_birth: null,
      terms: false,
    },
    validate: {
      password: (val) => {
        // 8 chars, 1 number or symbol
        const regex = /^(?=.*[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!regex.test(val)) return t('auth.validation.passwordComplexity');
        if (val.toLowerCase().includes(email.split('@')[0].toLowerCase())) return "Password can't contain email";
        return null;
      },
      first_name: (val) => (val.length >= 2 ? null : t('auth.validation.firstName')),
      last_name: (val) => (val.length >= 2 ? null : t('auth.validation.lastName')),
      date_of_birth: (val) => {
        if (!val) return t('auth.validation.birthDateRequired');
        const birthDate = new Date(val);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 18 ? null : t('auth.validation.ageRequirement');
      },
      terms: (val) => (val ? null : t('auth.validation.terms')),
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
      // Check if this is the mock test user
      if (mockAuthService.isMockUser(data.email)) {
        const result = await mockAuthService.mockLogin();
        localStorage.setItem('auth_tokens', JSON.stringify(result.tokens));
        localStorage.setItem('mock_user', JSON.stringify(result.user));
        navigate('/projects');
      } else {
        await authService.login(data);
        navigate('/projects');
      }
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
        date_of_birth: data.date_of_birth
          ? `${data.date_of_birth.getFullYear()}-${String(data.date_of_birth.getMonth() + 1).padStart(2, '0')}-${String(data.date_of_birth.getDate()).padStart(2, '0')}`
          : '',
        terms: data.terms,
      };
      await authService.register(registerData as any);
      navigate('/dashboard');
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
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-stone-100 relative max-w-md mx-auto">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-center relative">
        {(step === 'login' || step === 'register') && (
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
        </h1>
      </div>

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
            <button className="flex items-center justify-between px-4 py-3 border border-gray-400 rounded-lg hover:bg-gray-50 hover:border-black transition-all text-sm font-semibold text-gray-800 group cursor-pointer w-full relative h-12">
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

            <button className="flex items-center justify-between px-4 py-3 border border-gray-400 rounded-lg hover:bg-gray-50 hover:border-black transition-all text-sm font-semibold text-gray-800 group cursor-pointer w-full relative h-12">
              <div className="absolute left-4">
                <img src="/images/128px-Apple_logo_black.svg.png" alt="Apple" width={20} height={20} className="object-contain" />
              </div>
              <span className="flex-1 text-center">{t('auth.appleLogin')}</span>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                {showPassword ? t('common.hide', { defaultValue: 'Hide' }) : t('common.show', { defaultValue: 'Show' })}
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
            <Link to="/forgot-password" className="text-sm font-semibold text-gray-800 hover:underline decoration-1 underline-offset-2">
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

          <Input
            label={t('auth.dateOfBirth')}
            type="date"
            {...registerForm.getInputProps('date_of_birth')}
            value={registerForm.values.date_of_birth ? registerForm.values.date_of_birth.toISOString().split('T')[0] : ''}
            onChange={(e: any) => registerForm.setFieldValue('date_of_birth', e.target.valueAsDate)}
            error={registerForm.errors.date_of_birth}
            description={t('auth.dobDesc')}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.password')}
            type={showPassword ? "text" : "password"}
            {...registerForm.getInputProps('password')}
            rightSection={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                {showPassword ? t('common.hide', { defaultValue: 'Hide' }) : t('common.show', { defaultValue: 'Show' })}
              </button>
            }
          />

          <p className="text-xs text-gray-500 leading-snug">
            By selecting <strong>{t('auth.agreeAndContinue')}</strong>, I agree to Ecobilda's <Link to="/terms" className="text-blue-600 underline">Terms of Service</Link> and acknowledge the <Link to="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
          </p>

          <button type="submit" disabled={isLoading} className="w-full bg-eco-primary hover:bg-eco-primaryDark text-white font-bold py-3.5 rounded-lg shadow-sm transition-all mt-2 disabled:opacity-70 text-base">
            {isLoading ? t('auth.registering') : t('auth.agreeAndContinue')}
          </button>
        </form>
      )}
    </div>
  );
}
