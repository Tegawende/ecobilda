'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Layout } from '@/components/common/Layout';
import { IconPlus, IconUsers, IconShield } from '@tabler/icons-react';

export function ForHostsClient() {
  const t = useTranslations();

  return (
    <Layout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-eco-primary text-center mb-4">
            {t('forHosts.title') || 'For Hosts'}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            {t('forHosts.subtitle') || 'Share your project and find motivated volunteers'}
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-eco-primary/10 flex items-center justify-center">
                <IconPlus size={28} className="text-eco-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('forHosts.create.title') || 'Create Your Project'}</h3>
              <p className="text-gray-600 text-sm">{t('forHosts.create.desc') || 'Describe your project, skills needed, and accommodation details.'}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-eco-primary/10 flex items-center justify-center">
                <IconUsers size={28} className="text-eco-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('forHosts.receive.title') || 'Receive Applications'}</h3>
              <p className="text-gray-600 text-sm">{t('forHosts.receive.desc') || 'Review volunteer profiles and their motivations.'}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-eco-primary/10 flex items-center justify-center">
                <IconShield size={28} className="text-eco-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('forHosts.trust.title') || 'Build Trust'}</h3>
              <p className="text-gray-600 text-sm">{t('forHosts.trust.desc') || 'Review system ensures quality interactions.'}</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/create-project"
              className="inline-flex items-center gap-2 rounded-full bg-eco-primary px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-eco-primaryDark transition-all"
            >
              <IconPlus size={20} />
              {t('forHosts.cta') || 'Create a Project'}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
