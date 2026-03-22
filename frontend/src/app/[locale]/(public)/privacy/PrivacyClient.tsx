'use client';

import { useTranslations } from 'next-intl';
import { Layout } from '@/components/common/Layout';

export function PrivacyClient() {
  const t = useTranslations();

  return (
    <Layout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 prose prose-gray">
          <h1 className="text-4xl font-display font-bold text-eco-primary mb-8">
            {t('privacy.title') || 'Privacy Policy'}
          </h1>
          <p className="text-gray-600">
            {t('privacy.intro') || 'This privacy policy explains how Ecobilda collects, uses, and protects your personal data.'}
          </p>
          <h2>{t('privacy.dataCollection.title') || 'Data Collection'}</h2>
          <p>{t('privacy.dataCollection.desc') || 'We collect information you provide when creating an account, such as your name, email, and profile details.'}</p>
          <h2>{t('privacy.dataUse.title') || 'How We Use Your Data'}</h2>
          <p>{t('privacy.dataUse.desc') || 'Your data is used to provide our services, match volunteers with projects, and improve user experience.'}</p>
          <h2>{t('privacy.dataProtection.title') || 'Data Protection'}</h2>
          <p>{t('privacy.dataProtection.desc') || 'We implement appropriate security measures to protect your personal information.'}</p>
        </div>
      </div>
    </Layout>
  );
}
