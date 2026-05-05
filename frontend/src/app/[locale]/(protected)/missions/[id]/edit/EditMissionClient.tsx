'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Title,
  Card,
  Select,
  TextInput,
  Textarea,
  NumberInput,
  Group,
  Button,
  Switch,
  Badge,
  Center,
  Loader,
  Text,
  Box,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import {
  POSTE_OPTIONS,
  DIFFICULTY_OPTIONS,
  TECHNIQUES_BY_POSTE,
  type Poste,
  techniqueI18nKey,
} from '@/types/missions';
import { Layout } from '@/components/common/Layout';
import { missionsService } from '@/services/missions';
import { useMission, useSkills } from '@/hooks/useConvex';

interface EditMissionClientProps {
  id: string;
}

export function EditMissionClient({ id }: EditMissionClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const { mission, isLoading } = useMission(id);
  const { skills } = useSkills();

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      poste: undefined as string | undefined,
      technique: undefined as string | undefined,
      difficulty: 'DEBUTANT' as 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT',
      pricingMode: 'FREE' as 'FREE' | 'PAID',
      priceEUR: null as number | null,
      startDate: null as Date | null,
      endDate: null as Date | null,
      maxParticipants: 2,
      hoursPerDay: 6,
      daysPerWeek: 5,
      skillCodes: [] as string[],
    },
  });

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (mission && !initialized) {
      form.setValues({
        title: mission.title,
        description: mission.description,
        poste: mission.poste,
        technique: mission.technique,
        difficulty: mission.difficulty,
        pricingMode: mission.pricingMode,
        priceEUR: mission.priceEUR ?? null,
        startDate: mission.startDate ? new Date(mission.startDate) : null,
        endDate: mission.endDate ? new Date(mission.endDate) : null,
        maxParticipants: mission.maxParticipants,
        hoursPerDay: mission.hoursPerDay,
        daysPerWeek: mission.daysPerWeek,
        skillCodes: mission.skills?.map((s: any) => s.code) ?? [],
      });
      setInitialized(true);
    }
  }, [mission, initialized]);

  const techOptions: { value: string; label: string }[] = form.values.poste
    ? (TECHNIQUES_BY_POSTE[form.values.poste as Poste] || []).map((tech) => ({
        value: tech,
        label: t(techniqueI18nKey(tech)),
      }))
    : [];

  const onSave = async (values: typeof form.values) => {
    try {
      await missionsService.update(id, {
        title: values.title,
        description: values.description,
        poste: values.poste,
        technique: values.technique,
        difficulty: values.difficulty,
        pricingMode: values.pricingMode,
        priceEUR: values.pricingMode === 'PAID' ? values.priceEUR ?? undefined : undefined,
        startDate: values.startDate?.toISOString().split('T')[0],
        endDate: values.endDate?.toISOString().split('T')[0],
        maxParticipants: values.maxParticipants,
        hoursPerDay: values.hoursPerDay,
        daysPerWeek: values.daysPerWeek,
        skillCodes: values.skillCodes,
      });
      notifications.show({
        title: t('createMission.editSuccessTitle'),
        message: t('createMission.editSuccessMessage'),
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

  const handlePublish = async () => {
    try {
      await missionsService.setStatus(id, 'PUBLISHED');
      notifications.show({
        title: t('createMission.publishedTitle'),
        message: t('createMission.publishedMessage'),
        color: 'green',
      });
      router.push('/my-missions');
    } catch (e: any) {
      notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
    }
  };

  const handleUnpublish = async () => {
    try {
      await missionsService.setStatus(id, 'DRAFT');
      notifications.show({ title: t('common.saved'), message: '', color: 'green' });
    } catch (e: any) {
      notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
    }
  };

  const handleCancel = () => {
    modals.openConfirmModal({
      title: t('createMission.cancelMissionTitle'),
      children: <Text size="sm">{t('createMission.cancelMissionText')}</Text>,
      labels: { confirm: t('createMission.cancelMissionConfirm'), cancel: t('common.back') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await missionsService.setStatus(id, 'CANCELLED', '');
          notifications.show({ title: t('common.saved'), message: '', color: 'green' });
          router.push('/my-missions');
        } catch (e: any) {
          notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
        }
      },
    });
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: t('myMissions.deleteConfirmTitle'),
      children: (
        <Text size="sm">{t('myMissions.deleteConfirmText', { title: mission?.title ?? '' })}</Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await missionsService.remove(id);
          router.push('/my-missions');
        } catch (e: any) {
          notifications.show({
            title: t('common.error'),
            message: e?.message ?? '',
            color: 'red',
          });
        }
      },
    });
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

  const isPublished = mission.status === 'PUBLISHED' || mission.status === 'IN_PROGRESS';

  return (
    <Layout>
    <Container size="md" py="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>{t('createMission.editTitle')}</Title>
          <Badge size="lg" radius="xl" variant="light">
            {t(`missions.status.${mission.status}`)}
          </Badge>
        </Group>

        <form onSubmit={form.onSubmit(onSave)}>
          <Stack gap="md">
            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <TextInput
                  label={t('createMission.fields.title')}
                  required
                  {...form.getInputProps('title')}
                />
                <Textarea
                  label={t('createMission.fields.description')}
                  required
                  minRows={5}
                  {...form.getInputProps('description')}
                />
                <Select
                  label={t('createMission.fields.difficulty')}
                  required
                  data={DIFFICULTY_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
                  {...form.getInputProps('difficulty')}
                />
              </Stack>
            </Card>

            {mission.type === 'CHANTIER' && (
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Text fw={600}>{t('createMission.fields.workSection')}</Text>
                  <Group grow>
                    <Select
                      label={t('createMission.fields.poste')}
                      data={POSTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
                      clearable
                      value={form.values.poste ?? null}
                      onChange={(v) =>
                        form.setValues({ poste: v ?? undefined, technique: undefined })
                      }
                    />
                    <Select
                      label={t('createMission.fields.technique')}
                      data={techOptions}
                      disabled={!form.values.poste || techOptions.length === 0}
                      clearable
                      value={form.values.technique ?? null}
                      onChange={(v) => form.setFieldValue('technique', v ?? undefined)}
                    />
                  </Group>
                </Stack>
              </Card>
            )}

            {mission.type === 'FORMATION' && (
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Switch
                    label={t('createMission.fields.isPaid')}
                    checked={form.values.pricingMode === 'PAID'}
                    onChange={(e) =>
                      form.setFieldValue('pricingMode', e.currentTarget.checked ? 'PAID' : 'FREE')
                    }
                  />
                  {form.values.pricingMode === 'PAID' && (
                    <NumberInput
                      label={t('createMission.fields.price')}
                      min={0}
                      step={1}
                      suffix=" €"
                      {...form.getInputProps('priceEUR')}
                    />
                  )}
                </Stack>
              </Card>
            )}

            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Group grow>
                  <DateInput
                    label={t('createMission.fields.startDate')}
                    required
                    {...form.getInputProps('startDate')}
                  />
                  <DateInput
                    label={t('createMission.fields.endDate')}
                    required
                    {...form.getInputProps('endDate')}
                  />
                </Group>
                <Group grow>
                  <NumberInput
                    label={t('createMission.fields.maxParticipants')}
                    min={1}
                    max={20}
                    {...form.getInputProps('maxParticipants')}
                  />
                  <NumberInput
                    label={t('createMission.fields.hoursPerDay')}
                    min={1}
                    max={12}
                    {...form.getInputProps('hoursPerDay')}
                  />
                  <NumberInput
                    label={t('createMission.fields.daysPerWeek')}
                    min={1}
                    max={7}
                    {...form.getInputProps('daysPerWeek')}
                  />
                </Group>
              </Stack>
            </Card>

            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={600}>{t('createMission.fields.skillsSection')}</Text>
                <Group gap="xs">
                  {skills.map((skill: any) => {
                    const checked = form.values.skillCodes.includes(skill.code);
                    return (
                      <Badge
                        key={skill.code}
                        variant={checked ? 'filled' : 'light'}
                        color="eco-primary"
                        radius="xl"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          form.setFieldValue(
                            'skillCodes',
                            checked
                              ? form.values.skillCodes.filter((c) => c !== skill.code)
                              : [...form.values.skillCodes, skill.code]
                          )
                        }
                      >
                        {skill.displayNameFr || skill.displayNameEn}
                      </Badge>
                    );
                  })}
                </Group>
              </Stack>
            </Card>

            <Group justify="space-between">
              <Group>
                <Button
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleDelete}
                  radius="xl"
                >
                  {t('common.delete')}
                </Button>
                {mission.status === 'PUBLISHED' && (
                  <Button color="orange" variant="light" onClick={handleCancel} radius="xl">
                    {t('createMission.cancelMissionConfirm')}
                  </Button>
                )}
              </Group>
              <Group>
                <Button variant="default" onClick={() => router.push('/my-missions')} radius="xl">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" radius="xl">
                  {t('common.save')}
                </Button>
                {mission.status === 'DRAFT' ? (
                  <Button onClick={handlePublish} color="eco-primary" radius="xl">
                    {t('createMission.publish')}
                  </Button>
                ) : isPublished ? (
                  <Button onClick={handleUnpublish} color="gray" variant="light" radius="xl">
                    {t('createMission.unpublish')}
                  </Button>
                ) : null}
              </Group>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
    </Layout>
  );
}
