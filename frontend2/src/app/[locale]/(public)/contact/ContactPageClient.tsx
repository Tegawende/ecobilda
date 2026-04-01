'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Paper,
  TextInput,
  Textarea,
  Button,
  Alert,
  Stack,
  Box,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';

export function ContactPageClient() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual email sending via backend
    setTimeout(() => {
      setSubmitSuccess(true);
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });

      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Layout>
      <Box bg="gray.0" mih="100vh" py={48}>
        <Container size="md">
          {/* Header */}
          <Stack align="center" mb={48}>
            <Title order={1}>{t('contact.title')}</Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              {t('contact.subtitle')}
            </Text>
          </Stack>

          {/* Contact Form */}
          <Paper shadow="md" p="xl" radius="md" withBorder>
            <Title order={2} mb="xl">{t('contact.formTitle')}</Title>

            {submitSuccess && (
              <Alert icon={<IconCheck size={18} />} color="green" mb="xl">
                {t('contact.successMessage')}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label={t('contact.form.name')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('contact.form.namePlaceholder')}
                  required
                />

                <TextInput
                  label={t('contact.form.email')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('contact.form.emailPlaceholder')}
                  required
                />

                <TextInput
                  label={t('contact.form.subject')}
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('contact.form.subjectPlaceholder')}
                  required
                />

                <Textarea
                  label={t('contact.form.message')}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('contact.form.messagePlaceholder')}
                  minRows={4}
                  required
                />

                <Button
                  type="submit"
                  size="md"
                  loading={isSubmitting}
                  mt="md"
                  className="bg-eco-primary hover:bg-eco-primaryDark"
                >
                  {t('contact.form.submit')}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    </Layout>
  );
}
