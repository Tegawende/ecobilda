'use client';

import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Paper,
  SimpleGrid,
  Stack,
  Box,
  Group,
  Badge,
} from '@mantine/core';
import { Layout } from '@/components/common/Layout';

export function AboutPageClient() {
  const t = useTranslations();

  const values = [
    { key: 'sustainability', title: t('about.values.sustainability.title'), desc: t('about.values.sustainability.desc') },
    { key: 'community', title: t('about.values.community.title'), desc: t('about.values.community.desc') },
    { key: 'collaboration', title: t('about.values.collaboration.title'), desc: t('about.values.collaboration.desc') },
    { key: 'permaculture', title: t('about.values.permaculture.title'), desc: t('about.values.permaculture.desc') },
    { key: 'naturalBuilding', title: t('about.values.naturalBuilding.title'), desc: t('about.values.naturalBuilding.desc') },
    { key: 'globalImpact', title: t('about.values.globalImpact.title'), desc: t('about.values.globalImpact.desc') },
  ];

  const steps = [
    { num: 1, title: t('about.howItWorks.step1.title'), desc: t('about.howItWorks.step1.desc') },
    { num: 2, title: t('about.howItWorks.step2.title'), desc: t('about.howItWorks.step2.desc') },
    { num: 3, title: t('about.howItWorks.step3.title'), desc: t('about.howItWorks.step3.desc') },
    { num: 4, title: t('about.howItWorks.step4.title'), desc: t('about.howItWorks.step4.desc') },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <Box className="bg-eco-primary" c="white" py={80} style={{ backgroundColor: 'var(--color-eco-primary)' }}>
        <Container size="md" ta="center">
          <Title order={1} size={48} mb="md">{t('about.hero.title')}</Title>
          <Text size="xl" opacity={0.9}>
            {t('about.hero.subtitle')}
          </Text>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container size="lg" py={64}>
        <Paper shadow="md" p="xl" radius="md" mb={48}>
          <Title order={2} mb="lg">{t('about.mission.title')}</Title>
          <Text size="lg" c="dimmed" mb="md">
            {t('about.mission.description1')}
          </Text>
          <Text size="lg" c="dimmed">
            {t('about.mission.description2')}
          </Text>
        </Paper>

        {/* Values Grid */}
        <Title order={2} ta="center" mb="xl">{t('about.values.title')}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb={48}>
          {values.map((value) => (
            <Paper key={value.key} shadow="sm" p="lg" radius="md" withBorder ta="center">
              <Title order={4} mb="xs">{value.title}</Title>
              <Text c="dimmed" size="sm">{value.desc}</Text>
            </Paper>
          ))}
        </SimpleGrid>

        {/* How It Works */}
        <Paper shadow="md" p="xl" radius="md">
          <Title order={2} mb="xl">{t('about.howItWorks.title')}</Title>
          <Stack gap="xl">
            {steps.map((step) => (
              <Group key={step.num} align="flex-start" gap="lg">
                <Badge size="xl" circle className="bg-eco-terracotta" variant="filled" style={{ backgroundColor: 'var(--color-eco-terracotta)' }}>{step.num}</Badge>
                <Box>
                  <Title order={4} mb="xs">{step.title}</Title>
                  <Text c="dimmed">{step.desc}</Text>
                </Box>
              </Group>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Layout>
  );
}
