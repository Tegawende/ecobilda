'use client';


import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useForm } from '@mantine/form';
import { useTranslations, useLocale } from 'next-intl';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '@/services/auth';
import { profileService } from '@/services/profile';
import { setSessionToken } from '@/lib/convexClient';
import { useAuth } from '@/providers/AuthProvider';
import { DateOfBirthSelect } from '@/components/common/DateOfBirthSelect';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Divider,
  Anchor,
  Alert,
  Loader,
  Box,
  ActionIcon,
  SimpleGrid,
  Center,
} from '@mantine/core';
import { IconEye, IconEyeOff, IconAlertCircle, IconChevronLeft, IconMail } from '@tabler/icons-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob_day: string;
  dob_month: string;
  dob_year: string;
  terms: boolean;
}

interface AuthenticationFormProps {
  initialType?: 'login' | 'register';
}

// Check if email exists in the system (calls real API or mock based on env)
const checkEmailExists = async (email: string): Promise<{ exists: boolean; hasPassword: boolean }> => {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  const normalizedEmail = email.toLowerCase().trim();

  // Always recognize the mock test email
  if (normalizedEmail === 'test@test.be') {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { exists: true, hasPassword: true };
  }

  if (useMock) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    // In mock mode, any email with 'test' is considered existing
    return { exists: normalizedEmail.includes('test'), hasPassword: true };
  }

  try {
    const response = await authService.checkEmail(email);
    return { exists: response.exists, hasPassword: response.hasPassword };
  } catch {
    return { exists: false, hasPassword: false };
  }
};

export function AuthenticationForm({ initialType: _initialType = 'login' }: AuthenticationFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { refreshUser } = useAuth();

  // Steps: 'email' -> 'login' OR 'register' OR 'google-register' OR 'google-only'
  const [step, setStep] = useState<'email' | 'login' | 'register' | 'google-register' | 'google-only' | 'verification-sent'>('email');
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
      firstName: '',
      lastName: '',
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
      firstName: (val) => (val.length >= 2 ? null : t('auth.validation.firstName')),
      lastName: (val) => (val.length >= 2 ? null : t('auth.validation.lastName')),
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
      const { exists, hasPassword } = await checkEmailExists(values.email);
      setEmail(values.email);
      if (exists) {
        if (hasPassword) {
          setStep('login');
          loginForm.setFieldValue('email', values.email);
        } else {
          // Account exists but was created via Google OAuth (no password)
          setStep('google-only');
        }
      } else {
        setStep('register');
        registerForm.setFieldValue('email', values.email);
      }
    } catch (err) {
      setError(t('auth.errorCheckEmail'));
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
      const detail = err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.detail;
      setError(detail || t('auth.errorLogin'));
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
        passwordConfirm: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dob_year && data.dob_month && data.dob_day
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
      // Show specific backend validation errors if available
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const messages: string[] = [];
        for (const [, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            messages.push(...value.map(String));
          } else if (typeof value === 'string') {
            messages.push(value);
          }
        }
        if (messages.length > 0) {
          setError(messages.join(' '));
        } else {
          setError(t('auth.errorRegister'));
        }
      } else {
        setError(t('auth.errorRegister'));
      }
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
          registerForm.setFieldValue('firstName', user.firstName || '');
          registerForm.setFieldValue('lastName', user.lastName || '');
          setEmail(user.email);
        } else {
          // Existing user: login directly
          setSessionToken(tokens.access);
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
      setSessionToken(googleAuthData.tokens.access);
      // Build date of birth string
      const dobString = values.dob_year && values.dob_month && values.dob_day
        ? `${values.dob_year}-${values.dob_month.padStart(2, '0')}-${values.dob_day.padStart(2, '0')}`
        : undefined;
      // Update profile with additional info
      await profileService.updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: dobString,
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
    <Paper radius="lg" p={{ base: 'lg', sm: 'xl' }} shadow="xl" withBorder w="100%" maw={450} mx="auto">
      {/* Header Section */}
      {step !== 'verification-sent' && (
      <Group justify="center" pb="md" mb="lg" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', position: 'relative' }}>
        {(step === 'login' || step === 'register' || step === 'google-register' || step === 'google-only') && (
          <ActionIcon
            onClick={resetFlow}
            variant="subtle"
            color="gray"
            radius="xl"
            style={{ position: 'absolute', left: 0 }}
            aria-label={t('common.back')}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
        )}
        <Text fw={700} size="sm" c="dark">
          {step === 'email' && t('auth.loginOrSignup')}
          {step === 'login' && t('auth.login')}
          {step === 'register' && t('auth.finishSignup')}
          {step === 'google-register' && t('auth.finishSignup')}
          {step === 'google-only' && t('auth.login')}
        </Text>
      </Group>
      )}

      <Box mb="lg">
        {step === 'email' && <Title order={3} mb="lg">{t('auth.welcome')}</Title>}
      </Box>

      {step === 'email' && (
        <>
          <form onSubmit={emailForm.onSubmit(handleEmailSubmit)}>
            <Stack gap="md">
              <TextInput
                placeholder={t('auth.email')}
                type="email"
                size="md"
                radius="md"
                {...emailForm.getInputProps('email')}
              />
              <Button
                type="submit"
                disabled={isLoading}
                fullWidth
                size="md"
                radius="md"
                className="bg-eco-primary hover:bg-eco-primaryDark transition-all"
              >
                {isLoading ? <Loader size="sm" color="white" /> : t('auth.continue')}
              </Button>
            </Stack>
          </form>

          <Divider label={t('auth.or')} labelPosition="center" my="lg" />

          <Stack gap="sm">
            <Button
              onClick={() => googleLogin()}
              variant="outline"
              color="gray"
              fullWidth
              size="md"
              radius="md"
              justify="center"
              leftSection={
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              }
              styles={{ inner: { fontWeight: 600 } }}
              className="hover:border-black transition-all"
            >
              {t('auth.googleLogin')}
            </Button>
          </Stack>
        </>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mt="md" radius="md">
          <Text size="xs">{error}</Text>
        </Alert>
      )}

      {step === 'login' && (
        <form onSubmit={loginForm.onSubmit(handleLogin)}>
          <Stack gap="md">
            <Box px="md" py="sm" style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-4)' }}>
              <Text c="dark">{email}</Text>
            </Box>

            <PasswordInput
              label={t('auth.password')}
              placeholder={t('auth.password')}
              size="md"
              radius="md"
              visible={showPassword}
              onVisibilityChange={() => setShowPassword(!showPassword)}
              visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              {...loginForm.getInputProps('password')}
            />

            <Button
              type="submit"
              disabled={isLoading}
              fullWidth
              size="md"
              radius="md"
              mt="sm"
              className="bg-eco-primary hover:bg-eco-primaryDark transition-all"
            >
              {isLoading ? t('auth.loggingIn') : t('auth.login')}
            </Button>

            <Center mt="xs">
              <Anchor component={Link} href="/forgot-password" size="sm" fw={600} c="dark" underline="hover">
                {t('auth.forgotPassword')}
              </Anchor>
            </Center>
          </Stack>
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={registerForm.onSubmit(handleRegister)}>
          <Stack gap="md">
            <Box>
              <Text size="xs" c="dimmed" fw={700} mb={4} ml={4}>{t('auth.contactInfo')}</Text>
              <Box px="md" py="sm" style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-4)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text c="dimmed">{email}</Text>
              </Box>
            </Box>

            <Box>
              <Text size="xs" c="dimmed" fw={700} mb={4} ml={4}>{t('auth.legalName')}</Text>
              <SimpleGrid cols={2} spacing="xs">
                <TextInput
                  placeholder={t('auth.firstName')}
                  size="md"
                  radius="md"
                  {...registerForm.getInputProps('firstName')}
                />
                <TextInput
                  placeholder={t('auth.lastName')}
                  size="md"
                  radius="md"
                  {...registerForm.getInputProps('lastName')}
                />
              </SimpleGrid>
            </Box>

            <DateOfBirthSelect
              values={{ dob_day: registerForm.values.dob_day, dob_month: registerForm.values.dob_month, dob_year: registerForm.values.dob_year }}
              onChange={(field, value) => registerForm.setFieldValue(field, value)}
              error={registerForm.errors.dob_year as string}
              variant="auth"
            />

            <PasswordInput
              label={t('auth.password')}
              placeholder={t('auth.password')}
              size="md"
              radius="md"
              visible={showPassword}
              onVisibilityChange={() => setShowPassword(!showPassword)}
              visibilityToggleIcon={({ reveal }) => reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              {...registerForm.getInputProps('password')}
            />

            <Text size="xs" c="dimmed" lh={1.4}>
              {t.rich('auth.termsAgreement', {
                action: t('auth.agreeAndContinue'),
                bold: (chunks) => <Text span fw={700}>{chunks}</Text>,
                termsLink: (chunks) => <Anchor component={Link} href="/terms" size="xs">{chunks}</Anchor>,
                privacyLink: (chunks) => <Anchor component={Link} href="/privacy" size="xs">{chunks}</Anchor>,
              })}
            </Text>

            <Button
              type="submit"
              disabled={isLoading}
              fullWidth
              size="md"
              radius="md"
              mt="xs"
              className="bg-eco-primary hover:bg-eco-primaryDark transition-all"
            >
              {isLoading ? t('auth.registering') : t('auth.agreeAndContinue')}
            </Button>
          </Stack>
        </form>
      )}

      {step === 'google-register' && (
        <form onSubmit={registerForm.onSubmit(handleGoogleRegister)}>
          <Stack gap="md">
            {/* Email (read-only) */}
            <Box>
              <Text size="xs" c="dimmed" fw={700} mb={4} ml={4}>{t('auth.contactInfo')}</Text>
              <Box px="md" py="sm" style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-4)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text c="dimmed">{email}</Text>
              </Box>
            </Box>

            <Box>
              <Text size="xs" c="dimmed" fw={700} mb={4} ml={4}>{t('auth.legalName')}</Text>
              <SimpleGrid cols={2} spacing="xs">
                <TextInput
                  placeholder={t('auth.firstName')}
                  size="md"
                  radius="md"
                  {...registerForm.getInputProps('firstName')}
                />
                <TextInput
                  placeholder={t('auth.lastName')}
                  size="md"
                  radius="md"
                  {...registerForm.getInputProps('lastName')}
                />
              </SimpleGrid>
            </Box>

            <DateOfBirthSelect
              values={{ dob_day: registerForm.values.dob_day, dob_month: registerForm.values.dob_month, dob_year: registerForm.values.dob_year }}
              onChange={(field, value) => registerForm.setFieldValue(field, value)}
              error={registerForm.errors.dob_year as string}
              variant="auth"
            />

            <Button
              type="submit"
              disabled={isLoading}
              fullWidth
              size="md"
              radius="md"
              mt="xs"
              className="bg-eco-primary hover:bg-eco-primaryDark transition-all"
            >
              {isLoading ? t('auth.registering') : t('auth.agreeAndContinue')}
            </Button>
          </Stack>
        </form>
      )}

      {step === 'google-only' && (
        <Stack gap="md" align="center">
          <Box px="md" py="sm" w="100%" style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-4)' }}>
            <Text c="dark" ta="center">{email}</Text>
          </Box>
          <Text size="sm" c="dimmed" ta="center">
            {t('auth.googleOnlyAccount')}
          </Text>
          <Button
            onClick={() => googleLogin()}
            variant="outline"
            color="gray"
            fullWidth
            size="md"
            radius="md"
            justify="center"
            leftSection={
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
            styles={{ inner: { fontWeight: 600 } }}
            className="hover:border-black transition-all"
          >
            {t('auth.googleLogin')}
          </Button>
          <Divider label={t('auth.or')} labelPosition="center" w="100%" />
          <Anchor component={Link} href="/forgot-password" size="sm" fw={600} c="dark" underline="hover">
            {t('auth.setPasswordViaReset')}
          </Anchor>
        </Stack>
      )}

      {step === 'verification-sent' && (
        <Stack align="center" py="md">
          <Center>
            <Box className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <IconMail size={32} className="text-green-600" stroke={1.5} />
            </Box>
          </Center>
          <Title order={4} ta="center">{t('auth.registrationSuccess.title')}</Title>
          <Text c="dimmed" ta="center">{t('auth.registrationSuccess.message')}</Text>
          <Text fw={500} size="sm" ta="center">{submittedEmail}</Text>
          <Text size="xs" c="dimmed" ta="center">{t('auth.registrationSuccess.spamNote')}</Text>
          <Button
            onClick={resetFlow}
            fullWidth
            size="md"
            radius="md"
            mt="md"
            className="bg-eco-primary hover:bg-eco-primaryDark transition-all"
          >
            {t('auth.registrationSuccess.backToLogin')}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
