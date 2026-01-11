import { Layout } from '../components/common/Layout';
import { AuthenticationForm } from '../components/auth/AuthenticationForm';

export function LoginPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-md">
          {/* Optional: Add a subtle logo or header here if needed, 
              but AuthenticationForm has its own header usually */}
          <AuthenticationForm initialType="login" />
        </div>
      </div>
    </Layout>
  );
}
