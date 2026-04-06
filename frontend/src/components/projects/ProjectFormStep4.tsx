'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DatePickerInput } from '@mantine/dates';
import {
  Stack,
  Title,
  Text,
  Button,
  Group,
  Card,
  FileButton,
  Image,
  Badge,
  ActionIcon,
  Alert,
  SimpleGrid,
  SegmentedControl,
  Tabs,
} from '@mantine/core';
import {
  IconCalendar,
  IconPhoto,
  IconX,
  IconAlertCircle,
  IconGripVertical,
  IconCalendarMonth,
} from '@tabler/icons-react';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

type MonthKey = typeof MONTH_KEYS[number];

type AvailabilityData = {
  year: number;
  january: boolean; february: boolean; march: boolean; april: boolean;
  may: boolean; june: boolean; july: boolean; august: boolean;
  september: boolean; october: boolean; november: boolean; december: boolean;
};

function emptyYear(year: number): AvailabilityData {
  return {
    year,
    january: false, february: false, march: false, april: false,
    may: false, june: false, july: false, august: false,
    september: false, october: false, november: false, december: false,
  };
}

function rangeToAvailabilities(start: Date, end: Date): AvailabilityData[] {
  const result: AvailabilityData[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = end.getFullYear();
  const endM = end.getMonth();

  while (y < endY || (y === endY && m <= endM)) {
    let entry = result.find(r => r.year === y);
    if (!entry) {
      entry = emptyYear(y);
      result.push(entry);
    }
    (entry as any)[MONTH_KEYS[m]] = true;
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return result;
}

interface ProjectFormStep4Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectFormStep4({
  data,
  onUpdate,
  onNext,
  onBack,
}: ProjectFormStep4Props) {
  const t = useTranslations();

  // Availability
  const [availMode, setAvailMode] = useState<'range' | 'months'>('range');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [availError, setAvailError] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const years = [currentYear, currentYear + 1, currentYear + 2];
  const [selectedYearTab, setSelectedYearTab] = useState(String(currentYear));

  // Month selection state per year
  const [monthsData, setMonthsData] = useState<AvailabilityData[]>(
    data.availabilities.length > 0
      ? data.availabilities
      : years.map(emptyYear)
  );

  const toggleMonth = (year: number, month: MonthKey) => {
    setMonthsData(prev => prev.map(y =>
      y.year === year ? { ...y, [month]: !y[month] } : y
    ));
  };

  // Images
  const [images, setImages] = useState<File[]>(data.images);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleImageUpload = (files: File[] | null) => {
    if (!files) return;
    const validFiles = files.filter(f =>
      f.type === 'image/png' || f.type === 'image/jpeg' || f.type === 'image/jpg'
    );
    const allImages = [...images, ...validFiles];
    if (allImages.length > 10) return;
    setImages(allImages);
    onUpdate({ images: allImages });
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviewUrls(newPreviews);
    onUpdate({ images: newImages });
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDragOverIndex(null); return; }
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    const [img] = newImages.splice(dragIndex, 1);
    const [url] = newPreviews.splice(dragIndex, 1);
    newImages.splice(index, 0, img);
    newPreviews.splice(index, 0, url);
    setImages(newImages);
    setPreviewUrls(newPreviews);
    onUpdate({ images: newImages });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleNext = () => {
    // Validate availability
    if (availMode === 'range') {
      if (!dateRange[0] || !dateRange[1]) {
        setAvailError(t('createProject.step4.availabilityRequired'));
        return;
      }
      const avails = rangeToAvailabilities(dateRange[0], dateRange[1]);
      onUpdate({ availabilities: avails });
    } else {
      const hasAny = monthsData.some(y => MONTH_KEYS.some(k => y[k]));
      if (!hasAny) {
        setAvailError(t('createProject.step4.availabilityRequired'));
        return;
      }
      onUpdate({ availabilities: monthsData.filter(y => MONTH_KEYS.some(k => y[k])) });
    }

    if (images.length < 5) return;
    setAvailError(null);
    onNext();
  };

  const monthLabels = [
    t('createProject.step4.monthLabels.jan'), t('createProject.step4.monthLabels.feb'),
    t('createProject.step4.monthLabels.mar'), t('createProject.step4.monthLabels.apr'),
    t('createProject.step4.monthLabels.may'), t('createProject.step4.monthLabels.jun'),
    t('createProject.step4.monthLabels.jul'), t('createProject.step4.monthLabels.aug'),
    t('createProject.step4.monthLabels.sep'), t('createProject.step4.monthLabels.oct'),
    t('createProject.step4.monthLabels.nov'), t('createProject.step4.monthLabels.dec'),
  ];

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="xs">{t('createProject.step4.title')}</Title>
        <Text c="dimmed">{t('createProject.step4.description')}</Text>
      </div>

      {/* Availability */}
      <Stack gap="md">
        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          {t('createProject.step4.availability')}
        </Text>

        <SegmentedControl
          value={availMode}
          onChange={(v) => { setAvailMode(v as 'range' | 'months'); setAvailError(null); }}
          data={[
            { label: t('createProject.step4.datesMode'), value: 'range' },
            { label: t('createProject.step4.monthsMode'), value: 'months' },
          ]}
          color="eco-primary"
          radius="md"
        />

        {availMode === 'range' ? (
          <DatePickerInput
            type="range"
            label={t('createProject.step4.dateRange')}
            placeholder={t('createProject.step4.dateRangePlaceholder')}
            value={dateRange}
            onChange={(v) => { setDateRange(v); setAvailError(null); }}
            numberOfColumns={2}
            size="md"
            leftSection={<IconCalendar size={18} />}
            minDate={new Date()}
            error={availError}
          />
        ) : (
          <Stack gap="sm">
            <Tabs value={selectedYearTab} onChange={(v) => setSelectedYearTab(v || String(currentYear))}>
              <Tabs.List>
                {years.map(y => (
                  <Tabs.Tab key={y} value={String(y)}>{y}</Tabs.Tab>
                ))}
              </Tabs.List>

              {years.map(y => {
                const yearData = monthsData.find(d => d.year === y) || emptyYear(y);
                const isCurrentYear = y === currentYear;
                return (
                  <Tabs.Panel key={y} value={String(y)} pt="md">
                    <SimpleGrid cols={4} spacing="xs">
                      {MONTH_KEYS.map((key, idx) => {
                        const isPast = isCurrentYear && idx < currentMonth;
                        if (isPast) return null;
                        const active = yearData[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { toggleMonth(y, key); setAvailError(null); }}
                            style={{
                              padding: '8px 4px',
                              borderRadius: 8,
                              border: '2px solid',
                              borderColor: active ? 'var(--mantine-color-eco-primary-6)' : 'var(--mantine-color-gray-3)',
                              backgroundColor: active ? 'var(--mantine-color-eco-primary-0)' : 'white',
                              color: active ? 'var(--mantine-color-eco-primary-8)' : 'var(--mantine-color-gray-7)',
                              fontWeight: active ? 600 : 400,
                              fontSize: 13,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {monthLabels[idx]}
                          </button>
                        );
                      })}
                    </SimpleGrid>
                  </Tabs.Panel>
                );
              })}
            </Tabs>
            {availError && <Text size="sm" c="red">{availError}</Text>}
          </Stack>
        )}
      </Stack>

      {/* Images */}
      <Stack gap="md">
        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          {t('createProject.step4.images')}
        </Text>
        <Text size="sm" c="dimmed">{t('createProject.step4.imagesMin')}</Text>

        {images.length < 10 && (
          <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/jpg" multiple>
            {(props) => (
              <Card
                {...props}
                withBorder
                padding="lg"
                style={{ cursor: 'pointer', borderStyle: 'dashed', borderWidth: 2, borderColor: '#d1d5db' }}
              >
                <Stack align="center" gap="xs">
                  <IconPhoto size={36} className="text-gray-400" />
                  <Text fw={500} size="sm">{t('createProject.step4.uploadButton')}</Text>
                  <Text size="xs" c="dimmed">{t('createProject.step4.uploadHint')}</Text>
                </Stack>
              </Card>
            )}
          </FileButton>
        )}

        {images.length > 0 && (
          <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="xs">
            {images.map((_, index) => (
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
                <Image src={previewUrls[index]} alt={`Preview ${index + 1}`} height={90} fit="cover" />
                {index === 0 && (
                  <Badge color="eco-primary" variant="filled" size="xs" style={{ position: 'absolute', top: 4, left: 4 }}>
                    {t('createProject.step4.cover')}
                  </Badge>
                )}
                <ActionIcon
                  color="red" variant="filled" size="xs" radius="xl"
                  style={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                >
                  <IconX size={12} />
                </ActionIcon>
                <Group gap={2} p={4} justify="center">
                  <IconGripVertical size={12} className="text-gray-400" />
                  <Text size="xs" c="dimmed">{index + 1}</Text>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {images.length < 5 && (
        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
          {t('createProject.step4.minImagesAlert')}
        </Alert>
      )}

      <Group justify="space-between" pt="md" className="border-t border-gray-200">
        <Button type="button" onClick={onBack} variant="default">
          {t('createProject.step4.back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={images.length < 5}
          color="eco-blue"
        >
          {t('createProject.step4.nextPreview')}
        </Button>
      </Group>
    </Stack>
  );
}
