'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Container,
  Title,
  Text,
  Paper,
  Stepper,
  Alert,
  Box,
  Loader,
  Center,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { ProjectFormStep1 } from '@/components/projects/ProjectFormStep1';
import { ProjectFormStep2 } from '@/components/projects/ProjectFormStep2';
import { ProjectFormStep3 } from '@/components/projects/ProjectFormStep3';
import { ProjectFormStep4 } from '@/components/projects/ProjectFormStep4';
import { projectsService } from '@/services/projects';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

export function EditProjectClient() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const project = await projectsService.getProject(projectId);
        setFormData({
          title: project.title || '',
          description: project.description || '',
          projectType: (project.projectType as 'PERM' | 'NATB') || 'PERM',
          address: {
            street: project.address?.street || '',
            streetNumber: project.address?.streetNumber || '',
            city: project.address?.city || '',
            postalCode: project.address?.postalCode || '',
            countryCode: project.address?.country?.code || '',
            latitude: project.address?.latitude || 0,
            longitude: project.address?.longitude || 0,
            formattedAddress: project.address?.formattedAddress || '',
          },
          hoursPerDay: project.hoursPerDay || 5,
          daysPerWeek: project.daysPerWeek || 5,
          maxHelpers: project.maxHelpers || 2,
          accommodationDetails: project.accommodationDetails || '',
          foodDetails: project.foodDetails || '',
          skills: project.skills?.map((s: any) => s.code || s._id) || [],
          internetProvided: project.internetProvided || false,
          familyFriendly: project.familyFriendly || false,
          petsAllowed: project.petsAllowed || false,
          smokingAllowed: project.smokingAllowed || false,
          availabilities: [],
          images: [],
        });
      } catch (err) {
        setError(t('myProjects.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId, t]);

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
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await projectsService.updateProject(projectId, {
        title: formData.title,
        description: formData.description,
        hoursPerDay: formData.hoursPerDay,
        daysPerWeek: formData.daysPerWeek,
        maxHelpers: formData.maxHelpers,
        accommodationDetails: formData.accommodationDetails,
        foodDetails: formData.foodDetails,
        internetProvided: formData.internetProvided,
        familyFriendly: formData.familyFriendly,
        petsAllowed: formData.petsAllowed,
        smokingAllowed: formData.smokingAllowed,
      });

      // Upload new images if any
      if (formData.images.length > 0) {
        for (let i = 0; i < formData.images.length; i++) {
          const isCover = i === 0;
          await projectsService.uploadImage(projectId, formData.images[i], isCover);
        }
      }

      router.push('/my-projects');
    } catch (err: any) {
      setError(err.message || t('createProject.error.createFailed'));
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

  if (isLoading) {
    return (
      <Layout>
        <Center h="60vh">
          <Loader size="lg" color="eco-blue" />
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <Box bg="white" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Container size="md" py="xl">
          <Title order={1} mb="xs">{t('myProjects.editProject')}</Title>
          <Text c="dimmed">
            {t('myProjects.editProjectDesc')}
          </Text>
        </Container>
      </Box>

      <Container size="md" py="xl">
        {/* Stepper */}
        <Stepper
          active={currentStep}
          mb="xl"
          size="sm"
          color="eco-blue"
        >
          {stepLabels.map((_, index) => (
            <Stepper.Step key={index} />
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
              error={error}
            />
          )}
        </Paper>
      </Container>
    </Layout>
  );
}
