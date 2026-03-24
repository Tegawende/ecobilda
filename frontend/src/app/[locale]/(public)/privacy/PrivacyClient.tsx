'use client';

import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Accordion,
  Badge,
  List,
  Stack,
  Box,
  Paper,
  Alert,
} from '@mantine/core';
import {
  IconDatabase,
  IconSettings,
  IconScale,
  IconShare,
  IconCookie,
  IconShieldLock,
  IconClock,
  IconUserCheck,
  IconFriends,
  IconWorld,
  IconEdit,
  IconMail,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';

export function PrivacyClient() {
  const t = useTranslations('privacy');

  const sections = [
    {
      key: 'dataCollection',
      icon: IconDatabase,
      subsections: ['accountData', 'projectData', 'technicalData'],
    },
    {
      key: 'dataUse',
      icon: IconSettings,
      purposes: ['purpose1', 'purpose2', 'purpose3', 'purpose4', 'purpose5', 'purpose6'],
    },
    { key: 'legalBasis', icon: IconScale },
    {
      key: 'sharing',
      icon: IconShare,
      cases: ['case1', 'case2', 'case3'],
      alert: 'noSell',
    },
    { key: 'cookies', icon: IconCookie },
    { key: 'dataProtection', icon: IconShieldLock },
    { key: 'retention', icon: IconClock },
    {
      key: 'rights',
      icon: IconUserCheck,
      items: ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'],
      footer: 'howTo',
    },
    { key: 'children', icon: IconFriends },
    { key: 'international', icon: IconWorld },
    { key: 'changes', icon: IconEdit },
    { key: 'contact', icon: IconMail },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <Box c="white" py={80} style={{ backgroundColor: 'var(--color-eco-primary)' }}>
        <Container size="md" ta="center">
          <Title order={1} size={48} mb="md" c="white">
            {t('title')}
          </Title>
          <Badge size="lg" variant="light" color="white" mb="lg">
            {t('lastUpdated')}
          </Badge>
          <Text size="lg" opacity={0.9} maw={700} mx="auto">
            {t('intro')}
          </Text>
        </Container>
      </Box>

      {/* Content */}
      <Container size="md" py={64}>
        <Accordion
          variant="separated"
          radius="lg"
          styles={{
            control: { '&[data-active]': { color: 'var(--color-eco-terracotta)' } },
            chevron: { '&[data-active]': { color: 'var(--color-eco-terracotta)' } },
          }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Accordion.Item key={section.key} value={section.key}>
                <Accordion.Control>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon size={22} stroke={1.5} style={{ color: 'var(--color-eco-primary)', flexShrink: 0 }} />
                    <Text fw={600} size="md">{t(`${section.key}.title`)}</Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Text c="dimmed" size="sm" lh={1.7}>
                      {t(`${section.key}.desc`)}
                    </Text>

                    {/* Subsections (dataCollection) */}
                    {section.subsections && (
                      <Stack gap="md" mt="xs">
                        {section.subsections.map((sub) => (
                          <Box key={sub}>
                            <Text fw={600} size="sm" mb={4}>
                              {t(`${section.key}.${sub}.title`)}
                            </Text>
                            <Text c="dimmed" size="sm" lh={1.7}>
                              {t(`${section.key}.${sub}.desc`)}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    {/* Purposes list (dataUse) */}
                    {section.purposes && (
                      <List
                        spacing="xs"
                        size="sm"
                        c="dimmed"
                        mt="xs"
                        withPadding
                      >
                        {section.purposes.map((p) => (
                          <List.Item key={p}>
                            {t(`${section.key}.${p}`)}
                          </List.Item>
                        ))}
                      </List>
                    )}

                    {/* Cases list (sharing) */}
                    {section.cases && (
                      <List
                        spacing="xs"
                        size="sm"
                        c="dimmed"
                        mt="xs"
                        withPadding
                      >
                        {section.cases.map((c) => (
                          <List.Item key={c}>
                            {t(`${section.key}.${c}`)}
                          </List.Item>
                        ))}
                      </List>
                    )}

                    {/* Alert callout (noSell) */}
                    {section.alert && (
                      <Alert
                        icon={<IconInfoCircle size={18} />}
                        color="green"
                        variant="light"
                        mt="xs"
                      >
                        <Text size="sm" fw={500}>
                          {t(`${section.key}.${section.alert}`)}
                        </Text>
                      </Alert>
                    )}

                    {/* Rights items */}
                    {section.items && (
                      <List
                        spacing="xs"
                        size="sm"
                        c="dimmed"
                        mt="xs"
                        withPadding
                      >
                        {section.items.map((item) => (
                          <List.Item key={item}>
                            {t(`${section.key}.${item}`)}
                          </List.Item>
                        ))}
                      </List>
                    )}

                    {/* Footer text (rights.howTo) */}
                    {section.footer && (
                      <Text c="dimmed" size="sm" lh={1.7} mt="xs">
                        {t(`${section.key}.${section.footer}`)}
                      </Text>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>

        {/* Contact CTA */}
        <Paper
          c="white"
          p="xl"
          radius="md"
          mt={48}
          ta="center"
          style={{ backgroundColor: 'var(--color-eco-terracotta)' }}
        >
          <Title order={3} mb="xs" c="white">
            {t('contact.title')}
          </Title>
          <Text opacity={0.9}>
            {t('contact.desc')}
          </Text>
        </Paper>
      </Container>
    </Layout>
  );
}
