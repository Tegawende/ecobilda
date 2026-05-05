'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Container, Stack, Title, Center, Loader, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { PlaceForm, type PlaceFormValues } from '@/components/places/PlaceForm';
import { projectsService } from '@/services/projects';
import type { Project } from '@/types';

interface EditProjectClientProps {
  id: string;
}

export function EditProjectClient({ id }: EditProjectClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [place, setPlace] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    projectsService
      .getProject(id)
      .then((p) => mounted && setPlace(p))
      .catch(() => mounted && setPlace(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async (values: PlaceFormValues) => {
    try {
      await projectsService.updateProject(id, {
        title: values.title,
        accommodationDetails: values.accommodationDetails || undefined,
        foodDetails: values.foodDetails || undefined,
        internetProvided: values.internetProvided,
        familyFriendly: values.familyFriendly,
        petsAllowed: values.petsAllowed,
        smokingAllowed: values.smokingAllowed,
        languageCodes: values.languages,
      });
      notifications.show({
        title: t('createPlace.editSuccessTitle'),
        message: t('createPlace.editSuccessMessage'),
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

  if (loading) {
    return (
      <Layout>
        <Center h={400}>
          <Loader />
        </Center>
      </Layout>
    );
  }

  if (!place) {
    return (
      <Layout>
        <Container size="sm" py="xl">
          <Text>{t('createPlace.notFound')}</Text>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container size="md" py="md">
        <Stack gap="md">
          <Title order={2}>{t('createPlace.editTitle')}</Title>
          <PlaceForm
            initialValues={{
              title: place.title,
              accommodationDetails: place.accommodationDetails ?? '',
              foodDetails: place.foodDetails ?? '',
              internetProvided: place.internetProvided,
              familyFriendly: place.familyFriendly,
              petsAllowed: place.petsAllowed,
              smokingAllowed: place.smokingAllowed,
              languages: place.languages?.map((l) => l.code) ?? [],
              address: {
                city: place.address?.city ?? '',
                postalCode: place.address?.postalCode ?? '',
                countryCode: place.address?.country?.code ?? '',
                latitude: place.address?.latitude ?? 0,
                longitude: place.address?.longitude ?? 0,
                formattedAddress: place.address?.formattedAddress ?? '',
              },
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/my-missions')}
            submitLabel={t('common.save')}
          />
        </Stack>
      </Container>
    </Layout>
  );
}
