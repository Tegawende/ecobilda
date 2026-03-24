import { AuthenticationForm } from '@/components/auth/AuthenticationForm';
import { Layout } from '@/components/common/Layout';

export default function RegisterPage() {
  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-6">
        <AuthenticationForm initialType="register" />
      </div>
    </Layout>
  );
}
