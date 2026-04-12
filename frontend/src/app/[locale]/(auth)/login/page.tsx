'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { AuthenticationForm } from '@/components/auth/AuthenticationForm';
import { Layout } from '@/components/common/Layout';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/projects');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-6 bg-slate-50">
        <AuthenticationForm initialType="login" />
      </div>
    </Layout>
  );
}
