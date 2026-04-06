'use client';

import { useTranslations } from 'next-intl';
import { Layout } from '@/components/common/Layout';
import { IconSearch, IconSend, IconMessageCircle, IconStar } from '@tabler/icons-react';

export function HowItWorksClient() {
  const t = useTranslations();

  const steps = [
    { icon: IconSearch, title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.desc') },
    { icon: IconSend, title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.desc') },
    { icon: IconMessageCircle, title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.desc') },
    { icon: IconStar, title: t('howItWorks.step4.title'), desc: t('howItWorks.step4.desc') },
  ];

  return (
    <Layout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-eco-primary text-center mb-4">
            {t('howItWorks.title')}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>

          <div className="space-y-12">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-2xl bg-eco-primary/10 flex items-center justify-center flex-shrink-0">
                  <step.icon size={28} className="text-eco-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
