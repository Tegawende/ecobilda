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
  Radio,
  Group,
  Card,
  Alert,
  List,
} from '@mantine/core';
import { IconPlant, IconHammer, IconBulb } from '@tabler/icons-react';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

interface Step1FormData {
  title: string;
  description: string;
  projectType: 'PERM' | 'NATB';
}

interface ProjectFormStep1Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
}

export function ProjectFormStep1({ data, onUpdate, onNext }: ProjectFormStep1Props) {
  const t = useTranslations();
  const form = useForm<Step1FormData>({
    initialValues: {
      title: data.title || '',
      description: data.description || '',
      projectType: data.projectType || 'PERM',
    },
    validate: {
      title: (value) => {
        if (value.length < 10) return t('createProject.step1.validation.titleMin');
        if (value.length > 200) return t('createProject.step1.validation.titleMax');
        return null;
      },
      description: (value) => {
        if (value.length < 50) return t('createProject.step1.validation.descriptionMin');
        if (value.length > 2000) return t('createProject.step1.validation.descriptionMax');
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
            {t('createProject.step1.title')}
          </Title>
          <Text c="dimmed">
            {t('createProject.step1.description')}
          </Text>
        </div>

        {/* Project Type */}
        <Radio.Group
          label={t('createProject.step1.projectType')}
          {...form.getInputProps('projectType')}
        >
          <Group mt="sm" grow>
            <Card
              padding="md"
              withBorder
              style={{
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: form.values.projectType === 'PERM' ? 'var(--mantine-color-eco-terracotta-5)' : undefined,
                backgroundColor: form.values.projectType === 'PERM' ? 'var(--mantine-color-eco-terracotta-0)' : undefined,
              }}
              onClick={() => form.setFieldValue('projectType', 'PERM')}
            >
              <Stack gap="xs" align="center">
                <IconPlant size={40} color="var(--mantine-color-green-6)" />
                <Text fw={600}>{t('createProject.step1.permaculture')}</Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('createProject.step1.permacultureDesc')}
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
                borderColor: form.values.projectType === 'NATB' ? 'var(--mantine-color-eco-terracotta-5)' : undefined,
                backgroundColor: form.values.projectType === 'NATB' ? 'var(--mantine-color-eco-terracotta-0)' : undefined,
              }}
              onClick={() => form.setFieldValue('projectType', 'NATB')}
            >
              <Stack gap="xs" align="center">
                <IconHammer size={40} color="var(--mantine-color-orange-6)" />
                <Text fw={600}>{t('createProject.step1.naturalBuilding')}</Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('createProject.step1.naturalBuildingDesc')}
                </Text>
                <Radio value="NATB" styles={{ root: { display: 'none' } }} />
              </Stack>
            </Card>
          </Group>
        </Radio.Group>

        {/* Title */}
        <TextInput
          label={t('createProject.step1.projectTitle')}
          placeholder={t('createProject.step1.projectTitlePlaceholder')}
          description={t('createProject.step1.projectTitleDescription')}
          {...form.getInputProps('title')}
        />

        {/* Description */}
        <Textarea
          label={t('createProject.step1.projectDescription')}
          placeholder={t('createProject.step1.projectDescriptionPlaceholder')}
          minRows={8}
          {...form.getInputProps('description')}
          description={
            <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--mantine-spacing-xs)' }}>
              <Text component="span" size="sm" c="dimmed">
                {t('createProject.step1.projectDescriptionHint')}
              </Text>
              <Text
                component="span"
                size="sm"
                c={
                  descriptionLength < 50 || descriptionLength > 2000
                    ? 'red'
                    : 'dimmed'
                }
              >
                {t('createProject.step1.projectDescriptionCounter', { count: descriptionLength })}
              </Text>
            </span>
          }
        />

        {/* Tips */}
        <Alert color="eco-terracotta" title={t('createProject.step1.tipsTitle')} icon={<IconBulb />}>
          <List size="sm">
            <List.Item>{t('createProject.step1.tip1')}</List.Item>
            <List.Item>{t('createProject.step1.tip2')}</List.Item>
            <List.Item>{t('createProject.step1.tip3')}</List.Item>
            <List.Item>{t('createProject.step1.tip4')}</List.Item>
          </List>
        </Alert>

        {/* Navigation */}
        <Group justify="flex-end" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button type="submit" color="eco-terracotta">
            {t('createProject.step1.next')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
