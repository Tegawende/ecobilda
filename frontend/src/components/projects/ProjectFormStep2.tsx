import { useForm } from '@mantine/form';
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
      city: (value) => (value.length < 2 ? 'City is required' : null),
      postal_code: (value) => (value.length < 2 ? 'Postal code is required' : null),
      country_code: (value) => (value.length < 2 ? 'Country is required' : null),
      hours_per_day: (value) => (value < 1 || value > 10 ? 'Must be between 1 and 10' : null),
      days_per_week: (value) => (value < 1 || value > 7 ? 'Must be between 1 and 7' : null),
      max_helpers: (value) => (value < 1 || value > 20 ? 'Must be between 1 and 20' : null),
      accommodation_details: (value) =>
        value.length < 20 ? 'Please provide details about accommodation (min 20 characters)' : null,
      food_details: (value) =>
        value.length < 20 ? 'Please provide details about food (min 20 characters)' : null,
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
            Location & Work Details
          </Title>
          <Text c="dimmed">
            Help volunteers find you and understand the work arrangement.
          </Text>
        </div>

        {/* Location */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="red" variant="light">
              <IconMapPin size={20} />
            </ThemeIcon>
            <Title order={3}>Location</Title>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={12}>
              <TextInput
                label="City *"
                placeholder="e.g., Lyon"
                {...form.getInputProps('city')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Postal Code *"
                placeholder="e.g., 69000"
                {...form.getInputProps('postal_code')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Country *"
                placeholder="Select a country"
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
            Exact address is not required for privacy. City and country are sufficient.
          </Alert>
        </div>

        {/* Work Arrangement */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="blue" variant="light">
              <IconClock size={20} />
            </ThemeIcon>
            <Title order={3}>Work Arrangement</Title>
          </Group>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Hours per day *"
                min={1}
                max={10}
                description="1-10 hours"
                {...form.getInputProps('hours_per_day')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Days per week *"
                min={1}
                max={7}
                description="1-7 days"
                {...form.getInputProps('days_per_week')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Max volunteers *"
                min={1}
                max={20}
                description="1-20 people"
                {...form.getInputProps('max_helpers')}
              />
            </Grid.Col>
          </Grid>
        </div>

        {/* Accommodation */}
        <div>
          <Group mb="sm">
            <IconHome size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>Accommodation Details *</Text>
          </Group>
          <Textarea
            placeholder={`Describe where volunteers will sleep. For example:
• Private room, shared room, tent, caravan, etc.
• Shared or private bathroom
• Bedding and towels provided?
• Heating/cooling
• Any other relevant details`}
            minRows={4}
            {...form.getInputProps('accommodation_details')}
          />
        </div>

        {/* Food */}
        <div>
          <Group mb="sm">
            <IconToolsKitchen2 size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={500}>Food Details *</Text>
          </Group>
          <Textarea
            placeholder={`Describe the food arrangement. For example:
• How many meals per day are provided?
• Type of food (vegetarian, vegan, omnivore)
• Source (homegrown, organic, local market)
• Volunteers cook together or meals provided?
• Kitchen access for volunteers?`}
            minRows={4}
            {...form.getInputProps('food_details')}
          />
        </div>

        {/* Navigation */}
        <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button type="button" onClick={onBack} variant="default">
            ← Back
          </Button>
          <Button type="submit">
            Next: Skills & Amenities →
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
