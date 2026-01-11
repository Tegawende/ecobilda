import { Layout } from '../components/common/Layout';
import { AuthenticationForm } from '../components/auth/AuthenticationForm';

export function RegisterPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-xl">
          <AuthenticationForm initialType="register" />
        </div>
      </div>
    </Layout>
  );
}
