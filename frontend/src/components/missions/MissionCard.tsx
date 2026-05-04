'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Text, Group, Badge, Stack, ActionIcon, Skeleton } from '@mantine/core';
import {
  IconMapPin,
  IconUsers,
  IconCalendar,
  IconHome,
  IconSchool,
  IconCash,
  IconEdit,
  IconChevronLeft,
  IconChevronRight,
  IconTrash,
} from '@tabler/icons-react';
import { FavoriteButton } from '../common/FavoriteButton';
import type { Mission } from '@/types';

interface MissionCardProps {
  mission: Mission;
  isHovered?: boolean;
  onHover?: (mission: Mission | null) => void;
  initialFavorite?: boolean;
  showEdit?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (mission: Mission) => void;
  showStatus?: boolean;
  onMobileClick?: (mission: Mission) => void;
}

const CarouselImage = memo(({ src, alt, loaded }: { src: string; alt: string; loaded: boolean }) => (
  <div className="relative w-full h-full flex-shrink-0 bg-gray-100">
    {loaded && (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
        className="object-cover"
      />
    )}
  </div>
));
CarouselImage.displayName = 'CarouselImage';

function formatDateRange(start: string, end: string, locale: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    return `${fmt.format(s)} → ${fmt.format(e)}`;
  } catch {
    return `${start} → ${end}`;
  }
}

export function MissionCard({
  mission,
  isHovered = false,
  onHover,
  initialFavorite = false,
  showEdit = false,
  onEdit,
  onDelete,
  showStatus = false,
  onMobileClick,
}: MissionCardProps) {
  const t = useTranslations();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [maxLoadedIndex, setMaxLoadedIndex] = useState(0);
  const lastClickTime = useState<{ current: number }>({ current: 0 })[0];

  const images = mission.images && mission.images.length > 0
    ? mission.images.map((img) => img.url || '')
    : mission.coverImageUrl
      ? [mission.coverImageUrl]
      : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;
    setCurrentImageIndex((prev) => {
      const next = Math.min(prev + 1, images.length - 1);
      setMaxLoadedIndex((m) => Math.max(m, next));
      return next;
    });
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;
    setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleMouseEnter = useCallback(() => onHover?.(mission), [onHover, mission]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);

  const isFormation = mission.type === 'FORMATION';

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile && onMobileClick) {
      e.preventDefault();
      onMobileClick(mission);
    }
  }, [isMobile, onMobileClick, mission]);

  const locale = typeof window !== 'undefined' ? document.documentElement.lang || 'fr' : 'fr';
  const address = mission.project?.address;

  return (
    <Link
      href={`/missions/${mission._id}`}
      className={`block group cursor-pointer transition-all duration-200 ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-3 bg-gray-100">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {images.map((src, idx) => (
            <CarouselImage
              key={src + idx}
              src={src}
              alt={`${mission.title} - ${idx + 1}`}
              loaded={idx <= maxLoadedIndex}
            />
          ))}
        </div>

        {!showEdit && (
          <div className="absolute top-3 right-3 z-[5]">
            <FavoriteButton
              missionId={mission._id}
              variant="ghost"
              size="md"
              initialFavorite={initialFavorite}
            />
          </div>
        )}

        {showEdit && (
          <div className="absolute top-3 right-3 z-30 flex gap-1.5">
            {onDelete && (
              <ActionIcon
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(mission); }}
                variant="white"
                radius="xl"
                size="lg"
                className="text-red-500 hover:text-red-600 shadow-sm transition-all"
              >
                <IconTrash size={16} />
              </ActionIcon>
            )}
            <ActionIcon
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(mission._id); }}
              variant="white"
              radius="xl"
              size="lg"
              className="text-gray-700 hover:text-eco-primary shadow-sm transition-all"
            >
              <IconEdit size={18} />
            </ActionIcon>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <Badge
            size="sm"
            radius="xl"
            variant="filled"
            color={isFormation ? 'eco-terracotta' : 'eco-primary'}
            leftSection={isFormation ? <IconSchool size={12} /> : <IconHome size={12} />}
            tt="uppercase"
            fw={700}
            styles={{ root: { letterSpacing: '0.05em', fontSize: '0.65rem' } }}
          >
            {t(`missions.types.${mission.type}`)}
          </Badge>
          {isFormation && mission.priceEUR != null && (
            <Badge
              size="sm"
              radius="xl"
              variant="filled"
              color="dark"
              leftSection={<IconCash size={12} />}
              fw={700}
              styles={{ root: { fontSize: '0.65rem' } }}
            >
              {mission.priceEUR}€
            </Badge>
          )}
        </div>

        {images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800"
              >
                <IconChevronLeft size={18} />
              </button>
            )}
            {currentImageIndex < images.length - 1 && (
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800"
              >
                <IconChevronRight size={18} />
              </button>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-2' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Stack gap={4} px={4}>
        <Group justify="space-between" gap="xs" align="flex-start">
          <Text fw={700} size="sm" c="dark" className="group-hover:text-eco-primary transition-colors line-clamp-1" style={{ flex: 1 }}>
            {mission.title}
          </Text>
          {showStatus && (
            <Badge
              size="xs"
              radius="xl"
              variant="light"
              color={
                mission.status === 'PUBLISHED'
                  ? 'green'
                  : mission.status === 'IN_PROGRESS'
                    ? 'blue'
                    : mission.status === 'COMPLETED'
                      ? 'gray'
                      : mission.status === 'CANCELLED'
                        ? 'red'
                        : 'yellow'
              }
              tt="uppercase"
              fw={700}
              mt={4}
              styles={{ root: { flexShrink: 0 } }}
            >
              {t(`missions.status.${mission.status}`)}
            </Badge>
          )}
        </Group>

        {address?.city && (
          <Group gap={4} wrap="nowrap">
            <IconMapPin size={14} className="text-gray-500 flex-shrink-0" />
            <Text size="sm" c="dimmed" className="truncate">
              {address.city}{address.country?.name ? `, ${address.country.name}` : ''}
            </Text>
          </Group>
        )}

        <Group gap={4} wrap="nowrap">
          <IconCalendar size={14} className="text-gray-500 flex-shrink-0" />
          <Text size="sm" c="dimmed" className="truncate">
            {formatDateRange(mission.startDate, mission.endDate, locale)}
          </Text>
        </Group>

        <Group gap="md">
          <Group gap={4}>
            <IconUsers size={14} className="text-gray-500" />
            <Text size="sm" c="dimmed">
              {mission.maxParticipants} {t('missions.helpers')}
            </Text>
          </Group>
          <Badge size="xs" variant="light" color="gray" radius="xl">
            {t(`missions.difficulty.${mission.difficulty}`)}
          </Badge>
        </Group>

        {mission.poste && (
          <Group gap={6} pt={4}>
            <Badge size="xs" variant="filled" color="eco-primary" radius="xl">
              {t(`missions.poste.${mission.poste}`)}
            </Badge>
            {mission.technique && (
              <Badge size="xs" variant="light" color="eco-primary" radius="xl">
                {t(`missions.technique.${mission.technique}`)}
              </Badge>
            )}
          </Group>
        )}
      </Stack>
    </Link>
  );
}

export function MissionCardSkeleton() {
  return (
    <Stack gap="xs">
      <Skeleton h={0} className="aspect-[4/3]" radius="xl" />
      <Stack gap="xs" px={4}>
        <Skeleton h={20} w="75%" radius="sm" />
        <Skeleton h={16} w="50%" radius="sm" />
        <Group gap="md">
          <Skeleton h={16} w={80} radius="sm" />
          <Skeleton h={16} w={80} radius="sm" />
        </Group>
      </Stack>
    </Stack>
  );
}
