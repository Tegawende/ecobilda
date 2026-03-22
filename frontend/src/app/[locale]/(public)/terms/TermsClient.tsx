'use client';

import { useTranslations } from 'next-intl';
import { Layout } from '@/components/common/Layout';

export function TermsClient() {
  const t = useTranslations();

  return (
    <Layout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 prose prose-gray">
          <h1 className="text-4xl font-display font-bold text-eco-primary mb-8">
            {t('terms.title') || 'Terms of Service'}
          </h1>
          <p className="text-gray-600">
            {t('terms.intro') || 'By using Ecobilda, you agree to the following terms and conditions.'}
          </p>
          <h2>{t('terms.use.title') || 'Acceptable Use'}</h2>
          <p>{t('terms.use.desc') || 'You agree to use Ecobilda only for lawful purposes related to eco-construction and permaculture volunteering.'}</p>
          <h2>{t('terms.accounts.title') || 'User Accounts'}</h2>
          <p>{t('terms.accounts.desc') || 'You are responsible for maintaining the security of your account and all activities under it.'}</p>
          <h2>{t('terms.liability.title') || 'Limitation of Liability'}</h2>
          <p>{t('terms.liability.desc') || 'Ecobilda is a platform connecting hosts and volunteers. We are not responsible for the conduct of users.'}</p>
        </div>
      </div>
    </Layout>
  );
}
