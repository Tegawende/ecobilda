'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Container, Stack, Title, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { PlaceForm, type PlaceFormValues } from '@/components/places/PlaceForm';
import { projectsService } from '@/services/projects';

export function CreateProjectClient() {
  const t = useTranslations();
  const router = useRouter();

  const handleSubmit = async (values: PlaceFormValues) => {
    try {
      await projectsService.createProject({
        title: values.title,
        accommodationDetails: values.accommodationDetails || undefined,
        foodDetails: values.foodDetails || undefined,
        internetProvided: values.internetProvided,
        familyFriendly: values.familyFriendly,
        petsAllowed: values.petsAllowed,
        smokingAllowed: values.smokingAllowed,
        languageCodes: values.languages,
        address: {
          city: values.address.city,
          postalCode: values.address.postalCode,
          countryCode: values.address.countryCode,
          latitude: values.address.latitude,
          longitude: values.address.longitude,
          formattedAddress: values.address.formattedAddress,
        },
      });
      notifications.show({
        title: t('createPlace.successTitle'),
        message: t('createPlace.successMessage'),
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      router.push('/my-missions');
    } catch (e: any) {
      notifications.show({
        title: t('common.error'),
        message: e?.message ?? '',
        color: 'red',
      });
    }
  };

  return (
    <Layout>
      <Container size="md" py="md">
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={2}>{t('createPlace.title')}</Title>
            <Text c="dimmed">{t('createPlace.subtitle')}</Text>
          </Stack>
          <PlaceForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/my-missions')}
            submitLabel={t('createPlace.submit')}
          />
        </Stack>
      </Container>
    </Layout>
  );
}
