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
  Divider,
  ThemeIcon,
} from '@mantine/core';
import {
  IconLeaf,
  IconUsers,
  IconUsersGroup,
  IconTree,
  IconHome,
  IconWorld,
  IconSeedling,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';

export function AboutPageClient() {
  const t = useTranslations();

  const values = [
    { key: 'sustainability', title: t('about.values.sustainability.title'), desc: t('about.values.sustainability.desc'), Icon: IconLeaf },
    { key: 'community', title: t('about.values.community.title'), desc: t('about.values.community.desc'), Icon: IconUsers },
    { key: 'collaboration', title: t('about.values.collaboration.title'), desc: t('about.values.collaboration.desc'), Icon: IconUsersGroup },
    { key: 'permaculture', title: t('about.values.permaculture.title'), desc: t('about.values.permaculture.desc'), Icon: IconTree },
    { key: 'naturalBuilding', title: t('about.values.naturalBuilding.title'), desc: t('about.values.naturalBuilding.desc'), Icon: IconHome },
    { key: 'globalImpact', title: t('about.values.globalImpact.title'), desc: t('about.values.globalImpact.desc'), Icon: IconWorld },
  ];

  return (
    <Layout>
      {/* Hero */}
      <Box py={96} style={{ backgroundColor: 'var(--color-eco-primary)' }} c="white">
        <Container size="md" ta="center">
          <Title order={1} size={52} mb="lg" fw={700}>
            {t('about.hero.title')}
          </Title>
          <Text size="xl" opacity={0.9} maw={600} mx="auto">
            {t('about.hero.subtitle')}
          </Text>
        </Container>
      </Box>

      <Container size="lg" py={72}>
        {/* Story */}
        <Stack gap="xl" maw={780} mx="auto" mb={80}>
          <Title order={2} size={36} ta="center">{t('about.story.title')}</Title>
          <Text size="lg" c="dimmed" lh={1.9} ta="center">
            {t('about.story.p1')}
          </Text>
          <Text size="lg" c="dimmed" lh={1.9} ta="center">
            {t('about.story.p2')}
          </Text>
          <div className="flex items-center justify-center gap-3">
            <Text size="lg" c="dimmed" lh={1.9} ta="center">
              {t('about.story.p3')}
            </Text>
            <IconSeedling size={22} style={{ color: 'var(--color-eco-primary)', flexShrink: 0 }} />
          </div>
        </Stack>

        <Divider mb={80} />

        {/* Mission */}
        <Box ta="center" mb={72}>
          <Title order={2} size={36} mb="lg">{t('about.mission.title')}</Title>
          <Text size="lg" c="dimmed" maw={720} mx="auto" lh={1.8}>
            {t('about.mission.description1')}
          </Text>
        </Box>

        {/* Values */}
        <Title order={2} ta="center" mb="xl">{t('about.values.title')}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb={80}>
          {values.map(({ key, title, desc, Icon }) => (
            <Paper key={key} shadow="sm" p="lg" radius="md" withBorder>
              <ThemeIcon
                size={44}
                radius="md"
                mb="md"
                style={{ backgroundColor: 'var(--color-eco-blue)', color: 'white' }}
              >
                <Icon size={22} />
              </ThemeIcon>
              <Title order={4} mb="xs">{title}</Title>
              <Text c="dimmed" size="sm" lh={1.6}>{desc}</Text>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Impact CTA */}
        <Paper p={48} radius="xl" ta="center" style={{ backgroundColor: 'var(--color-eco-blue)', color: 'white' }}>
          <Title order={2} mb="md" c="white">{t('about.impact.title')}</Title>
          <Text size="lg" opacity={0.9} maw={600} mx="auto" lh={1.8}>
            {t('about.impact.description')}
          </Text>
        </Paper>
      </Container>
    </Layout>
  );
}
