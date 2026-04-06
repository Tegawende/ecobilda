import { VerifyEmailClient } from './VerifyEmailClient';

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <VerifyEmailClient token={token} />;
}
