import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
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
import type { ProjectFormData } from '../../pages/CreateProjectPage';

interface Step2FormData {
  city: string;
  postal_code: string;
  country_code: string;
  hours_per_day: number;
  days_per_week: number;
  max_helpers: number;
  accommodation_details: string;
  food_details: string;
}

interface ProjectFormStep2Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectFormStep2({ data, onUpdate, onNext, onBack }: ProjectFormStep2Props) {
  const { t } = useTranslation();
  const form = useForm<Step2FormData>({
    initialValues: {
      city: data.address.city || '',
      postal_code: data.address.postal_code || '',
      country_code: data.address.country_code || '',
      hours_per_day: data.hours_per_day || 5,
      days_per_week: data.days_per_week || 5,
      max_helpers: data.max_helpers || 2,
      accommodation_details: data.accommodation_details || '',
      food_details: data.food_details || '',
    },
    validate: {
      city: (value) => (value.length < 2 ? t('createProject.step2.validation.cityRequired') : null),
      postal_code: (value) => (value.length < 2 ? t('createProject.step2.validation.postalCodeRequired') : null),
      country_code: (value) => (value.length < 2 ? t('createProject.step2.validation.countryRequired') : null),
      hours_per_day: (value) => (value < 1 || value > 10 ? t('createProject.step2.validation.hoursRange') : null),
      days_per_week: (value) => (value < 1 || value > 7 ? t('createProject.step2.validation.daysRange') : null),
      max_helpers: (value) => (value < 1 || value > 20 ? t('createProject.step2.validation.maxVolunteersRange') : null),
      accommodation_details: (value) =>
        value.length < 20 ? t('createProject.step2.validation.accommodationMin') : null,
      food_details: (value) =>
        value.length < 20 ? t('createProject.step2.validation.foodMin') : null,
    },
  });

  const handleFormSubmit = (formData: Step2FormData) => {
    onUpdate({
      address: {
        ...data.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country_code: formData.country_code,
        formatted_address: `${formData.city}, ${formData.country_code}`,
      },
      hours_per_day: formData.hours_per_day,
      days_per_week: formData.days_per_week,
      max_helpers: formData.max_helpers,
      accommodation_details: formData.accommodation_details,
      food_details: formData.food_details,
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
                {...form.getInputProps('postal_code')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label={t('createProject.step2.country')}
                placeholder={t('createProject.step2.countryPlaceholder')}
                {...form.getInputProps('country_code')}
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
                {...form.getInputProps('hours_per_day')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.daysPerWeek')}
                min={1}
                max={7}
                description={t('createProject.step2.daysPerWeekDesc')}
                {...form.getInputProps('days_per_week')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.maxVolunteers')}
                min={1}
                max={20}
                description={t('createProject.step2.maxVolunteersDesc')}
                {...form.getInputProps('max_helpers')}
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
            {...form.getInputProps('accommodation_details')}
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
            {...form.getInputProps('food_details')}
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
