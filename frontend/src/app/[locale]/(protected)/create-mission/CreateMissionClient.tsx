'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
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
  Badge,
  Loader,
  Center,
  SegmentedControl,
  Box,
  Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import {
  POSTE_OPTIONS,
  DIFFICULTY_OPTIONS,
  MISSION_TYPE_OPTIONS,
  TECHNIQUES_BY_POSTE,
  type Poste,
  techniqueI18nKey,
} from '@/types/missions';
import { Layout } from '@/components/common/Layout';
import {
  PlaceFieldsSection,
  emptyPlaceFieldsValues,
  type PlaceFieldsValues,
} from '@/components/places/PlaceFieldsSection';
import { missionsService } from '@/services/missions';
import { projectsService } from '@/services/projects';
import { useSkills } from '@/hooks/useConvex';
import type { Project } from '@/types';

type FormValues = {
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

  // Active places + place picking state
  const activePlaces = places.filter((p) => p.status === 'ACTIVE');
  const allPlaces = places; // includes PENDING ones (still usable for DRAFT missions)
  const [placeMode, setPlaceMode] = useState<'existing' | 'new'>('existing');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(undefined);
  const [placeValues, setPlaceValues] = useState<PlaceFieldsValues>(emptyPlaceFieldsValues);
  const [placeFieldErrors, setPlaceFieldErrors] = useState<{ title?: string; addressCity?: string }>({});

  // Initialize place mode based on what the user has
  useEffect(() => {
    if (loadingPlaces) return;
    if (allPlaces.length === 0) {
      setPlaceMode('new');
    } else {
      setPlaceMode('existing');
      setSelectedPlaceId(allPlaces[0]._id);
    }
  }, [loadingPlaces, allPlaces.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<FormValues>({
    initialValues: {
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

  const validatePlaceFields = (): boolean => {
    const errs: { title?: string; addressCity?: string } = {};
    if (placeValues.title.length < 3) errs.title = t('createPlace.validation.titleMin');
    if (!placeValues.address.city) errs.addressCity = t('createPlace.validation.cityRequired');
    setPlaceFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (values: FormValues) => {
    // Determine projectId: existing or freshly created
    let projectId: string | undefined = undefined;
    let placeIsActive = false;

    if (placeMode === 'existing') {
      if (!selectedPlaceId) {
        notifications.show({
          title: t('common.error'),
          message: t('createMission.validation.projectRequired'),
          color: 'red',
        });
        return;
      }
      projectId = selectedPlaceId;
      placeIsActive = activePlaces.some((p) => p._id === selectedPlaceId);
    } else {
      // Create new place inline
      if (!validatePlaceFields()) return;
      try {
        const created = await projectsService.createProject({
          title: placeValues.title,
          accommodationDetails: placeValues.accommodationDetails || undefined,
          foodDetails: placeValues.foodDetails || undefined,
          internetProvided: placeValues.internetProvided,
          familyFriendly: placeValues.familyFriendly,
          petsAllowed: placeValues.petsAllowed,
          smokingAllowed: placeValues.smokingAllowed,
          languageCodes: placeValues.languages,
          address: {
            city: placeValues.address.city,
            postalCode: placeValues.address.postalCode,
            countryCode: placeValues.address.countryCode,
            latitude: placeValues.address.latitude,
            longitude: placeValues.address.longitude,
            formattedAddress: placeValues.address.formattedAddress,
          },
        });
        projectId = created._id;
        placeIsActive = false; // freshly created → PENDING
      } catch (err: any) {
        notifications.show({
          title: t('common.error'),
          message: err?.message ?? '',
          color: 'red',
        });
        return;
      }
    }

    // Create the mission (DRAFT)
    try {
      const id = await missionsService.create({
        projectId: projectId!,
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
        message: placeIsActive
          ? t('createMission.successMessage')
          : t('createMission.successPendingPlace'),
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

  return (
    <Layout>
      <Container size="md" py="md">
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={2}>{t('createMission.title')}</Title>
            <Text c="dimmed">{t('createMission.subtitle')}</Text>
          </Stack>

          <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack gap="md">
              {/* Place section */}
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Group justify="space-between" wrap="wrap">
                    <Text fw={600}>{t('createMission.placeSection')}</Text>
                    {allPlaces.length > 0 && (
                      <SegmentedControl
                        size="xs"
                        value={placeMode}
                        onChange={(v) => setPlaceMode(v as 'existing' | 'new')}
                        data={[
                          { value: 'existing', label: t('createMission.useExistingPlace') },
                          { value: 'new', label: t('createMission.createNewPlace') },
                        ]}
                      />
                    )}
                  </Group>

                  {placeMode === 'existing' ? (
                    <>
                      <Select
                        label={t('createMission.fields.place')}
                        placeholder={t('createMission.fields.placePlaceholder')}
                        required
                        data={allPlaces.map((p) => ({
                          value: p._id,
                          label: `${p.title}${p.status !== 'ACTIVE' ? ` (${p.status === 'PENDING' ? t('common.pending') : t('common.rejected')})` : ''}`,
                        }))}
                        value={selectedPlaceId ?? null}
                        onChange={(v) => setSelectedPlaceId(v ?? undefined)}
                      />
                      {selectedPlaceId &&
                        !activePlaces.some((p) => p._id === selectedPlaceId) && (
                          <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                            {t('createMission.placePendingNotice')}
                          </Alert>
                        )}
                    </>
                  ) : (
                    <Box>
                      <Text size="sm" c="dimmed" mb="xs">
                        {t('createMission.newPlaceHint')}
                      </Text>
                      <PlaceFieldsSection
                        values={placeValues}
                        onChange={setPlaceValues}
                        errors={placeFieldErrors}
                      />
                    </Box>
                  )}
                </Stack>
              </Card>

              {/* Mission core */}
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Text fw={600}>{t('createMission.missionSection')}</Text>
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

              {/* CHANTIER-specific */}
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

              {/* FORMATION pricing */}
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

              {/* Schedule */}
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

              {/* Skills */}
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
