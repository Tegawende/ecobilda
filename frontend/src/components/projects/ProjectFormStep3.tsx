'use client';

import { useForm } from '@mantine/form';
import { useTranslations, useLocale } from 'next-intl';
import { getSkillIcon } from '@/lib/skillIcons';
import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Card,
  Grid,
  Skeleton,
} from '@mantine/core';
import {
  IconLeaf,
  IconHome,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconSmoking,
  IconCheck,
} from '@tabler/icons-react';
import { useSkills } from '@/hooks/useConvex';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';
import { getSkillDisplayName, type Skill } from '@/types';

interface Step3FormData {
  skills: string[];
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
}

interface ProjectFormStep3Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectFormStep3({ data, onUpdate, onNext, onBack }: ProjectFormStep3Props) {
  const t = useTranslations();
  const locale = useLocale();
  const { skills: allSkills, isLoading: isLoadingSkills } = useSkills(data.projectType as "PERM" | "NATB" | undefined);

  const form = useForm<Step3FormData>({
    initialValues: {
      skills: data.skills || [],
      internetProvided: data.internetProvided || false,
      familyFriendly: data.familyFriendly || false,
      petsAllowed: data.petsAllowed || false,
      smokingAllowed: data.smokingAllowed || false,
    },
    validate: {
      skills: (value) => (value.length === 0 ? t('createProject.step3.validation.skillsRequired') : null),
    },
  });

  const toggleSkill = (skillCode: string) => {
    const currentSkills = form.values.skills;
    if (currentSkills.includes(skillCode)) {
      form.setFieldValue('skills', currentSkills.filter((s) => s !== skillCode));
    } else {
      form.setFieldValue('skills', [...currentSkills, skillCode]);
    }
  };

  const toggleAmenity = (field: keyof Step3FormData) => {
    form.setFieldValue(field, !form.values[field]);
  };

  const handleFormSubmit = (formData: Step3FormData) => {
    onUpdate(formData);
    onNext();
  };

  const color = data.projectType === 'NATB' ? '#70A771' : '#c9696b';

  const renderSkillCard = (skill: Skill) => {
    const isSelected = form.values.skills.includes(skill.code);
    const SkillIcon = getSkillIcon(skill.icon);
    return (
      <Grid.Col key={skill.code} span={{ base: 6, sm: 4, md: 3 }}>
        <Card
          padding="md"
          withBorder
          h="100%"
          style={{
            cursor: 'pointer',
            borderWidth: 2,
            borderColor: isSelected ? color : '#e5e7eb',
            backgroundColor: isSelected ? `${color}15` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 64,
            transition: 'all 0.15s ease',
          }}
          onClick={() => toggleSkill(skill.code)}
        >
          <Group wrap="nowrap" justify="center" w="100%">
            <SkillIcon size={22} style={{ flexShrink: 0, color: isSelected ? color : '#6b7280' }} />
            <Text size="sm" ta="center" fw={isSelected ? 600 : 400} style={{ color: isSelected ? color : '#4b5563' }}>
              {getSkillDisplayName(skill, locale)}
            </Text>
          </Group>
        </Card>
      </Grid.Col>
    );
  };

  const amenities = [
    { key: 'internetProvided' as const, icon: IconWifi, label: t('createProject.step3.internetProvided'), desc: t('createProject.step3.internetProvidedDesc') },
    { key: 'familyFriendly' as const, icon: IconBabyCarriage, label: t('createProject.step3.familyFriendly'), desc: t('createProject.step3.familyFriendlyDesc') },
    { key: 'petsAllowed' as const, icon: IconDog, label: t('createProject.step3.petsAllowed'), desc: t('createProject.step3.petsAllowedDesc') },
    { key: 'smokingAllowed' as const, icon: IconSmoking, label: t('createProject.step3.smokingAllowed'), desc: t('createProject.step3.smokingAllowedDesc') },
  ];

  return (
    <form onSubmit={form.onSubmit(handleFormSubmit, () => {
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    })}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs">
            {t('createProject.step3.title')}
          </Title>
          <Text c="dimmed">
            {t('createProject.step3.description')}
          </Text>
        </div>

        {/* Skills Selection */}
        <Stack gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {t('createProject.step3.skillsTitle', { type: data.projectType === 'PERM' ? t('createProject.step1.permaculture') : t('createProject.step1.naturalBuilding') })}
          </Text>
          <Text size="sm" c="dimmed">
            {t('createProject.step3.skillsDescription')}
          </Text>

          {isLoadingSkills ? (
            <Grid gutter="xs">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid.Col key={i} span={{ base: 6, sm: 4, md: 3 }}>
                  <Skeleton height={64} radius="md" />
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Grid gutter="xs">
              {allSkills.map((skill) => renderSkillCard(skill))}
            </Grid>
          )}

          {form.errors.skills && (
            <Text size="sm" c="red">{form.errors.skills}</Text>
          )}
          <Text size="sm" c="dimmed">
            {t('createProject.step3.selected', { count: form.values.skills.length })}
          </Text>
        </Stack>

        {/* Amenities */}
        <Stack gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {t('createProject.step3.amenities')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('createProject.step3.amenitiesDescription')}
          </Text>

          <Grid gutter="sm">
            {amenities.map((amenity) => {
              const isActive = form.values[amenity.key] as boolean;
              return (
                <Grid.Col key={amenity.key} span={{ base: 12, sm: 6 }}>
                  <Card
                    padding="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      borderWidth: 2,
                      borderColor: isActive ? '#70A771' : '#e5e7eb',
                      backgroundColor: isActive ? '#70A77115' : undefined,
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => toggleAmenity(amenity.key)}
                  >
                    <Group wrap="nowrap" justify="space-between">
                      <Group wrap="nowrap" gap="sm">
                        <amenity.icon size={22} style={{ flexShrink: 0, color: '#6b7280' }} />
                        <div>
                          <Text fw={500} size="sm">{amenity.label}</Text>
                          <Text size="xs" c="dimmed">{amenity.desc}</Text>
                        </div>
                      </Group>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        border: `2px solid ${isActive ? '#70A771' : '#d1d5db'}`,
                        backgroundColor: isActive ? '#70A771' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s ease',
                      }}>
                        {isActive && <IconCheck size={14} color="white" />}
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        </Stack>

        {/* Navigation */}
        <Group justify="space-between" pt="md" className="border-t border-gray-200">
          <Button type="button" onClick={onBack} variant="default">
            {t('createProject.step3.back')}
          </Button>
          <Button type="submit" color="eco-blue">
            {t('createProject.step3.next')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
