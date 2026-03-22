'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Layout } from '@/components/common/Layout';
import { IconSearch, IconLeaf, IconWorld } from '@tabler/icons-react';

export function ForVolunteersClient() {
  const t = useTranslations();

  return (
    <Layout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-eco-primary text-center mb-4">
            {t('forVolunteers.title') || 'For Volunteers'}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            {t('forVolunteers.subtitle') || 'Learn new skills while contributing to sustainable projects'}
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-eco-primary/10 flex items-center justify-center">
                <IconSearch size={28} className="text-eco-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('forVolunteers.find.title') || 'Find Projects'}</h3>
              <p className="text-gray-600 text-sm">{t('forVolunteers.find.desc') || 'Browse eco-construction and permaculture projects worldwide.'}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-eco-primary/10 flex items-center justify-center">
                <IconLeaf size={28} className="text-eco-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('forVolunteers.learn.title') || 'Learn Skills'}</h3>
              <p className="text-gray-600 text-sm">{t('forVolunteers.learn.desc') || 'Gain hands-on experience in natural building and permaculture.'}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-eco-primary/10 flex items-center justify-center">
                <IconWorld size={28} className="text-eco-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t('forVolunteers.travel.title') || 'Travel & Connect'}</h3>
              <p className="text-gray-600 text-sm">{t('forVolunteers.travel.desc') || 'Meet like-minded people and experience different cultures.'}</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-eco-primary px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-eco-primaryDark transition-all"
            >
              {t('forVolunteers.cta') || 'Browse Projects'}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
