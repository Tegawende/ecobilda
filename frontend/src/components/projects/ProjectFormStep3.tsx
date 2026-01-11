import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Checkbox,
  Card,
  Grid,
  Skeleton,
  ThemeIcon,
} from '@mantine/core';
import {
  IconPlant,
  IconHammer,
  IconCheck,
  IconWifi,
  IconUsers,
  IconDog,
  IconSmoking,
  IconStar
} from '@tabler/icons-react';
import { skillsService } from '../../services/skills';
import type { ProjectFormData } from '../../pages/CreateProjectPage';
import type { Skill } from '../../types';

interface Step3FormData {
  skills: string[];
  internet_provided: boolean;
  family_friendly: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
}

interface ProjectFormStep3Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectFormStep3({ data, onUpdate, onNext, onBack }: ProjectFormStep3Props) {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  const form = useForm<Step3FormData>({
    initialValues: {
      skills: data.skills || [],
      internet_provided: data.internet_provided || false,
      family_friendly: data.family_friendly || false,
      pets_allowed: data.pets_allowed || false,
      smoking_allowed: data.smoking_allowed || false,
    },
    validate: {
      skills: (value) => (value.length === 0 ? 'Please select at least one skill' : null),
    },
  });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skillsData = await skillsService.getSkills({ category: data.project_type });
        // Handle both array and paginated response
        const skills = Array.isArray(skillsData) ? skillsData : (skillsData as any).results || [];
        setAllSkills(skills);
      } catch (error) {
        console.error('Failed to fetch skills:', error);
        setAllSkills([]); // Set empty array on error
      } finally {
        setIsLoadingSkills(false);
      }
    };

    fetchSkills();
  }, [data.project_type]);

  const toggleSkill = (skillCode: string) => {
    const currentSkills = form.values.skills;
    if (currentSkills.includes(skillCode)) {
      form.setFieldValue(
        'skills',
        currentSkills.filter((s) => s !== skillCode)
      );
    } else {
      form.setFieldValue('skills', [...currentSkills, skillCode]);
    }
  };

  const handleFormSubmit = (formData: Step3FormData) => {
    onUpdate(formData);
    onNext();
  };

  return (
    <form onSubmit={form.onSubmit(handleFormSubmit)}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="md">
            Skills & Amenities
          </Title>
          <Text c="dimmed">
            Select the skills volunteers will use and the amenities you provide.
          </Text>
        </div>

        {/* Skills Selection */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="green" variant="light">
              {data.project_type === 'PERM' ? (
                <IconPlant size={20} />
              ) : (
                <IconHammer size={20} />
              )}
            </ThemeIcon>
            <Title order={3}>
              {data.project_type === 'PERM' ? 'Permaculture' : 'Natural Building'} Skills *
            </Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Select all skills that volunteers will be working with. Choose at least one.
          </Text>

          {isLoadingSkills ? (
            <Grid gutter="md">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4 }}>
                  <Skeleton height={80} radius="md" />
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Grid gutter="md">
              {allSkills.map((skill) => {
                const isSelected = form.values.skills.includes(skill.code);
                return (
                  <Grid.Col key={skill.code} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card
                      padding="md"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        borderWidth: 2,
                        borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
                        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                      }}
                      onClick={() => toggleSkill(skill.code)}
                    >
                      <Group wrap="nowrap" align="flex-start">
                        <Text size="xl">{skill.icon}</Text>
                        <Text fw={500} size="sm" style={{ flex: 1 }}>
                          {skill.display_name_en}
                        </Text>
                        {isSelected && (
                          <ThemeIcon color="blue" variant="light" size="sm">
                            <IconCheck size={14} />
                          </ThemeIcon>
                        )}
                      </Group>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}

          {form.errors.skills && (
            <Text size="sm" c="red" mt="xs">
              {form.errors.skills}
            </Text>
          )}
          <Text size="sm" c="dimmed" mt="xs">
            Selected: {form.values.skills.length} skill(s)
          </Text>
        </div>

        {/* Amenities */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="yellow" variant="light">
              <IconStar size={20} />
            </ThemeIcon>
            <Title order={3}>Amenities</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Select the amenities and preferences for your project.
          </Text>

          <Stack gap="sm">
            <Card padding="md" withBorder>
              <Checkbox
                {...form.getInputProps('internet_provided', { type: 'checkbox' })}
                label={
                  <div>
                    <Group gap="xs" mb={4}>
                      <IconWifi size={18} color="var(--mantine-color-blue-6)" />
                      <Text fw={500}>Internet provided</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      WiFi or internet access is available for volunteers
                    </Text>
                  </div>
                }
              />
            </Card>

            <Card padding="md" withBorder>
              <Checkbox
                {...form.getInputProps('family_friendly', { type: 'checkbox' })}
                label={
                  <div>
                    <Group gap="xs" mb={4}>
                      <IconUsers size={18} color="var(--mantine-color-green-6)" />
                      <Text fw={500}>Family friendly</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Suitable for families with children
                    </Text>
                  </div>
                }
              />
            </Card>

            <Card padding="md" withBorder>
              <Checkbox
                {...form.getInputProps('pets_allowed', { type: 'checkbox' })}
                label={
                  <div>
                    <Group gap="xs" mb={4}>
                      <IconDog size={18} color="var(--mantine-color-orange-6)" />
                      <Text fw={500}>Pets allowed</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Volunteers can bring their pets
                    </Text>
                  </div>
                }
              />
            </Card>

            <Card padding="md" withBorder>
              <Checkbox
                {...form.getInputProps('smoking_allowed', { type: 'checkbox' })}
                label={
                  <div>
                    <Group gap="xs" mb={4}>
                      <IconSmoking size={18} color="var(--mantine-color-red-6)" />
                      <Text fw={500}>Smoking allowed</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Smoking is permitted on the property
                    </Text>
                  </div>
                }
              />
            </Card>
          </Stack>
        </div>

        {/* Navigation */}
        <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button
            type="button"
            onClick={onBack}
            variant="default"
          >
            ← Back
          </Button>
          <Button
            type="submit"
          >
            Next: Availability & Images →
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
