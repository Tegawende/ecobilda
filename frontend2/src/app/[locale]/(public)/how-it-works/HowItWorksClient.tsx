'use client';

import { useTranslations } from 'next-intl';
import { Layout } from '@/components/common/Layout';
import { IconSearch, IconSend, IconMessageCircle, IconStar } from '@tabler/icons-react';

export function HowItWorksClient() {
  const t = useTranslations();

  const steps = [
    { icon: IconSearch, title: t('howItWorks.step1.title') || 'Browse Projects', desc: t('howItWorks.step1.desc') || 'Search for eco-construction and permaculture projects that match your interests and availability.' },
    { icon: IconSend, title: t('howItWorks.step2.title') || 'Apply to Participate', desc: t('howItWorks.step2.desc') || 'Send a participation request with your motivation. The host will review your profile.' },
    { icon: IconMessageCircle, title: t('howItWorks.step3.title') || 'Connect & Chat', desc: t('howItWorks.step3.desc') || 'Once accepted, you can chat directly with the host to plan your stay.' },
    { icon: IconStar, title: t('howItWorks.step4.title') || 'Learn & Review', desc: t('howItWorks.step4.desc') || 'Gain hands-on experience and leave a review to help the community.' },
  ];

  return (
    <Layout>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-eco-primary text-center mb-4">
            {t('howItWorks.title') || 'How It Works'}
          </h1>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            {t('howItWorks.subtitle') || 'Join our community in 4 simple steps'}
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
