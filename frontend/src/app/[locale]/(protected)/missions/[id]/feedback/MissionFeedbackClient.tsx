'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Title,
  Card,
  Group,
  Text,
  Button,
  Switch,
  NumberInput,
  Textarea,
  Select,
  FileButton,
  SimpleGrid,
  Image,
  ActionIcon,
  Center,
  Loader,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconUpload, IconX } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { useMission, useMissionFeedback } from '@/hooks/useConvex';
import { missionFeedbackService } from '@/services/missionFeedback';
import { FEEDBACK_RESULTS, feedbackResultI18nKey } from '@/types/missions';

interface Props {
  id: string;
}

const MAX_TEXT = 500;

export function MissionFeedbackClient({ id }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { mission, isLoading } = useMission(id);
  const { feedback } = useMissionFeedback(id);
  const [photoStorageIds, setPhotoStorageIds] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      totalCostEUR: null as number | null,
      surfaceM2: null as number | null,
      result: undefined as 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE' | undefined,
      difficultiesText: '',
      learningsText: '',
      isPublic: true,
    },
    validate: {
      difficultiesText: (v) =>
        v.length > MAX_TEXT ? t('missionFeedback.form.tooLong') : null,
      learningsText: (v) =>
        v.length > MAX_TEXT ? t('missionFeedback.form.tooLong') : null,
    },
  });

  useEffect(() => {
    if (feedback) {
      form.setValues({
        totalCostEUR: feedback.totalCostEUR ?? null,
        surfaceM2: feedback.surfaceM2 ?? null,
        result: feedback.result as any,
        difficultiesText: feedback.difficultiesText ?? '',
        learningsText: feedback.learningsText ?? '',
        isPublic: feedback.isPublic,
      });
      setPhotoStorageIds(feedback.photoIds ?? []);
      setPhotoUrls(feedback.photoUrls ?? []);
    }
  }, [feedback]);

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const storageId = await missionFeedbackService.uploadFeedbackPhoto(file);
      setPhotoStorageIds((prev) => [...prev, storageId]);
      // Show local preview
      const url = URL.createObjectURL(file);
      setPhotoUrls((prev) => [...prev, url]);
    } catch (e: any) {
      notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
    }
  };

  const removePhoto = (idx: number) => {
    setPhotoStorageIds((prev) => prev.filter((_, i) => i !== idx));
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      await missionFeedbackService.submit({
        missionId: id,
        totalCostEUR: values.totalCostEUR ?? undefined,
        surfaceM2: values.surfaceM2 ?? undefined,
        result: values.result,
        difficultiesText: values.difficultiesText || undefined,
        learningsText: values.learningsText || undefined,
        photoIds: photoStorageIds,
        isPublic: values.isPublic,
      });
      notifications.show({
        title: t('missionFeedback.form.successTitle'),
        message: t('missionFeedback.form.successMessage'),
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      router.push(`/missions/${id}`);
    } catch (e: any) {
      notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !mission) {
    return (
      <Layout>
        <Center h={400}>
          <Loader />
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
    <Container size="md" py="md">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2}>{t('missionFeedback.form.title')}</Title>
          <Text c="dimmed">{t('missionFeedback.form.subtitle', { title: mission.title })}</Text>
          <Badge size="md" radius="xl" variant="light" color="gray" w="fit-content">
            {t(`missions.status.${mission.status}`)}
          </Badge>
        </Stack>

        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="md">
            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={600}>{t('missionFeedback.form.numericSection')}</Text>
                <Group grow>
                  <NumberInput
                    label={t('missionFeedback.form.totalCost')}
                    suffix=" €"
                    min={0}
                    {...form.getInputProps('totalCostEUR')}
                  />
                  <NumberInput
                    label={t('missionFeedback.form.surface')}
                    suffix=" m²"
                    min={0}
                    {...form.getInputProps('surfaceM2')}
                  />
                </Group>
                <Select
                  label={t('missionFeedback.form.result')}
                  placeholder={t('common.any')}
                  data={FEEDBACK_RESULTS.map((r) => ({
                    value: r,
                    label: t(feedbackResultI18nKey(r)),
                  }))}
                  clearable
                  value={form.values.result ?? null}
                  onChange={(v) => form.setFieldValue('result', (v ?? undefined) as any)}
                />
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={600}>{t('missionFeedback.form.narrativeSection')}</Text>
                <Textarea
                  label={`${t('missionFeedback.form.difficulties')} (${form.values.difficultiesText.length}/${MAX_TEXT})`}
                  minRows={3}
                  maxLength={MAX_TEXT}
                  {...form.getInputProps('difficultiesText')}
                />
                <Textarea
                  label={`${t('missionFeedback.form.learnings')} (${form.values.learningsText.length}/${MAX_TEXT})`}
                  minRows={3}
                  maxLength={MAX_TEXT}
                  {...form.getInputProps('learningsText')}
                />
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={600}>{t('missionFeedback.form.photosSection')}</Text>
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <Image src={url} radius="md" alt={`feedback ${idx}`} />
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="filled"
                        radius="xl"
                        style={{ position: 'absolute', top: 4, right: 4 }}
                        onClick={() => removePhoto(idx)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </div>
                  ))}
                </SimpleGrid>
                <FileButton onChange={handlePhotoUpload} accept="image/*">
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      variant="light"
                      radius="xl"
                    >
                      {t('missionFeedback.form.addPhoto')}
                    </Button>
                  )}
                </FileButton>
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Switch
                  label={t('missionFeedback.form.isPublic')}
                  description={t('missionFeedback.form.isPublicHelp')}
                  checked={form.values.isPublic}
                  onChange={(e) => form.setFieldValue('isPublic', e.currentTarget.checked)}
                />
              </Stack>
            </Card>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => router.back()} radius="xl">
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={submitting} color="eco-primary" radius="xl">
                {t('missionFeedback.form.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
    </Layout>
  );
}
