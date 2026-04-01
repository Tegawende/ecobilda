'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Stack,
  Title,
  Text,
  Button,
  Group,
  Grid,
  Card,
  FileButton,
  Image,
  Badge,
  ActionIcon,
  Alert,
  List,
  SegmentedControl,
  SimpleGrid,
} from '@mantine/core';
import {
  IconCalendar,
  IconPhoto,
  IconX,
  IconSparkles,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons-react';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

interface ProjectFormStep4Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ProjectFormStep4({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: ProjectFormStep4Props) {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [images, setImages] = useState<File[]>(data.images);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const monthLabels = [
    t('createProject.step4.monthLabels.jan'),
    t('createProject.step4.monthLabels.feb'),
    t('createProject.step4.monthLabels.mar'),
    t('createProject.step4.monthLabels.apr'),
    t('createProject.step4.monthLabels.may'),
    t('createProject.step4.monthLabels.jun'),
    t('createProject.step4.monthLabels.jul'),
    t('createProject.step4.monthLabels.aug'),
    t('createProject.step4.monthLabels.sep'),
    t('createProject.step4.monthLabels.oct'),
    t('createProject.step4.monthLabels.nov'),
    t('createProject.step4.monthLabels.dec'),
  ];

  // Get or create availability for selected year
  const getCurrentAvailability = () => {
    const existing = data.availabilities.find((a) => a.year === selectedYear);
    if (existing) return existing;

    return {
      year: selectedYear,
      january: false,
      february: false,
      march: false,
      april: false,
      may: false,
      june: false,
      july: false,
      august: false,
      september: false,
      october: false,
      november: false,
      december: false,
    };
  };

  const toggleMonth = (month: string) => {
    const currentAvail = getCurrentAvailability();
    const newAvail = { ...currentAvail, [month]: !currentAvail[month as keyof typeof currentAvail] };

    const otherYears = data.availabilities.filter((a) => a.year !== selectedYear);
    onUpdate({ availabilities: [...otherYears, newAvail] });
  };

  const handleImageUpload = (files: File[] | null) => {
    if (!files) return;

    const allImages = [...images, ...files];

    // Limit to 10 images
    if (allImages.length > 10) {
      alert(t('createProject.step4.maxImagesAlert'));
      return;
    }

    setImages(allImages);
    onUpdate({ images: allImages });

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    setImages(newImages);
    setPreviewUrls(newPreviews);
    onUpdate({ images: newImages });

    // Revoke URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    [newImages[from], newImages[to]] = [newImages[to], newImages[from]];
    [newPreviews[from], newPreviews[to]] = [newPreviews[to], newPreviews[from]];
    setImages(newImages);
    setPreviewUrls(newPreviews);
    onUpdate({ images: newImages });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const availability = getCurrentAvailability();

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="md">
            {t('createProject.step4.title')}
          </Title>
          <Text c="dimmed">
            {t('createProject.step4.description')}
          </Text>
        </div>

        {/* Availability Calendar */}
        <div>
          <Group mb="sm">
            <IconCalendar size={20} color="var(--mantine-color-eco-terracotta-5)" />
            <Title order={3}>{t('createProject.step4.availability')}</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {t('createProject.step4.availabilityDescription')}
          </Text>

          {/* Year Selector */}
          <Group mb="md">
            <Text size="sm" fw={500}>
              {t('createProject.step4.year')}
            </Text>
            <SegmentedControl
              value={selectedYear.toString()}
              onChange={(value) => setSelectedYear(parseInt(value))}
              color="eco-terracotta"
              data={[
                { label: currentYear.toString(), value: currentYear.toString() },
                { label: (currentYear + 1).toString(), value: (currentYear + 1).toString() },
                { label: (currentYear + 2).toString(), value: (currentYear + 2).toString() },
              ]}
            />
          </Group>

          {/* Month Grid */}
          <Grid gutter="xs">
            {months.map((month, index) => {
              const isSelected = availability[month as keyof typeof availability];
              return (
                <Grid.Col key={month} span={{ base: 3, sm: 2 }}>
                  <Button
                    variant={isSelected ? 'filled' : 'default'}
                    color={isSelected ? 'eco-terracotta' : undefined}
                    fullWidth
                    onClick={() => toggleMonth(month)}
                    styles={{
                      root: {
                        borderWidth: 2,
                      },
                    }}
                  >
                    {monthLabels[index]}
                  </Button>
                </Grid.Col>
              );
            })}
          </Grid>

          <Text size="sm" c="dimmed" mt="xs">
            {t('createProject.step4.monthsSelected', { count: Object.values(availability).filter((v) => v === true).length, year: selectedYear })}
          </Text>
        </div>

        {/* Image Upload */}
        <div>
          <Group mb="sm">
            <IconPhoto size={20} color="var(--mantine-color-eco-terracotta-5)" />
            <Title order={3}>{t('createProject.step4.images')}</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {t('createProject.step4.imagesDescription')}
          </Text>

          {/* Upload Button */}
          {images.length < 10 && (
            <FileButton onChange={handleImageUpload} accept="image/*" multiple>
              {(props) => (
                <Card
                  {...props}
                  withBorder
                  padding="xl"
                  style={{
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                  }}
                >
                  <Stack align="center" gap="xs">
                    <IconPhoto size={48} color="var(--mantine-color-gray-6)" />
                    <Text fw={500}>{t('createProject.step4.uploadButton')}</Text>
                    <Text size="xs" c="dimmed">
                      {t('createProject.step4.uploadHint')}
                    </Text>
                  </Stack>
                </Card>
              )}
            </FileButton>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" mt="md">
              {images.map((image, index) => (
                <Card key={index} padding={0} withBorder style={{ position: 'relative' }}>
                  <Image
                    src={previewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    height={120}
                    fit="cover"
                  />
                  <Badge
                    color="gray"
                    variant="filled"
                    style={{ position: 'absolute', top: 8, left: 8 }}
                  >
                    {index + 1}
                  </Badge>
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => removeImage(index)}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                  <Group gap={4} p="xs" justify="space-between">
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveImage(index, index - 1)}
                    >
                      <IconArrowLeft size={14} />
                    </ActionIcon>
                    <Text size="xs" c="dimmed" truncate style={{ flex: 1, textAlign: 'center' }}>
                      {image.name}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, index + 1)}
                    >
                      <IconArrowRight size={14} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          )}

          <Text size="sm" c="dimmed" mt="xs">
            {t('createProject.step4.imagesUploaded', { count: images.length })}
          </Text>
        </div>

        {/* Summary */}
        <Alert color="green" title={t('createProject.step4.reviewTitle')} icon={<IconSparkles />}>
          <List size="sm" icon={<IconCheck size={16} />}>
            <List.Item>
              <span dangerouslySetInnerHTML={{ __html: t('createProject.step4.reviewProject', { type: data.project_type === 'PERM' ? t('createProject.step1.permaculture') : t('createProject.step1.naturalBuilding') }) }} />
            </List.Item>
            <List.Item>{t('createProject.step4.reviewTitleLabel', { title: data.title || t('createProject.step4.reviewNotSet') })}</List.Item>
            <List.Item>
              {t('createProject.step4.reviewLocation', { city: data.address.city || t('createProject.step4.reviewNotSet'), country: data.address.country_code || t('createProject.step4.reviewNotSet') })}
            </List.Item>
            <List.Item>
              {t('createProject.step4.reviewWork', { hours: data.hours_per_day, days: data.days_per_week, max: data.max_helpers })}
            </List.Item>
            <List.Item>{t('createProject.step4.reviewSkills', { count: data.skills.length })}</List.Item>
            <List.Item>{t('createProject.step4.reviewImages', { count: images.length })}</List.Item>
          </List>
        </Alert>

        {/* Navigation */}
        <Group justify="space-between" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            variant="default"
          >
            {t('createProject.step4.back')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            color="eco-terracotta"
            loading={isSubmitting}
            leftSection={!isSubmitting && <span>🚀</span>}
          >
            {isSubmitting ? t('createProject.step4.creating') : t('createProject.step4.create')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
