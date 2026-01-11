import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
} from '@tabler/icons-react';
import { FavoriteButton } from '../common/FavoriteButton';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  isHovered?: boolean;
  onHover?: (project: Project | null) => void;
  initialFavorite?: boolean;
  showEdit?: boolean;
  onEdit?: (id: number) => void;
  showStatus?: boolean;
}

// Preload images hook for performance
function useImagePreloader(images: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Preload all images in background
    images.forEach((src) => {
      if (!loadedImages.has(src)) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(src));
        };
        img.src = src;
      }
    });
  }, [images]);

  return loadedImages;
}

// Memoized image component to prevent unnecessary re-renders
const CarouselImage = memo(({
  src,
  alt,
  isActive,
  isGroupHovered
}: {
  src: string;
  alt: string;
  isActive: boolean;
  isGroupHovered?: boolean;
}) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-out will-change-[opacity,transform] ${isActive
        ? 'opacity-100 z-[1]'
        : 'opacity-0 z-0'
      } ${isGroupHovered && isActive ? 'scale-105' : 'scale-100'}`}
    style={{
      transitionProperty: 'opacity, transform',
    }}
  />
));

CarouselImage.displayName = 'CarouselImage';

export function ProjectCard({
  project,
  isHovered = false,
  onHover,
  initialFavorite = false,
  showEdit = false,
  onEdit,
  showStatus = false,
}: ProjectCardProps) {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  // Preload all images for instant switching
  useImagePreloader(images);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleMouseEnter = useCallback(() => {
    setIsCardHovered(true);
    onHover?.(project);
  }, [onHover, project]);

  const handleMouseLeave = useCallback(() => {
    setIsCardHovered(false);
    onHover?.(null);
  }, [onHover]);

  const isNatB = project.project_type === 'NATB';

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`block group cursor-pointer transition-all duration-200 ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Optimized Image Carousel with stacked images */}
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-3 bg-gray-100">
        {/* Stack all images - only the active one is visible via opacity */}
        {images.map((imageSrc, idx) => (
          <CarouselImage
            key={imageSrc}
            src={imageSrc}
            alt={`${project.title} - Image ${idx + 1}`}
            isActive={idx === currentImageIndex}
            isGroupHovered={isCardHovered}
          />
        ))}

        {/* Favorite Button (Hidden if showEdit is true) */}
        {!showEdit && (
          <div className="absolute top-3 right-3 z-[5]">
            <FavoriteButton
              projectId={project.id}
              variant="ghost"
              size="md"
              initialFavorite={initialFavorite}
            />
          </div>
        )}

        {/* Edit Button */}
        {showEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.(project.id);
            }}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-gray-700 hover:text-eco-primary hover:bg-white shadow-sm transition-all"
          >
            <IconEdit size={18} />
          </button>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wider ${isNatB ? 'bg-eco-primary text-white' : 'bg-eco-terracotta text-white'
            }`}>
            {isNatB ? <IconHome size={10} /> : <IconLeaf size={10} />}
            {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
          </span>
        </div>

        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer z-10"
            >
              ›
            </button>

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
      <div className="space-y-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 group-hover:text-eco-primary transition-colors line-clamp-1 text-lg flex-1">
            {project.title}
          </h3>
          {showStatus && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-1 ${project.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
              {project.is_active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
            </span>
          )}
        </div>

        <div className="flex items-center text-gray-500 text-sm">
          <IconMapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate">{project.address?.city}, {project.address?.country?.name}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <IconUsers size={14} />
            {project.max_helpers} {t('projects.volunteers') || 'volunteers'}
          </span>
          <span className="flex items-center gap-1">
            <IconClock size={14} />
            {project.hours_per_day}h/{t('common.day') || 'day'}
          </span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {project.internet_provided && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              <IconWifi size={10} /> {t('projects.wifi')}
            </span>
          )}
          {project.family_friendly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              <IconBabyCarriage size={10} /> {t('projects.familyFriendly') || 'Family'}
            </span>
          )}
          {project.pets_allowed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              <IconDog size={10} /> {t('projects.petsAllowed') || 'Pets'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-3" />
      <div className="space-y-2 px-1">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
