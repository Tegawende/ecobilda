'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Layout } from '@/components/common/Layout';
import {
  IconPlus,
  IconUsers,
  IconStar,
  IconMessageCircle,
  IconCheck,
  IconBarbell,
  IconChalkboardTeacher,
  IconUsersGroup,
  IconHome,
  IconClock,
} from '@tabler/icons-react';

export function ForHostsClient() {
  const t = useTranslations();

  const benefits = [
    { icon: IconBarbell, title: t('forHosts.benefits.hands.title'), desc: t('forHosts.benefits.hands.desc') },
    { icon: IconChalkboardTeacher, title: t('forHosts.benefits.knowledge.title'), desc: t('forHosts.benefits.knowledge.desc') },
    { icon: IconUsersGroup, title: t('forHosts.benefits.community.title'), desc: t('forHosts.benefits.community.desc') },
    { icon: IconStar, title: t('forHosts.benefits.visibility.title'), desc: t('forHosts.benefits.visibility.desc') },
  ];

  const steps = [
    { num: 1, icon: IconPlus, title: t('forHosts.howItWorks.create.title'), desc: t('forHosts.howItWorks.create.desc') },
    { num: 2, icon: IconUsers, title: t('forHosts.howItWorks.receive.title'), desc: t('forHosts.howItWorks.receive.desc') },
    { num: 3, icon: IconMessageCircle, title: t('forHosts.howItWorks.connect.title'), desc: t('forHosts.howItWorks.connect.desc') },
    { num: 4, icon: IconStar, title: t('forHosts.howItWorks.review.title'), desc: t('forHosts.howItWorks.review.desc') },
  ];

  const included = [
    t('forHosts.included.item1'),
    t('forHosts.included.item2'),
    t('forHosts.included.item3'),
    t('forHosts.included.item4'),
    t('forHosts.included.item5'),
  ];

  return (
    <Layout>
      {/* Hero */}
      <div className="py-24 text-white" style={{ backgroundColor: 'var(--color-eco-primary)' }}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-80">{t('forHosts.eyebrow')}</p>
          <h1 className="text-5xl font-bold mb-6">{t('forHosts.title')}</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">{t('forHosts.subtitle')}</p>
          <Link
            href="/create-project"
            className="inline-flex items-center gap-2 mt-10 rounded-full bg-white px-8 py-4 text-base font-bold shadow-lg transition-all hover:shadow-xl"
            style={{ color: 'var(--color-eco-primary)' }}
          >
            <IconPlus size={20} />
            {t('forHosts.cta')}
          </Link>
        </div>
      </div>

      {/* What you get */}
      <div className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('forHosts.benefits.title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('forHosts.benefits.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(112,167,113,0.12)' }}>
                  <Icon size={26} style={{ color: 'var(--color-eco-primary)' }} />
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('forHosts.howItWorks.title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('forHosts.howItWorks.subtitle')}</p>
          </div>
          <div className="space-y-8">
            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="flex gap-6 items-start bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--color-eco-primary)' }}>
                  {num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={18} style={{ color: 'var(--color-eco-primary)' }} />
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('forHosts.included.title')}</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">{t('forHosts.included.desc')}</p>
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(112,167,113,0.15)' }}>
                      <IconCheck size={12} style={{ color: 'var(--color-eco-primary)' }} />
                    </div>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <IconClock size={20} style={{ color: 'var(--color-eco-blue)' }} />
                  <span className="font-semibold text-gray-900">{t('forHosts.expectations.hours.title')}</span>
                </div>
                <p className="text-gray-500 text-sm">{t('forHosts.expectations.hours.desc')}</p>
              </div>
              <div className="rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <IconHome size={20} style={{ color: 'var(--color-eco-blue)' }} />
                  <span className="font-semibold text-gray-900">{t('forHosts.expectations.accommodation.title')}</span>
                </div>
                <p className="text-gray-500 text-sm">{t('forHosts.expectations.accommodation.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 text-white" style={{ backgroundColor: 'var(--color-eco-blue)' }}>
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('forHosts.finalCta.title')}</h2>
          <p className="opacity-90 mb-8 leading-relaxed">{t('forHosts.finalCta.desc')}</p>
          <Link
            href="/create-project"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold shadow-lg hover:shadow-xl transition-all"
            style={{ color: 'var(--color-eco-blue)' }}
          >
            <IconPlus size={20} />
            {t('forHosts.cta')}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
