'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Select,
  TextInput,
  Textarea,
  NumberInput,
  Group,
  Button,
  Switch,
  Alert,
  Badge,
  Center,
  Loader,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import {
  POSTE_OPTIONS,
  DIFFICULTY_OPTIONS,
  MISSION_TYPE_OPTIONS,
  TECHNIQUES_BY_POSTE,
  type Poste,
  techniqueI18nKey,
} from '@/types/missions';
import { Layout } from '@/components/common/Layout';
import { missionsService } from '@/services/missions';
import { projectsService } from '@/services/projects';
import { useSkills } from '@/hooks/useConvex';
import type { Project } from '@/types';

type FormValues = {
  projectId: string;
  type: 'CHANTIER' | 'FORMATION';
  title: string;
  description: string;
  poste?: string;
  technique?: string;
  difficulty: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  pricingMode: 'FREE' | 'PAID';
  priceEUR: number | null;
  startDate: Date | null;
  endDate: Date | null;
  maxParticipants: number;
  hoursPerDay: number;
  daysPerWeek: number;
  skillCodes: string[];
};

export function CreateMissionClient() {
  const t = useTranslations();
  const router = useRouter();
  const { skills } = useSkills();

  const [places, setPlaces] = useState<Project[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  useEffect(() => {
    let mounted = true;
    projectsService
      .getMyPlaces()
      .then((p) => mounted && setPlaces(p))
      .finally(() => mounted && setLoadingPlaces(false));
    return () => {
      mounted = false;
    };
  }, []);

  const validatedPlaces = places.filter((p) => p.status === 'ACTIVE');

  const form = useForm<FormValues>({
    initialValues: {
      projectId: '',
      type: 'CHANTIER',
      title: '',
      description: '',
      poste: undefined,
      technique: undefined,
      difficulty: 'DEBUTANT',
      pricingMode: 'FREE',
      priceEUR: null,
      startDate: null,
      endDate: null,
      maxParticipants: 2,
      hoursPerDay: 6,
      daysPerWeek: 5,
      skillCodes: [],
    },
    validate: {
      projectId: (v) => (!v ? t('createMission.validation.projectRequired') : null),
      title: (v) => (v.length < 5 ? t('createMission.validation.titleMin') : null),
      description: (v) => (v.length < 30 ? t('createMission.validation.descriptionMin') : null),
      startDate: (v) => (!v ? t('createMission.validation.startDateRequired') : null),
      endDate: (v, vals) =>
        !v
          ? t('createMission.validation.endDateRequired')
          : vals.startDate && new Date(v) < new Date(vals.startDate)
            ? t('createMission.validation.endAfterStart')
            : null,
      priceEUR: (v, vals) =>
        vals.pricingMode === 'PAID' && (!v || v <= 0)
          ? t('createMission.validation.priceRequired')
          : null,
    },
  });

  const techOptions: { value: string; label: string }[] = form.values.poste
    ? (TECHNIQUES_BY_POSTE[form.values.poste as Poste] || []).map((tech) => ({
        value: tech,
        label: t(techniqueI18nKey(tech)),
      }))
    : [];

  const onSubmit = async (values: FormValues) => {
    try {
      const id = await missionsService.create({
        projectId: values.projectId,
        type: values.type,
        title: values.title.trim(),
        description: values.description.trim(),
        poste: values.type === 'CHANTIER' ? values.poste : undefined,
        technique: values.type === 'CHANTIER' ? values.technique : undefined,
        difficulty: values.difficulty,
        pricingMode: values.pricingMode,
        priceEUR: values.pricingMode === 'PAID' ? values.priceEUR ?? undefined : undefined,
        startDate: values.startDate!.toISOString().split('T')[0],
        endDate: values.endDate!.toISOString().split('T')[0],
        maxParticipants: values.maxParticipants,
        hoursPerDay: values.hoursPerDay,
        daysPerWeek: values.daysPerWeek,
        skillCodes: values.skillCodes,
      });
      notifications.show({
        title: t('createMission.successTitle'),
        message: t('createMission.successMessage'),
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      router.push(`/missions/${id}/edit`);
    } catch (err: any) {
      notifications.show({
        title: t('common.error'),
        message: err?.message ?? t('createMission.errorMessage'),
        color: 'red',
      });
    }
  };

  if (loadingPlaces) {
    return (
      <Layout>
        <Center h={400}>
          <Loader />
        </Center>
      </Layout>
    );
  }

  if (places.length === 0) {
    return (
      <Layout>
        <Container size="sm" py="xl">
          <Alert
            color="yellow"
            icon={<IconAlertCircle size={20} />}
            title={t('createMission.noPlaceTitle')}
          >
            <Stack gap="sm">
              <Text size="sm">{t('createMission.noPlaceMessage')}</Text>
              <Button component={Link} href="/create-project" radius="xl" color="eco-primary">
                {t('createMission.createPlaceCta')}
              </Button>
            </Stack>
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (validatedPlaces.length === 0) {
    return (
      <Layout>
        <Container size="sm" py="xl">
          <Alert
            color="yellow"
            icon={<IconAlertCircle size={20} />}
            title={t('createMission.placePendingTitle')}
          >
            {t('createMission.placePendingMessage')}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
    <Container size="md" py="md">
      <Stack gap="md">
        <Title order={2}>{t('createMission.title')}</Title>
        <Text c="dimmed">{t('createMission.subtitle')}</Text>

        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="md">
            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Select
                  label={t('createMission.fields.place')}
                  placeholder={t('createMission.fields.placePlaceholder')}
                  required
                  data={validatedPlaces.map((p) => ({ value: p._id, label: p.title }))}
                  {...form.getInputProps('projectId')}
                />

                <Select
                  label={t('createMission.fields.type')}
                  required
                  data={MISSION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
                  {...form.getInputProps('type')}
                />

                <TextInput
                  label={t('createMission.fields.title')}
                  placeholder={t('createMission.fields.titlePlaceholder')}
                  required
                  {...form.getInputProps('title')}
                />

                <Textarea
                  label={t('createMission.fields.description')}
                  placeholder={t('createMission.fields.descriptionPlaceholder')}
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

            {form.values.type === 'CHANTIER' && (
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Text fw={600}>{t('createMission.fields.workSection')}</Text>
                  <Group grow>
                    <Select
                      label={t('createMission.fields.poste')}
                      data={POSTE_OPTIONS.map((o) => ({
                        value: o.value,
                        label: t(o.i18nKey),
                      }))}
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

            {form.values.type === 'FORMATION' && (
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Text fw={600}>{t('createMission.fields.pricingSection')}</Text>
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
                <Text fw={600}>{t('createMission.fields.scheduleSection')}</Text>
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
                    required
                    {...form.getInputProps('maxParticipants')}
                  />
                  <NumberInput
                    label={t('createMission.fields.hoursPerDay')}
                    min={1}
                    max={12}
                    required
                    {...form.getInputProps('hoursPerDay')}
                  />
                  <NumberInput
                    label={t('createMission.fields.daysPerWeek')}
                    min={1}
                    max={7}
                    required
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

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => router.push('/my-missions')}
                radius="xl"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" color="eco-primary" radius="xl">
                {t('createMission.submitDraft')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Container>
    </Layout>
  );
}
