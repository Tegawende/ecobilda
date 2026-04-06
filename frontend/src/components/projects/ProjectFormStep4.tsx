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
  Divider,
} from '@mantine/core';
import {
  IconCalendar,
  IconPhoto,
  IconX,
  IconAlertCircle,
  IconCheck,
  IconMapPin,
  IconUsers,
  IconClock,
  IconHome,
  IconLeaf,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconChevronLeft,
  IconChevronRight,
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
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
  isEditing?: boolean;
}

export function ProjectFormStep4({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
  error,
  isEditing = false,
}: ProjectFormStep4Props) {
  const t = useTranslations();

  // Availability
  const [availMode, setAvailMode] = useState<'range' | 'months'>(
    data.availabilities.length > 0 ? 'months' : 'range'
  );
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [availError, setAvailError] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const years = [currentYear, currentYear + 1, currentYear + 2];
  const [selectedYearTab, setSelectedYearTab] = useState(String(currentYear));

  // Month selection state per year — pre-fill from existing data if present
  const [monthsData, setMonthsData] = useState<AvailabilityData[]>(() =>
    years.map(year => {
      const existing = data.availabilities.find(a => a.year === year);
      return existing ? { ...emptyYear(year), ...existing } : emptyYear(year);
    })
  );

  const toggleMonth = (year: number, month: MonthKey) => {
    setMonthsData(prev => prev.map(y =>
      y.year === year ? { ...y, [month]: !y[month] } : y
    ));
  };

  // Existing images (edit mode)
  const existingImages = data.existingImages ?? [];

  // Images (new uploads)
  const [images, setImages] = useState<File[]>(data.images);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentImg, setCurrentImg] = useState(0);

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
    setCurrentImg(0);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const totalImages = existingImages.length + images.length;
  const minImages = isEditing ? 1 : 5;

  const handleSubmit = () => {
    // Validate availability
    if (availMode === 'range') {
      if (!dateRange[0] || !dateRange[1]) {
        setAvailError(t('createProject.step4.availabilityRequired'));
        return;
      }
      onUpdate({ availabilities: rangeToAvailabilities(dateRange[0], dateRange[1]) });
    } else {
      const hasAny = monthsData.some(y => MONTH_KEYS.some(k => y[k]));
      if (!hasAny) {
        setAvailError(t('createProject.step4.availabilityRequired'));
        return;
      }
      onUpdate({ availabilities: monthsData.filter(y => MONTH_KEYS.some(k => y[k])) });
    }

    if (totalImages < minImages) return;
    setAvailError(null);
    onSubmit();
  };

  const isNatB = data.projectType === 'NATB';

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
          <Stack gap="md">
            {/* Year tabs — custom buttons to avoid Mantine Tabs click issues */}
            <Group gap="xs">
              {years.map(y => {
                const isActive = selectedYearTab === String(y);
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYearTab(String(y))}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 8,
                      border: '2px solid',
                      borderColor: isActive ? 'var(--mantine-color-eco-primary-6)' : 'var(--mantine-color-gray-3)',
                      backgroundColor: isActive ? 'var(--mantine-color-eco-primary-6)' : 'white',
                      color: isActive ? 'white' : 'var(--mantine-color-gray-7)',
                      fontWeight: isActive ? 700 : 400,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {y}
                  </button>
                );
              })}
            </Group>

            {/* Month grid for selected year — 6 per row */}
            {years.map(y => {
              if (String(y) !== selectedYearTab) return null;
              const yearData = monthsData.find(d => d.year === y) || emptyYear(y);
              const isCurrentYear = y === currentYear;
              return (
                <SimpleGrid key={y} cols={6} spacing="xs">
                  {MONTH_KEYS.map((key, idx) => {
                    const isPast = isCurrentYear && idx < currentMonth;
                    const active = yearData[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isPast}
                        onClick={() => { if (!isPast) { toggleMonth(y, key); setAvailError(null); } }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: '2px solid',
                          borderColor: active ? 'var(--mantine-color-eco-primary-6)' : isPast ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-gray-3)',
                          backgroundColor: active ? 'var(--mantine-color-eco-primary-0)' : isPast ? 'var(--mantine-color-gray-1)' : 'white',
                          color: active ? 'var(--mantine-color-eco-primary-8)' : isPast ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-gray-7)',
                          fontWeight: active ? 600 : 400,
                          fontSize: 13,
                          cursor: isPast ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {monthLabels[idx]}
                      </button>
                    );
                  })}
                </SimpleGrid>
              );
            })}

            {/* Summary */}
            {monthsData.some(y => MONTH_KEYS.some(k => y[k])) && (
              <Stack gap={4} pt={4}>
                {monthsData.map(y => {
                  const count = MONTH_KEYS.filter(k => y[k]).length;
                  if (count === 0) return null;
                  const selectedNames = MONTH_KEYS
                    .map((k, idx) => y[k] ? monthLabels[idx] : null)
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <Text key={y.year} size="sm" c="dimmed">
                      <Text span fw={600} c="eco-primary">{y.year}</Text>
                      {' — '}{count} {count === 1 ? t('createProject.step4.monthSingular') : t('createProject.step4.monthPlural')} : {selectedNames}
                    </Text>
                  );
                })}
              </Stack>
            )}

            {availError && <Text size="sm" c="red">{availError}</Text>}
          </Stack>
        )}
      </Stack>

      {/* Images */}
      <Stack gap="md">
        <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          {t('createProject.step4.images')}
        </Text>
        {!isEditing && <Text size="sm" c="dimmed">{t('createProject.step4.imagesMin')}</Text>}

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="xs">
            {existingImages.map((img, index) => (
              <Card key={index} padding={0} withBorder style={{ position: 'relative', overflow: 'hidden' }}>
                <Image src={img.url} alt={`Image ${index + 1}`} height={90} fit="cover" />
                {index === 0 && images.length === 0 && (
                  <Badge color="eco-primary" variant="filled" size="xs" style={{ position: 'absolute', top: 4, left: 4 }}>
                    {t('createProject.step4.cover')}
                  </Badge>
                )}
              </Card>
            ))}
          </SimpleGrid>
        )}

        {totalImages < 10 && (
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
              </Card>
            ))}
          </SimpleGrid>
        )}

        {images.length > 0 && (
          <Text size="xs" c="dimmed">
            {t('createProject.step4.imagesHint')}
          </Text>
        )}
      </Stack>

      {totalImages < minImages && (
        <Alert color="yellow" variant="light" icon={<IconAlertCircle size={18} />}>
          {t('createProject.step4.minImagesAlert')}
        </Alert>
      )}

      {/* Live Preview */}
      {images.length > 0 && (
        <>
          <Divider />
          <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {t('createProject.step5.title')}
            </Text>
            <Text size="sm" c="dimmed">{t('createProject.step5.description')}</Text>

            <div style={{ maxWidth: 260 }}>
              {/* Image carousel — same as ProjectCard */}
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-3 bg-gray-100">
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

                {/* Nav arrows — same as ProjectCard */}
                {previewUrls.length > 1 && (
                  <>
                    {currentImg > 0 && (
                      <button type="button" onClick={() => setCurrentImg(i => i - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800">
                        <IconChevronLeft size={18} />
                      </button>
                    )}
                    {currentImg < previewUrls.length - 1 && (
                      <button type="button" onClick={() => setCurrentImg(i => i + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800">
                        <IconChevronRight size={18} />
                      </button>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                      {previewUrls.map((_, idx) => (
                        <span key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImg ? 'bg-white w-2' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Card content — same as ProjectCard */}
              <Stack gap={4} px={4}>
                <Text fw={700} size="lg" c="dark" className="line-clamp-1">
                  {data.title || '—'}
                </Text>
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
            </div>
          </Stack>
        </>
      )}

      {error && (
        <Alert color="red" variant="light" icon={<IconX size={18} />}>
          {error}
        </Alert>
      )}

      <Group justify="space-between" pt="md" className="border-t border-gray-200">
        <Button type="button" onClick={onBack} variant="default" disabled={isSubmitting}>
          {t('createProject.step4.back')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={totalImages < minImages}
          loading={isSubmitting}
          color="eco-primary"
          leftSection={!isSubmitting ? <IconCheck size={18} /> : undefined}
        >
          {isEditing
            ? (isSubmitting ? t('createProject.step4.updating') : t('createProject.step4.update'))
            : (isSubmitting ? t('createProject.step4.creating') : t('createProject.step4.create'))
          }
        </Button>
      </Group>
    </Stack>
  );
}
