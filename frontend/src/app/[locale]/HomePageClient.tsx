'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Container, ThemeIcon, Accordion, SimpleGrid, Stack, Title, Text, Group, Paper } from '@mantine/core';
import {
  IconPlant,
  IconHammer,
  IconHeartHandshake,
  IconSearch,
  IconSend,
  IconSchool,
  IconUserPlus,
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
      router.replace('/projects');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render landing page content for authenticated users
  if (isLoading || isAuthenticated) {
    return null;
  }

  const faqItems = [
    { q: t('home.faq.q1'), a: t('home.faq.a1') },
    { q: t('home.faq.q2'), a: t('home.faq.a2') },
    { q: t('home.faq.q3'), a: t('home.faq.a3') },
    { q: t('home.faq.q4'), a: t('home.faq.a4') },
    { q: t('home.faq.q5'), a: t('home.faq.a5') },
  ];

  return (
    <Layout>
      {/* Hero Section - Full-bleed design, stays Tailwind */}
      <div className="relative isolate h-screen w-full overflow-hidden">
        <img
          src="/images/home_cover.jpeg"
          alt={t('home.heroAlt')}
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/30 to-black/20 sm:from-black/75 sm:via-black/20 sm:to-transparent" />

        <div className="relative h-full flex flex-col justify-center items-start text-left px-4 sm:px-8 lg:px-12 pb-32 sm:pb-40 w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white drop-shadow-2xl max-w-xl lg:max-w-2xl leading-[1.1]">
            {t('home.hero.title')}
          </h1>
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-white font-medium max-w-md lg:max-w-xl drop-shadow-lg opacity-90">
            {t('home.hero.subtitle')}
          </p>
          <div className="mt-10 flex items-center gap-x-6">
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
        <Container size="lg">
          <Stack align="center" gap="xs" mb="xl">
            <Title order={2} ta="center" className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
              {t('home.about.title')}
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={720}>
              {t('home.about.intro')}
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mt="xl">
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
              <Paper
                key={i}
                radius="lg"
                p="lg"
                bg="var(--mantine-color-gray-0)"
                className="hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
              >
                <Stack align="center" ta="center" gap="sm">
                  <ThemeIcon
                    size={72}
                    radius="xl"
                    color="eco-primary"
                    variant="light"
                  >
                    {item.icon}
                  </ThemeIcon>
                  <Title order={4} className="font-display">
                    {item.title}
                  </Title>
                  <Text size="sm" c="dimmed" lh={1.6}>
                    {item.content}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Container>
      </div>

      {/* How It Works Section */}
      <div className="bg-stone-50 py-16 sm:py-20 border-t border-stone-100">
        <Container size="lg">
          <Stack align="center" gap="xs" mb="xl">
            <Title order={2} ta="center" className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
              {t('home.howItWorks.title')}
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              {t('home.howItWorks.subtitle')}
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
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
              <Stack key={item.step} align="center" ta="center" gap="xs" className="hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 cursor-default">
                <div className="relative mb-1">
                  <ThemeIcon
                    size={64}
                    radius="xl"
                    color="eco-primary"
                    variant="filled"
                  >
                    {item.icon}
                  </ThemeIcon>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow" style={{ backgroundColor: 'var(--color-eco-blue)' }}>
                    {item.step}
                  </span>
                </div>
                <Title order={4} className="font-display">
                  {item.title}
                </Title>
                <Text size="sm" c="dimmed" lh={1.6} maw={320}>
                  {item.desc}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </div>

      {/* For Hosts Section */}
      <div className="bg-eco-primary/5 py-16 sm:py-20">
        <Container size="lg">
          <Group align="center" gap="xl" wrap="wrap" justify="center">
            <Stack gap="md" maw={560} className="text-center lg:text-left">
              <Title order={2} className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
                {t('home.forHosts.title')}
              </Title>
              <Text size="lg" c="dimmed" lh={1.7}>
                {t('home.forHosts.desc')}
              </Text>
              <Group mt="sm">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold text-white shadow-md transform hover:-translate-y-0.5 transition-all duration-300"
                  style={{ backgroundColor: 'var(--color-eco-blue)' }}
                >
                  <IconUserPlus size={20} />
                  {t('home.forHosts.cta')}
                </Link>
              </Group>
            </Stack>

            <Paper radius="lg" p="lg" shadow="sm" maw={400} w="100%" className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <Stack gap="md">
                {[
                  t('home.forHosts.benefit1'),
                  t('home.forHosts.benefit2'),
                  t('home.forHosts.benefit3'),
                ].map((benefit, i) => (
                  <Group key={i} align="flex-start" gap="sm" wrap="nowrap">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eco-primary/10 text-eco-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <Text size="sm" c="dimmed" lh={1.6}>{benefit}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Group>
        </Container>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 sm:py-20 border-t border-stone-100">
        <Container size="sm">
          <Stack align="center" gap="xs" mb="xl">
            <Title order={2} ta="center" className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-eco-primary">
              {t('home.faq.title')}
            </Title>
          </Stack>

          <Accordion
            variant="separated"
            radius="lg"
          >
            {faqItems.map((item, i) => (
              <Accordion.Item key={i} value={`faq-${i}`}>
                <Accordion.Control>{item.q}</Accordion.Control>
                <Accordion.Panel>{item.a}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </div>

      {/* CTA Section */}
      <div className="bg-eco-primary py-16 sm:py-20">
        <Container size="sm">
          <Stack align="center" ta="center" gap="md">
            <Title order={2} c="white" className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              {t('home.cta.title')}
            </Title>
            <Text size="lg" c="white" opacity={0.8}>
              {t('home.cta.subtitle')}
            </Text>
            <Group mt="md">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-eco-primary shadow-lg hover:bg-eco-cream transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <IconUserPlus size={20} />
                {t('home.cta.button')}
              </Link>
            </Group>
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
