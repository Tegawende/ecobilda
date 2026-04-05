'use client';

import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Group,
  Select,
  NumberInput,
  Grid,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import {
  IconMapPin,
  IconClock,
  IconHome,
  IconToolsKitchen2,
  IconBulb,
} from '@tabler/icons-react';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

interface Step2FormData {
  city: string;
  postalCode: string;
  countryCode: string;
  hoursPerDay: number;
  daysPerWeek: number;
  maxHelpers: number;
  accommodationDetails: string;
  foodDetails: string;
}

interface ProjectFormStep2Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectFormStep2({ data, onUpdate, onNext, onBack }: ProjectFormStep2Props) {
  const t = useTranslations();
  const form = useForm<Step2FormData>({
    initialValues: {
      city: data.address.city || '',
      postalCode: data.address.postalCode || '',
      countryCode: data.address.countryCode || '',
      hoursPerDay: data.hoursPerDay || 5,
      daysPerWeek: data.daysPerWeek || 5,
      maxHelpers: data.maxHelpers || 2,
      accommodationDetails: data.accommodationDetails || '',
      foodDetails: data.foodDetails || '',
    },
    validate: {
      city: (value) => (value.length < 2 ? t('createProject.step2.validation.cityRequired') : null),
      postalCode: (value) => (value.length < 2 ? t('createProject.step2.validation.postalCodeRequired') : null),
      countryCode: (value) => (value.length < 2 ? t('createProject.step2.validation.countryRequired') : null),
      hoursPerDay: (value) => (value < 1 || value > 10 ? t('createProject.step2.validation.hoursRange') : null),
      daysPerWeek: (value) => (value < 1 || value > 7 ? t('createProject.step2.validation.daysRange') : null),
      maxHelpers: (value) => (value < 1 || value > 20 ? t('createProject.step2.validation.maxVolunteersRange') : null),
      accommodationDetails: (value) =>
        value.length < 20 ? t('createProject.step2.validation.accommodationMin') : null,
      foodDetails: (value) =>
        value.length < 20 ? t('createProject.step2.validation.foodMin') : null,
    },
  });

  const handleFormSubmit = (formData: Step2FormData) => {
    onUpdate({
      address: {
        ...data.address,
        city: formData.city,
        postalCode: formData.postalCode,
        countryCode: formData.countryCode,
        formattedAddress: `${formData.city}, ${formData.countryCode}`,
      },
      hoursPerDay: formData.hoursPerDay,
      daysPerWeek: formData.daysPerWeek,
      maxHelpers: formData.maxHelpers,
      accommodationDetails: formData.accommodationDetails,
      foodDetails: formData.foodDetails,
    });
    onNext();
  };

  return (
    <form onSubmit={form.onSubmit(handleFormSubmit)}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="md">
            {t('createProject.step2.title')}
          </Title>
          <Text c="dimmed">
            {t('createProject.step2.description')}
          </Text>
        </div>

        {/* Location */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="red" variant="light">
              <IconMapPin size={20} />
            </ThemeIcon>
            <Title order={3}>{t('createProject.step2.location')}</Title>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={12}>
              <TextInput
                label={t('createProject.step2.city')}
                placeholder={t('createProject.step2.cityPlaceholder')}
                {...form.getInputProps('city')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label={t('createProject.step2.postalCode')}
                placeholder={t('createProject.step2.postalCodePlaceholder')}
                {...form.getInputProps('postalCode')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label={t('createProject.step2.country')}
                placeholder={t('createProject.step2.countryPlaceholder')}
                {...form.getInputProps('countryCode')}
                data={[
                  { value: 'FR', label: 'France' },
                  { value: 'ES', label: 'Spain' },
                  { value: 'DE', label: 'Germany' },
                  { value: 'IT', label: 'Italy' },
                  { value: 'PT', label: 'Portugal' },
                  { value: 'GB', label: 'United Kingdom' },
                  { value: 'IE', label: 'Ireland' },
                  { value: 'BE', label: 'Belgium' },
                  { value: 'NL', label: 'Netherlands' },
                  { value: 'CH', label: 'Switzerland' },
                  { value: 'AT', label: 'Austria' },
                  { value: 'US', label: 'United States' },
                  { value: 'CA', label: 'Canada' },
                  { value: 'AU', label: 'Australia' },
                  { value: 'NZ', label: 'New Zealand' },
                ]}
              />
            </Grid.Col>
          </Grid>

          <Alert color="yellow" icon={<IconBulb />} mt="md">
            {t('createProject.step2.privacyNote')}
          </Alert>
        </div>

        {/* Work Arrangement */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="eco-terracotta" variant="light">
              <IconClock size={20} />
            </ThemeIcon>
            <Title order={3}>{t('createProject.step2.workArrangement')}</Title>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.hoursPerDay')}
                min={1}
                max={10}
                description={t('createProject.step2.hoursPerDayDesc')}
                {...form.getInputProps('hoursPerDay')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.daysPerWeek')}
                min={1}
                max={7}
                description={t('createProject.step2.daysPerWeekDesc')}
                {...form.getInputProps('daysPerWeek')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.maxVolunteers')}
                min={1}
                max={20}
                description={t('createProject.step2.maxVolunteersDesc')}
                {...form.getInputProps('maxHelpers')}
              />
            </Grid.Col>
          </Grid>
        </div>

        {/* Accommodation */}
        <div>
          <Group mb="sm">
            <IconHome size={20} color="var(--mantine-color-eco-terracotta-5)" />
            <Text fw={500}>{t('createProject.step2.accommodationDetails')}</Text>
          </Group>
          <Textarea
            placeholder={t('createProject.step2.accommodationPlaceholder')}
            minRows={4}
            {...form.getInputProps('accommodationDetails')}
          />
        </div>

        {/* Food */}
        <div>
          <Group mb="sm">
            <IconToolsKitchen2 size={20} color="var(--mantine-color-eco-terracotta-5)" />
            <Text fw={500}>{t('createProject.step2.foodDetails')}</Text>
          </Group>
          <Textarea
            placeholder={t('createProject.step2.foodPlaceholder')}
            minRows={4}
            {...form.getInputProps('foodDetails')}
          />
        </div>

        {/* Navigation */}
        <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button type="button" onClick={onBack} variant="default">
            {t('createProject.step2.back')}
          </Button>
          <Button type="submit" color="eco-terracotta">
            {t('createProject.step2.next')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
