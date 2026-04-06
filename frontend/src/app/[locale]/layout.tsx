import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@/theme';
import { AuthProvider } from '@/providers/AuthProvider';

import { GoogleOAuthWrapper } from '@/providers/GoogleOAuthWrapper';
import { ConvexClientProvider } from '@/providers/ConvexClientProvider';
import { SetLocale } from './SetLocale';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <ConvexClientProvider>
          <GoogleOAuthWrapper>
              <AuthProvider>
                <SetLocale locale={locale} />
                {children}
              </AuthProvider>
          </GoogleOAuthWrapper>
        </ConvexClientProvider>
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
