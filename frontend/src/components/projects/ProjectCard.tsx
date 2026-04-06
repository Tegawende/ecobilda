'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Text, Group, Badge, Stack, ActionIcon, Skeleton } from '@mantine/core';
import {
  IconMapPin,
  IconUsers,
  IconClock,
  IconHome,
  IconLeaf,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconEdit,
  IconChevronLeft,
  IconChevronRight,
  IconTrash,
} from '@tabler/icons-react';
import { FavoriteButton } from '../common/FavoriteButton';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  isHovered?: boolean;
  onHover?: (project: Project | null) => void;
  initialFavorite?: boolean;
  showEdit?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (project: Project) => void;
  showStatus?: boolean;
  /** Called on mobile clicks instead of navigation */
  onMobileClick?: (project: Project) => void;
}

// Memoized image component for carousel slide
const CarouselImage = memo(({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => (
  <div className="relative w-full h-full flex-shrink-0">
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover"
    />
  </div>
));

CarouselImage.displayName = 'CarouselImage';

export function ProjectCard({
  project,
  isHovered = false,
  onHover,
  initialFavorite = false,
  showEdit = false,
  onEdit,
  onDelete,
  showStatus = false,
  onMobileClick,
}: ProjectCardProps) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const t = useTranslations();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const lastClickTime = useState<{ current: number }>({ current: 0 })[0];

  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.url || '')
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Throttle clicks (300ms) to prevent double-skipping or ghost clicks on mobile
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;

    // Finite navigation - don't go past last image
    setCurrentImageIndex((prev) => Math.min(prev + 1, images.length - 1));
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Throttle clicks (300ms)
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;

    // Finite navigation - don't go before first image
    setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
  }, [images.length]);

  const handleMouseEnter = useCallback(() => {
    onHover?.(project);
  }, [onHover, project]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  const isNatB = project.projectType === 'NATB';

  // Handle click - use modal on mobile if callback provided
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile && onMobileClick) {
      e.preventDefault();
      onMobileClick(project);
    }
  }, [isMobile, onMobileClick, project]);

  return (
    <Link href={`/projects/${project._id}`}
      className={`block group cursor-pointer transition-all duration-200 ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Sliding Image Carousel */}
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-3 bg-gray-100">
        {/* Horizontal image strip with slide animation */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {images.map((imageSrc, idx) => (
            <CarouselImage
              key={imageSrc}
              src={imageSrc}
              alt={`${project.title} - Image ${idx + 1}`}
            />
          ))}
        </div>

        {/* Favorite Button (Hidden if showEdit is true) */}
        {!showEdit && (
          <div className="absolute top-3 right-3 z-[5]">
            <FavoriteButton
              projectId={project._id}
              variant="ghost"
              size="md"
              initialFavorite={initialFavorite}
            />
          </div>
        )}

        {/* Edit + Delete buttons */}
        {showEdit && (
          <div className="absolute top-3 right-3 z-30 flex gap-1.5">
            {onDelete && (
              <ActionIcon
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(project); }}
                variant="white"
                radius="xl"
                size="lg"
                className="text-red-500 hover:text-red-600 shadow-sm transition-all"
              >
                <IconTrash size={16} />
              </ActionIcon>
            )}
            <ActionIcon
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(project._id); }}
              variant="white"
              radius="xl"
              size="lg"
              className="text-gray-700 hover:text-eco-primary shadow-sm transition-all"
            >
              <IconEdit size={18} />
            </ActionIcon>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge
            size="sm"
            radius="xl"
            variant="filled"
            color={isNatB ? 'eco-primary' : 'eco-terracotta'}
            leftSection={isNatB ? <IconHome size={12} /> : <IconLeaf size={12} />}
            tt="uppercase"
            fw={700}
            styles={{ root: { letterSpacing: '0.05em', fontSize: '0.65rem' } }}
          >
            {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
          </Badge>
        </div>

        {/* Image Navigation - Show only when not at boundary */}
        {images.length > 1 && (
          <>
            {/* Previous button - hidden on first image */}
            {currentImageIndex > 0 && (
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800"
              >
                <IconChevronLeft size={18} />
              </button>
            )}
            {/* Next button - hidden on last image */}
            {currentImageIndex < images.length - 1 && (
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10 shadow-sm text-gray-800"
              >
                <IconChevronRight size={18} />
              </button>
            )}

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-2' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <Stack gap={4} px={4}>
        <Group justify="space-between" gap="xs" align="flex-start">
          <Text fw={700} size="lg" c="dark" className="group-hover:text-eco-primary transition-colors line-clamp-1" style={{ flex: 1 }}>
            {project.title}
          </Text>
          {showStatus && (
            <Badge
              size="xs"
              radius="xl"
              variant="light"
              color={project.status === 'PENDING' ? 'yellow' : project.isActive ? 'green' : 'gray'}
              tt="uppercase"
              fw={700}
              mt={4}
              styles={{ root: { flexShrink: 0 } }}
            >
              {project.status === 'PENDING'
                ? t('common.pending')
                : project.isActive
                ? t('common.active')
                : t('common.inactive')}
            </Badge>
          )}
        </Group>

        <Group gap={4} wrap="nowrap">
          <IconMapPin size={14} className="text-gray-500 flex-shrink-0" />
          <Text size="sm" c="dimmed" className="truncate">{project.address?.city}, {project.address?.country?.name}</Text>
        </Group>

        <Group gap="md">
          <Group gap={4}>
            <IconUsers size={14} className="text-gray-500" />
            <Text size="sm" c="dimmed">
              {project.maxHelpers} {t('projects.volunteers')}
            </Text>
          </Group>
          <Group gap={4}>
            <IconClock size={14} className="text-gray-500" />
            <Text size="sm" c="dimmed">
              {project.hoursPerDay}h/{t('common.day')}
            </Text>
          </Group>
        </Group>

        {/* Amenities */}
        <Group gap="xs" pt={4}>
          {project.internetProvided && (
            <Badge size="xs" variant="light" color="gray" leftSection={<IconWifi size={10} />} radius="xl">
              {t('projects.wifi')}
            </Badge>
          )}
          {project.familyFriendly && (
            <Badge size="xs" variant="light" color="gray" leftSection={<IconBabyCarriage size={10} />} radius="xl">
              {t('projects.familyFriendly')}
            </Badge>
          )}
          {project.petsAllowed && (
            <Badge size="xs" variant="light" color="gray" leftSection={<IconDog size={10} />} radius="xl">
              {t('projects.petsAllowed')}
            </Badge>
          )}
        </Group>
      </Stack>
    </Link>
  );
}

export function ProjectCardSkeleton() {
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
