import { useForm } from '@mantine/form';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Radio,
  Group,
  Card,
  Alert,
  List,
} from '@mantine/core';
import { IconPlant, IconHammer, IconBulb } from '@tabler/icons-react';
import type { ProjectFormData } from '../../pages/CreateProjectPage';

interface Step1FormData {
  title: string;
  description: string;
  project_type: 'PERM' | 'NATB';
}

interface ProjectFormStep1Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
}

export function ProjectFormStep1({ data, onUpdate, onNext }: ProjectFormStep1Props) {
  const form = useForm<Step1FormData>({
    initialValues: {
      title: data.title || '',
      description: data.description || '',
      project_type: data.project_type || 'PERM',
    },
    validate: {
      title: (value) => {
        if (value.length < 10) return 'Title must be at least 10 characters';
        if (value.length > 200) return 'Title is too long';
        return null;
      },
      description: (value) => {
        if (value.length < 50) return 'Description must be at least 50 characters';
        if (value.length > 2000) return 'Description is too long';
        return null;
      },
    },
  });

  const descriptionLength = form.values.description.length;

  const handleFormSubmit = (formData: Step1FormData) => {
    onUpdate(formData);
    onNext();
  };

  return (
    <form onSubmit={form.onSubmit(handleFormSubmit)}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="md">
            Basic Information
          </Title>
          <Text c="dimmed">
            Tell us about your project. Be descriptive and engaging to attract the right volunteers.
          </Text>
        </div>

        {/* Project Type */}
        <Radio.Group
          label="Project Type *"
          {...form.getInputProps('project_type')}
        >
          <Group mt="sm" grow>
            <Card
              padding="md"
              withBorder
              style={{
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: form.values.project_type === 'PERM' ? 'var(--mantine-color-blue-6)' : undefined,
                backgroundColor: form.values.project_type === 'PERM' ? 'var(--mantine-color-blue-0)' : undefined,
              }}
              onClick={() => form.setFieldValue('project_type', 'PERM')}
            >
              <Stack gap="xs" align="center">
                <IconPlant size={40} color="var(--mantine-color-green-6)" />
                <Text fw={600}>Permaculture</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Garden, composting, harvesting, etc.
                </Text>
                <Radio value="PERM" styles={{ root: { display: 'none' } }} />
              </Stack>
            </Card>

            <Card
              padding="md"
              withBorder
              style={{
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: form.values.project_type === 'NATB' ? 'var(--mantine-color-blue-6)' : undefined,
                backgroundColor: form.values.project_type === 'NATB' ? 'var(--mantine-color-blue-0)' : undefined,
              }}
              onClick={() => form.setFieldValue('project_type', 'NATB')}
            >
              <Stack gap="xs" align="center">
                <IconHammer size={40} color="var(--mantine-color-orange-6)" />
                <Text fw={600}>Natural Building</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Carpentry, masonry, earthen plaster, etc.
                </Text>
                <Radio value="NATB" styles={{ root: { display: 'none' } }} />
              </Stack>
            </Card>
          </Group>
        </Radio.Group>

        {/* Title */}
        <TextInput
          label="Project Title *"
          placeholder="e.g., Organic Farm in the French Alps"
          description="Choose a catchy title that describes your project"
          {...form.getInputProps('title')}
        />

        {/* Description */}
        <Textarea
          label="Project Description *"
          placeholder="Describe your project in detail. Include:
• What volunteers will be doing
• What they will learn
• Your project's mission and values
• Daily routine and atmosphere
• Anything else that makes your project unique"
          minRows={8}
          {...form.getInputProps('description')}
          description={
            <Group justify="space-between" mt="xs">
              <Text size="sm" c="dimmed">
                Be detailed and authentic. This is your chance to attract the right people!
              </Text>
              <Text
                size="sm"
                c={
                  descriptionLength < 50 || descriptionLength > 2000
                    ? 'red'
                    : 'dimmed'
                }
              >
                {descriptionLength} / 2000
              </Text>
            </Group>
          }
        />

        {/* Tips */}
        <Alert color="blue" title="💡 Tips for a great description:" icon={<IconBulb />}>
          <List size="sm">
            <List.Item>Be specific about daily tasks and learning opportunities</List.Item>
            <List.Item>Mention your values and what makes your project special</List.Item>
            <List.Item>Describe the location, surroundings, and living conditions</List.Item>
            <List.Item>Share your vision and what you hope to achieve together</List.Item>
          </List>
        </Alert>

        {/* Navigation */}
        <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button type="submit">
            Next: Location & Work Details →
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
