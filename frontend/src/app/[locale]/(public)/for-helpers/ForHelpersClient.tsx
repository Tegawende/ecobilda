'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Layout } from '@/components/common/Layout';
import {
  IconSearch,
  IconSend,
  IconStar,
  IconCheck,
  IconBrain,
  IconCompass,
  IconUsersGroup,
  IconSeedling,
  IconHome,
  IconClock,
} from '@tabler/icons-react';

export function ForHelpersClient() {
  const t = useTranslations();

  const benefits = [
    { icon: IconBrain, title: t('forHelpers.benefits.skills.title'), desc: t('forHelpers.benefits.skills.desc') },
    { icon: IconCompass, title: t('forHelpers.benefits.travel.title'), desc: t('forHelpers.benefits.travel.desc') },
    { icon: IconUsersGroup, title: t('forHelpers.benefits.network.title'), desc: t('forHelpers.benefits.network.desc') },
    { icon: IconSeedling, title: t('forHelpers.benefits.impact.title'), desc: t('forHelpers.benefits.impact.desc') },
  ];

  const steps = [
    { num: 1, icon: IconUsersGroup, title: t('forHelpers.howItWorks.profile.title'), desc: t('forHelpers.howItWorks.profile.desc') },
    { num: 2, icon: IconSearch, title: t('forHelpers.howItWorks.browse.title'), desc: t('forHelpers.howItWorks.browse.desc') },
    { num: 3, icon: IconSend, title: t('forHelpers.howItWorks.apply.title'), desc: t('forHelpers.howItWorks.apply.desc') },
    { num: 4, icon: IconStar, title: t('forHelpers.howItWorks.participate.title'), desc: t('forHelpers.howItWorks.participate.desc') },
  ];

  const included = [
    t('forHelpers.included.item1'),
    t('forHelpers.included.item2'),
    t('forHelpers.included.item3'),
    t('forHelpers.included.item4'),
    t('forHelpers.included.item5'),
  ];

  return (
    <Layout>
      {/* Hero */}
      <div className="py-24 text-white" style={{ backgroundColor: 'var(--color-eco-blue)' }}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-80">{t('forHelpers.eyebrow')}</p>
          <h1 className="text-5xl font-bold mb-6">{t('forHelpers.title')}</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">{t('forHelpers.subtitle')}</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 mt-10 rounded-full bg-white px-8 py-4 text-base font-bold shadow-lg transition-all hover:shadow-xl"
            style={{ color: 'var(--color-eco-blue)' }}
          >
            <IconSearch size={20} />
            {t('forHelpers.cta')}
          </Link>
        </div>
      </div>

      {/* What you get */}
      <div className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('forHelpers.benefits.title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('forHelpers.benefits.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(103,125,163,0.12)' }}>
                  <Icon size={26} style={{ color: 'var(--color-eco-blue)' }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-20" style={{ backgroundColor: 'var(--color-eco-cream)' }}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('forHelpers.howItWorks.title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('forHelpers.howItWorks.subtitle')}</p>
          </div>
          <div className="space-y-8">
            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="flex gap-6 items-start bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--color-eco-blue)' }}>
                  {num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={18} style={{ color: 'var(--color-eco-blue)' }} />
                    <h3 className="font-bold text-gray-900">{title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('forHelpers.included.title')}</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">{t('forHelpers.included.desc')}</p>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(103,125,163,0.15)' }}>
                      <IconCheck size={12} style={{ color: 'var(--color-eco-blue)' }} />
                    </div>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <IconClock size={20} style={{ color: 'var(--color-eco-primary)' }} />
                  <span className="font-semibold text-gray-900">{t('forHelpers.expectations.hours.title')}</span>
                </div>
                <p className="text-gray-500 text-sm">{t('forHelpers.expectations.hours.desc')}</p>
              </div>
              <div className="rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <IconHome size={20} style={{ color: 'var(--color-eco-primary)' }} />
                  <span className="font-semibold text-gray-900">{t('forHelpers.expectations.provided.title')}</span>
                </div>
                <p className="text-gray-500 text-sm">{t('forHelpers.expectations.provided.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-white" style={{ backgroundColor: 'var(--color-eco-primary)' }}>
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('forHelpers.finalCta.title')}</h2>
          <p className="opacity-90 mb-8 leading-relaxed">{t('forHelpers.finalCta.desc')}</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ color: 'var(--color-eco-primary)' }}
          >
            <IconSearch size={20} />
            {t('forHelpers.cta')}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
