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
} from '@mantine/core';
import {
  IconScale,
  IconShieldCheck,
  IconUserCheck,
  IconClipboardCheck,
  IconHome,
  IconBackpack,
  IconPhoto,
  IconMessage,
  IconStar,
  IconCopyright,
  IconTrash,
  IconAlertTriangle,
  IconShield,
  IconEdit,
  IconGavel,
  IconMail,
  IconChecks,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';

export function TermsClient() {
  const t = useTranslations('terms');

  const sections = [
    { key: 'acceptance', icon: IconChecks },
    { key: 'description', icon: IconScale },
    { key: 'eligibility', icon: IconUserCheck },
    { key: 'accounts', icon: IconShieldCheck },
    {
      key: 'use',
      icon: IconClipboardCheck,
      rules: ['rule1', 'rule2', 'rule3', 'rule4', 'rule5'],
    },
    { key: 'hosts', icon: IconHome },
    { key: 'volunteers', icon: IconBackpack },
    { key: 'content', icon: IconPhoto },
    { key: 'messaging', icon: IconMessage },
    { key: 'reviews', icon: IconStar },
    { key: 'ip', icon: IconCopyright },
    { key: 'termination', icon: IconTrash },
    { key: 'liability', icon: IconAlertTriangle },
    { key: 'indemnification', icon: IconShield },
    { key: 'modifications', icon: IconEdit },
    { key: 'governing', icon: IconGavel },
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
                    {section.rules && (
                      <List
                        spacing="xs"
                        size="sm"
                        c="dimmed"
                        mt="xs"
                        withPadding
                      >
                        {section.rules.map((rule) => (
                          <List.Item key={rule}>
                            {t(`${section.key}.${rule}`)}
                          </List.Item>
                        ))}
                      </List>
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
