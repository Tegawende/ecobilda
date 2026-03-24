'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { ThemeIcon, Accordion } from '@mantine/core';
import {
  IconPlant,
  IconHammer,
  IconHeartHandshake,
  IconSearch,
  IconSend,
  IconSchool,
  IconHome,
  IconUserPlus,
  IconQuestionMark,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { useAuth } from '@/providers/AuthProvider';

export function HomePageClient() {
  const t = useTranslations();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to projects page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/projects');
    }
  }, [isAuthenticated, isLoading, router]);

  const faqItems = [
    { q: t('home.faq.q1'), a: t('home.faq.a1') },
    { q: t('home.faq.q2'), a: t('home.faq.a2') },
    { q: t('home.faq.q3'), a: t('home.faq.a3') },
    { q: t('home.faq.q4'), a: t('home.faq.a4') },
    { q: t('home.faq.q5'), a: t('home.faq.a5') },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative isolate h-screen w-full overflow-hidden">
        <img
          src="/images/home_cover.jpeg"
          alt="Eco-construction site"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-black/40" />

        <div className="relative h-full flex flex-col justify-center items-center text-center px-6 lg:px-8 pt-10">
          <h1 className="text-5xl sm:text-[66px] font-display font-bold text-white drop-shadow-2xl max-w-6xl leading-[1.1]">
            {t('home.hero.title')}
          </h1>
          <p className="mt-8 text-lg sm:text-2xl text-white font-medium max-w-3xl drop-shadow-lg opacity-90">
            {t('home.hero.subtitle')}
          </p>
          <div className="mt-12 flex items-center justify-center gap-x-6">
            <Link
              href="/projects"
              className="rounded-full bg-[#67a36f] px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-[#5a8f61] transform hover:-translate-y-1 transition-all duration-300"
            >
              {t('home.hero.browseProjects')}
            </Link>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
              {t('home.about.title')}
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              {t('home.about.intro')}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: <IconHammer size={36} stroke={1.5} />,
                title: t('home.naturalBuilding.title'),
                content: t('home.naturalBuilding.content'),
              },
              {
                icon: <IconPlant size={36} stroke={1.5} />,
                title: t('home.permaculture.title'),
                content: t('home.permaculture.content'),
              },
              {
                icon: <IconHeartHandshake size={36} stroke={1.5} />,
                title: t('home.community.title'),
                content: t('home.community.content'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center rounded-2xl bg-stone-50 p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <ThemeIcon
                  size={72}
                  radius="xl"
                  color="eco-primary"
                  variant="light"
                  className="mb-5"
                >
                  {item.icon}
                </ThemeIcon>
                <h3 className="text-lg font-bold text-gray-900 font-display">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-stone-50 py-16 sm:py-20 border-t border-stone-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
              {t('home.howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                icon: <IconSearch size={32} stroke={1.5} />,
                title: t('home.howItWorks.step1.title'),
                desc: t('home.howItWorks.step1.desc'),
              },
              {
                step: 2,
                icon: <IconSend size={32} stroke={1.5} />,
                title: t('home.howItWorks.step2.title'),
                desc: t('home.howItWorks.step2.desc'),
              },
              {
                step: 3,
                icon: <IconSchool size={32} stroke={1.5} />,
                title: t('home.howItWorks.step3.title'),
                desc: t('home.howItWorks.step3.desc'),
              },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <ThemeIcon
                    size={64}
                    radius="xl"
                    color="eco-primary"
                    variant="filled"
                  >
                    {item.icon}
                  </ThemeIcon>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-eco-terracotta text-xs font-bold text-white shadow">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-display">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 max-w-xs">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Hosts Section */}
      <div className="bg-eco-primary/5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-left">
              <ThemeIcon
                size={56}
                radius="xl"
                color="eco-terracotta"
                variant="filled"
                className="mb-4 mx-auto lg:mx-0"
              >
                <IconHome size={28} stroke={1.5} />
              </ThemeIcon>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
                {t('home.forHosts.title')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600 max-w-xl">
                {t('home.forHosts.desc')}
              </p>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-eco-terracotta px-7 py-3.5 text-base font-bold text-white shadow-md hover:bg-eco-terracotta/90 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <IconUserPlus size={20} />
                  {t('home.forHosts.cta')}
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="rounded-2xl bg-white p-6 shadow-md space-y-4">
                {[
                  t('home.forHosts.benefit1'),
                  t('home.forHosts.benefit2'),
                  t('home.forHosts.benefit3'),
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eco-primary/10 text-eco-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 sm:py-20 border-t border-stone-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <ThemeIcon
              size={56}
              radius="xl"
              color="eco-primary"
              variant="light"
              className="mx-auto mb-4"
            >
              <IconQuestionMark size={28} stroke={1.5} />
            </ThemeIcon>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
              {t('home.faq.title')}
            </h2>
          </div>

          <Accordion
            variant="separated"
            radius="lg"
            styles={{
              item: {
                border: '1px solid var(--mantine-color-gray-2)',
                backgroundColor: 'var(--mantine-color-gray-0)',
              },
              control: {
                fontWeight: 600,
                fontSize: '0.95rem',
              },
              panel: {
                fontSize: '0.9rem',
                color: 'var(--mantine-color-gray-7)',
              },
            }}
          >
            {faqItems.map((item, i) => (
              <Accordion.Item key={i} value={`faq-${i}`}>
                <Accordion.Control>{item.q}</Accordion.Control>
                <Accordion.Panel>{item.a}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-eco-primary py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            {t('home.cta.title')}
          </h2>
          <p className="mt-4 text-lg text-white/80">
            {t('home.cta.subtitle')}
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-eco-primary shadow-lg hover:bg-eco-cream transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <IconUserPlus size={20} />
              {t('home.cta.button')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
