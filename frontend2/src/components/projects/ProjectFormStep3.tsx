'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { useTranslations, useLocale } from 'next-intl';
import { getSkillIcon } from '@/lib/skillIcons';
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
import { useSkills } from '@/hooks/useConvex';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';
import type { Skill } from '@/types';

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
  const t = useTranslations();
  const locale = useLocale();
  const getSkillName = (skill: Skill) => {
    const key = `display_name_${locale}` as keyof Skill;
    return (skill[key] as string) || skill.display_name_en;
  };
  const { skills: allSkills, isLoading: isLoadingSkills } = useSkills(data.project_type as "PERM" | "NATB" | undefined);

  const form = useForm<Step3FormData>({
    initialValues: {
      skills: data.skills || [],
      internet_provided: data.internet_provided || false,
      family_friendly: data.family_friendly || false,
      pets_allowed: data.pets_allowed || false,
      smoking_allowed: data.smoking_allowed || false,
    },
    validate: {
      skills: (value) => (value.length === 0 ? t('createProject.step3.validation.skillsRequired') : null),
    },
  });

  // Skills are now loaded reactively via useSkills hook

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
            {t('createProject.step3.title')}
          </Title>
          <Text c="dimmed">
            {t('createProject.step3.description')}
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
              {t('createProject.step3.skillsTitle', { type: data.project_type === 'PERM' ? t('createProject.step1.permaculture') : t('createProject.step1.naturalBuilding') })}
            </Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {t('createProject.step3.skillsDescription')}
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
                        borderColor: isSelected ? 'var(--mantine-color-eco-terracotta-5)' : undefined,
                        backgroundColor: isSelected ? 'var(--mantine-color-eco-terracotta-0)' : undefined,
                      }}
                      onClick={() => toggleSkill(skill.code)}
                    >
                      <Group wrap="nowrap" align="center">
                        {(() => { const SkillIcon = getSkillIcon(skill.icon); return <SkillIcon size={22} className={isSelected ? 'text-eco-terracotta' : 'text-gray-500'} style={{ flexShrink: 0 }} />; })()}
                        <Text fw={isSelected ? 600 : 500} size="sm" style={{ flex: 1 }}>
                          {getSkillName(skill)}
                        </Text>
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
            {t('createProject.step3.selected', { count: form.values.skills.length })}
          </Text>
        </div>

        {/* Amenities */}
        <div>
          <Group mb="sm">
            <ThemeIcon size="lg" color="yellow" variant="light">
              <IconStar size={20} />
            </ThemeIcon>
            <Title order={3}>{t('createProject.step3.amenities')}</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {t('createProject.step3.amenitiesDescription')}
          </Text>

          <Stack gap="sm">
            <Card padding="md" withBorder>
              <Checkbox
                {...form.getInputProps('internet_provided', { type: 'checkbox' })}
                label={
                  <div>
                    <Group gap="xs" mb={4}>
                      <IconWifi size={18} color="var(--mantine-color-eco-terracotta-5)" />
                      <Text fw={500}>{t('createProject.step3.internetProvided')}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {t('createProject.step3.internetProvidedDesc')}
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
                      <Text fw={500}>{t('createProject.step3.familyFriendly')}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {t('createProject.step3.familyFriendlyDesc')}
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
                      <Text fw={500}>{t('createProject.step3.petsAllowed')}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {t('createProject.step3.petsAllowedDesc')}
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
                      <Text fw={500}>{t('createProject.step3.smokingAllowed')}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {t('createProject.step3.smokingAllowedDesc')}
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
            {t('createProject.step3.back')}
          </Button>
          <Button
            type="submit"
            color="eco-terracotta"
          >
            {t('createProject.step3.next')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
