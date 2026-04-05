'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Paper,
  Progress,
  Group,
  Stepper,
  Alert,
  Box,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { ProjectFormStep1 } from '@/components/projects/ProjectFormStep1';
import { ProjectFormStep2 } from '@/components/projects/ProjectFormStep2';
import { ProjectFormStep3 } from '@/components/projects/ProjectFormStep3';
import { ProjectFormStep4 } from '@/components/projects/ProjectFormStep4';
import { projectsService } from '@/services/projects';

export interface ProjectFormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  projectType: 'PERM' | 'NATB';

  // Step 2: Location & Work
  address: {
    street: string;
    streetNumber: string;
    city: string;
    postalCode: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
  hoursPerDay: number;
  daysPerWeek: number;
  maxHelpers: number;
  accommodationDetails: string;
  foodDetails: string;

  // Step 3: Skills & Amenities
  skills: string[];
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;

  // Step 4: Availability
  availabilities: {
    year: number;
    january: boolean;
    february: boolean;
    march: boolean;
    april: boolean;
    may: boolean;
    june: boolean;
    july: boolean;
    august: boolean;
    september: boolean;
    october: boolean;
    november: boolean;
    december: boolean;
  }[];

  // Images
  images: File[];
}

export function CreateProjectClient() {
  const t = useTranslations();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    projectType: 'PERM',
    address: {
      street: '',
      streetNumber: '',
      city: '',
      postalCode: '',
      countryCode: '',
      latitude: 0,
      longitude: 0,
      formattedAddress: '',
    },
    hoursPerDay: 5,
    daysPerWeek: 5,
    maxHelpers: 2,
    accommodationDetails: '',
    foodDetails: '',
    skills: [],
    internetProvided: false,
    familyFriendly: false,
    petsAllowed: false,
    smokingAllowed: false,
    availabilities: [],
    images: [],
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const updateFormData = (data: Partial<ProjectFormData>) => {
    setFormData({ ...formData, ...data });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const projectPayload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        projectType: formData.projectType,
        address: formData.address,
        hoursPerDay: formData.hoursPerDay,
        daysPerWeek: formData.daysPerWeek,
        maxHelpers: formData.maxHelpers,
        accommodationDetails: formData.accommodationDetails,
        foodDetails: formData.foodDetails,
        skills: formData.skills,
        internetProvided: formData.internetProvided,
        familyFriendly: formData.familyFriendly,
        petsAllowed: formData.petsAllowed,
        smokingAllowed: formData.smokingAllowed,
      };

      const project = await projectsService.createProject(projectPayload as any);

      // Upload images if any
      if (formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const isCover = i === 0;
          await projectsService.uploadImage(project._id, formData.images[i], isCover);
        }
      }

      router.push(`/projects/${project._id}`);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.title?.[0] ||
        err.response?.data?.description?.[0] ||
        t('createProject.error.createFailed');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    t('createProject.steps.basicInfo'),
    t('createProject.steps.locationWork'),
    t('createProject.steps.skillsAmenities'),
    t('createProject.steps.availabilityImages'),
  ];

  return (
    <Layout>
      {/* Header */}
      <Box bg="white" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Container size="md" py="xl">
          <Title order={1} mb="xs">{t('createProject.title')}</Title>
          <Text c="dimmed">
            {t('createProject.subtitle')}
          </Text>
        </Container>
      </Box>

      <Container size="md" py="xl">
        {/* Progress */}
        <Box mb="xl">
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              {t('createProject.step', { current: currentStep + 1, total: totalSteps })}
            </Text>
            <Text size="sm" c="dimmed">
              {t('createProject.complete', { percent: Math.round(((currentStep + 1) / totalSteps) * 100) })}
            </Text>
          </Group>
          <Progress
            value={((currentStep + 1) / totalSteps) * 100}
            size="sm"
            radius="xl"
            color="eco-terracotta"
          />
        </Box>

        {/* Stepper */}
        <Stepper
          active={currentStep}
          mb="xl"
          size="sm"
          color="eco-terracotta"
        >
          {stepLabels.map((label, index) => (
            <Stepper.Step key={index} label={label} />
          ))}
        </Stepper>

        {/* Error Message */}
        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" mb="lg">
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Paper shadow="sm" p="xl" radius="md" withBorder mb="lg">
          {currentStep === 0 && (
            <ProjectFormStep1
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
            />
          )}

          {currentStep === 1 && (
            <ProjectFormStep2
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 2 && (
            <ProjectFormStep3
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <ProjectFormStep4
              data={formData}
              onUpdate={updateFormData}
              onSubmit={handleSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
        </Paper>

        {/* Step Label */}
        <Text ta="center" size="sm" c="dimmed">
          {stepLabels[currentStep]}
        </Text>
      </Container>
    </Layout>
  );
}
