'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Stack, Title, Text, Button, Group, Badge, Card, ActionIcon,
  SimpleGrid, Alert, Paper, ThemeIcon,
} from '@mantine/core';
import {
  IconCheck, IconMapPin, IconUsers, IconClock, IconHome, IconLeaf,
  IconWifi, IconBabyCarriage, IconDog, IconX, IconGripVertical,
  IconEye, IconArrowLeft,
} from '@tabler/icons-react';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

interface ProjectPreviewStepProps {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function ProjectPreviewStep({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
  error,
}: ProjectPreviewStepProps) {
  const t = useTranslations();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Generate object URLs from File objects
  useEffect(() => {
    const urls = data.images.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    setCurrentImg(0);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [data.images]);

  const isNatB = data.projectType === 'NATB';

  // Drag-to-reorder
  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };
  const handleDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    const newImages = [...data.images];
    const [img] = newImages.splice(dragIndex, 1);
    newImages.splice(i, 0, img);
    onUpdate({ images: newImages });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size={40} radius="md" color="eco-primary" variant="light">
          <IconEye size={22} />
        </ThemeIcon>
        <div>
          <Title order={2}>{t('createProject.step5.title')}</Title>
          <Text c="dimmed" size="sm">{t('createProject.step5.description')}</Text>
        </div>
      </Group>

      {/* Card Preview */}
      <Paper radius="xl" p={0} withBorder style={{ overflow: 'hidden', maxWidth: 380, margin: '0 auto', width: '100%' }}>
        {/* Image carousel */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {previewUrls.length > 0 ? (
            <>
              <div
                className="flex h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentImg * 100}%)` }}
              >
                {previewUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full flex-shrink-0 object-cover"
                    style={{ minWidth: '100%' }}
                  />
                ))}
              </div>
              {previewUrls.length > 1 && (
                <>
                  {currentImg > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentImg(i => Math.max(0, i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm z-10"
                    >
                      ‹
                    </button>
                  )}
                  {currentImg < previewUrls.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentImg(i => Math.min(previewUrls.length - 1, i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm z-10"
                    >
                      ›
                    </button>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {previewUrls.map((_, idx) => (
                      <span key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImg ? 'bg-white w-2' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <IconHome size={48} />
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-3 left-3 z-10">
            <Badge
              size="sm" radius="xl" variant="filled"
              color={isNatB ? 'eco-primary' : 'eco-terracotta'}
              leftSection={isNatB ? <IconHome size={12} /> : <IconLeaf size={12} />}
              tt="uppercase" fw={700}
              styles={{ root: { letterSpacing: '0.05em', fontSize: '0.65rem' } }}
            >
              {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
            </Badge>
          </div>
        </div>

        {/* Card content */}
        <Stack gap={4} p="md">
          <Text fw={700} size="lg" className="line-clamp-1">{data.title || '—'}</Text>
          <Group gap={4} wrap="nowrap">
            <IconMapPin size={14} className="text-gray-500 flex-shrink-0" />
            <Text size="sm" c="dimmed" className="truncate">
              {data.address.city || '—'}{data.address.countryCode ? `, ${data.address.countryCode}` : ''}
            </Text>
          </Group>
          <Group gap="md">
            <Group gap={4}>
              <IconUsers size={14} className="text-gray-500" />
              <Text size="sm" c="dimmed">{data.maxHelpers} {t('projects.volunteers')}</Text>
            </Group>
            <Group gap={4}>
              <IconClock size={14} className="text-gray-500" />
              <Text size="sm" c="dimmed">{data.hoursPerDay}h/{t('common.day')}</Text>
            </Group>
          </Group>
          <Group gap="xs" pt={4}>
            {data.internetProvided && (
              <Badge size="xs" variant="light" color="gray" leftSection={<IconWifi size={10} />} radius="xl">WiFi</Badge>
            )}
            {data.familyFriendly && (
              <Badge size="xs" variant="light" color="gray" leftSection={<IconBabyCarriage size={10} />} radius="xl">
                {t('projects.families')}
              </Badge>
            )}
            {data.petsAllowed && (
              <Badge size="xs" variant="light" color="gray" leftSection={<IconDog size={10} />} radius="xl">
                {t('projects.pets')}
              </Badge>
            )}
          </Group>
        </Stack>
      </Paper>

      {/* Reorder images */}
      <Stack gap="sm">
        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          {t('createProject.step5.reorderImages')}
        </Text>
        <Text size="xs" c="dimmed">{t('createProject.step5.reorderHint')}</Text>
        <SimpleGrid cols={{ base: 3, sm: 5 }} spacing="xs">
          {data.images.map((_, index) => (
            <Card
              key={index}
              padding={0}
              withBorder
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'relative', overflow: 'hidden', cursor: 'grab',
                opacity: dragIndex === index ? 0.5 : 1,
                outline: dragOverIndex === index ? '2px solid var(--mantine-color-eco-primary-6)' : 'none',
                outlineOffset: -2,
              }}
            >
              {previewUrls[index] && (
                <img src={previewUrls[index]} alt={`${index + 1}`} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
              )}
              {index === 0 && (
                <Badge color="eco-primary" variant="filled" size="xs" style={{ position: 'absolute', top: 4, left: 4 }}>
                  {t('createProject.step4.cover')}
                </Badge>
              )}
              <Group gap={2} p={4} justify="center">
                <IconGripVertical size={12} className="text-gray-400" />
                <Text size="xs" c="dimmed">{index + 1}</Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>

      {error && (
        <Alert color="red" variant="light" icon={<IconX size={18} />}>
          {error}
        </Alert>
      )}

      <Group justify="space-between" pt="md" className="border-t border-gray-200">
        <Button type="button" onClick={onBack} variant="default" leftSection={<IconArrowLeft size={16} />} disabled={isSubmitting}>
          {t('createProject.step5.back')}
        </Button>
        <Button
          onClick={onSubmit}
          loading={isSubmitting}
          color="eco-primary"
          leftSection={!isSubmitting ? <IconCheck size={18} /> : undefined}
        >
          {isSubmitting ? t('createProject.step4.creating') : t('createProject.step4.create')}
        </Button>
      </Group>
    </Stack>
  );
}
