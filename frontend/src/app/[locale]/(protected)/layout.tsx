'use client';

import { type ReactNode, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from '@/i18n/navigation';
import { Center, Loader } from '@mantine/core';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <Center mih="100vh"><Loader size="lg" /></Center>;
  }

  return <>{children}</>;
}
