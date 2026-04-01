'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  TextInput,
  Accordion,
  Paper,
  Button,
  Stack,
  Box,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';

const FAQ = () => {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');

  // FAQ data from translations
  const faqCategories = useMemo(() => [
    {
      title: t('faq.categories.gettingStarted.title'),
      questions: [
        {
          q: t('faq.categories.gettingStarted.q1'),
          a: t('faq.categories.gettingStarted.a1')
        },
        {
          q: t('faq.categories.gettingStarted.q2'),
          a: t('faq.categories.gettingStarted.a2')
        },
        {
          q: t('faq.categories.gettingStarted.q3'),
          a: t('faq.categories.gettingStarted.a3')
        }
      ]
    },
    {
      title: t('faq.categories.forVolunteers.title'),
      questions: [
        {
          q: t('faq.categories.forVolunteers.q1'),
          a: t('faq.categories.forVolunteers.a1')
        },
        {
          q: t('faq.categories.forVolunteers.q2'),
          a: t('faq.categories.forVolunteers.a2')
        },
        {
          q: t('faq.categories.forVolunteers.q3'),
          a: t('faq.categories.forVolunteers.a3')
        }
      ]
    },
    {
      title: t('faq.categories.forHosts.title'),
      questions: [
        {
          q: t('faq.categories.forHosts.q1'),
          a: t('faq.categories.forHosts.a1')
        },
        {
          q: t('faq.categories.forHosts.q2'),
          a: t('faq.categories.forHosts.a2')
        },
        {
          q: t('faq.categories.forHosts.q3'),
          a: t('faq.categories.forHosts.a3')
        }
      ]
    }
  ], [t]);

  // Filter questions based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(item =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Layout>
      {/* Hero Section */}
      <Box className="bg-eco-primary" c="white" py={80} style={{ backgroundColor: 'var(--color-eco-primary)' }}>
        <Container size="md" ta="center">
          <Title order={1} size={48} mb="md">{t('faq.title')}</Title>
          <Text size="xl" opacity={0.9} mb="xl">
            {t('faq.subtitle')}
          </Text>

          {/* Search Bar */}
          <TextInput
            placeholder={t('faq.searchPlaceholder')}
            size="lg"
            leftSection={<IconSearch size={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            maw={600}
            mx="auto"
            styles={{
              input: { backgroundColor: 'white', color: 'black' }
            }}
          />
        </Container>
      </Box>

      {/* FAQ Content */}
      <Container size="md" py={64}>
        {filteredCategories.length > 0 ? (
          <Stack gap={48}>
            {filteredCategories.map((category, categoryIndex) => (
              <Box key={categoryIndex}>
                <Title order={2} mb="lg">{category.title}</Title>
                <Accordion
                  variant="separated"
                  styles={{
                    control: { '&[data-active]': { color: 'var(--color-eco-terracotta)' } },
                    chevron: { '&[data-active]': { color: 'var(--color-eco-terracotta)' } }
                  }}
                >
                  {category.questions.map((item, qIndex) => (
                    <Accordion.Item key={qIndex} value={`${categoryIndex}-${qIndex}`}>
                      <Accordion.Control>
                        <Text fw={500}>{item.q}</Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text c="dimmed">{item.a}</Text>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Box>
            ))}
          </Stack>
        ) : (
          <Text size="lg" c="dimmed" ta="center" py={48}>
            {t('faq.noResults', { term: searchTerm })}
          </Text>
        )}

        {/* Contact CTA */}
        <Paper className="bg-eco-terracotta" c="white" p="xl" radius="md" mt={64} ta="center" style={{ backgroundColor: 'var(--color-eco-terracotta)' }}>
          <Title order={3} mb="xs">{t('faq.stillHaveQuestions')}</Title>
          <Text opacity={0.9} mb="lg">
            {t('faq.cantFindAnswer')}
          </Text>
          <Button variant="white" className="text-eco-terracotta hover:bg-gray-100" style={{ color: 'var(--color-eco-terracotta)' }}>
            {t('faq.contactSupport')}
          </Button>
        </Paper>
      </Container>
    </Layout>
  );
};

export default FAQ;
