'use client';

import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  IconMapPin,
  IconUsers,
  IconMap,
  IconList,
  IconClock,
  IconLayoutGrid,
  IconHome,
  IconLeaf,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconStar,
} from '@tabler/icons-react';
import {
  Text,
  Title,
  Group,
  Stack,
  Badge,
  Button,
  SimpleGrid,
  ActionIcon,
  Avatar,
  Loader,
} from '@mantine/core';
import { Layout } from '@/components/common/Layout';
import { ProjectsMap } from '@/components/projects/ProjectsMap';
import { ProjectFilters, defaultFilters, type ProjectFiltersState } from '@/components/projects/ProjectFilters';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import type { Project } from '@/types';
import { useProjects } from '@/hooks/useConvex';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { MobileProjectDetailModal } from '@/components/projects/MobileProjectDetailModal';

// Star Rating Component with percentage fill
const StarRating = memo(function StarRating({ rating: rawRating, size = 12 }: { rating: number | string; size?: number }) {
  const rating = Number(rawRating) || 0;
  const fullStars = Math.floor(rating);
  const partialFill = (rating - fullStars) * 100;

  return (
    <Stack align="center" gap={2}>
      <Text size="xs" fw={600} c="gray.7">{rating.toFixed(1)}</Text>
      <Group gap={2}>
        {[1, 2, 3, 4, 5].map((star) => {
          let fillPercentage = 0;
          if (star <= fullStars) {
            fillPercentage = 100;
          } else if (star === fullStars + 1) {
            fillPercentage = partialFill;
          }

          return (
            <div key={star} className="relative" style={{ width: size, height: size }}>
              <IconStar
                size={size}
                className="absolute text-gray-300"
                style={{ strokeWidth: 1.5 }}
              />
              <div
                className="absolute overflow-hidden"
                style={{ width: `${fillPercentage}%`, height: '100%' }}
              >
                <IconStar
                  size={size}
                  className="text-yellow-400 fill-yellow-400"
                  style={{ strokeWidth: 1.5 }}
                />
              </div>
            </div>
          );
        })}
      </Group>
    </Stack>
  );
});

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapRef {
  flyTo: (lat: number, lng: number) => void;
  resetView: () => void;
}

// Check if a project is within map bounds
function isProjectInBounds(project: Project, bounds: MapBounds | null): boolean {
  if (!bounds) return true;
  if (!project.address?.latitude || !project.address?.longitude) return false;

  const { latitude, longitude } = project.address;
  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

// Project Card Component - List view (enhanced with more info)
function ProjectCardList({
  project,
  isHovered,
  onHover,
}: {
  project: Project;
  isHovered: boolean;
  onHover: (project: Project | null) => void;
}) {
  const t = useTranslations();
  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.url || '')
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];
  const isNatB = project.projectType === 'NATB';

  return (
    <Link href={`/projects/${project._id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group cursor-pointer transition-all duration-200 ${isHovered ? 'bg-gray-50' : ''}`}
      onMouseEnter={() => onHover(project)}
      onMouseLeave={() => onHover(null)}
    >
      <Group gap="md" p="md" wrap="nowrap" align="flex-start" className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        {/* Image */}
        <div className="relative w-[200px] h-[150px] flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Favorite Button */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton projectId={project._id} variant="ghost" size="sm" />
          </div>

          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge
              size="xs"
              color={isNatB ? 'eco-primary' : 'eco-terracotta'}
              leftSection={isNatB ? <IconHome size={10} /> : <IconLeaf size={10} />}
            >
              {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <Stack gap="xs" className="flex-1 min-w-0 py-1">
          <Title order={4} className="group-hover:text-eco-primary transition-colors line-clamp-1">
            {project.title}
          </Title>

          <Group gap={4}>
            <IconMapPin size={14} className="flex-shrink-0 text-gray-500" />
            <Text size="sm" c="dimmed">{project.address?.city}, {project.address?.country?.name}</Text>
          </Group>

          <Text size="sm" c="dimmed" lineClamp={2}>
            {project.description}
          </Text>

          {/* Stats */}
          <Group gap="md">
            <Group gap={4}>
              <IconUsers size={14} />
              <Text size="sm" c="dimmed">{project.maxHelpers} {t('projects.volunteers')} max</Text>
            </Group>
            <Group gap={4}>
              <IconClock size={14} />
              <Text size="sm" c="dimmed">{project.hoursPerDay}h/{t('common.day')}</Text>
            </Group>
            <Text size="sm" c="dimmed">{project.daysPerWeek}{t('projects.daysPerWeekShort')}</Text>
          </Group>

          {/* Amenities */}
          <Group gap="xs">
            {project.internetProvided && (
              <Badge variant="light" color="eco-primary" size="xs" leftSection={<IconWifi size={12} />}>
                {t('projects.wifiIncluded')}
              </Badge>
            )}
            {project.familyFriendly && (
              <Badge variant="light" color="eco-primary" size="xs" leftSection={<IconBabyCarriage size={12} />}>
                {t('projects.familiesWelcome')}
              </Badge>
            )}
            {project.petsAllowed && (
              <Badge variant="light" color="eco-primary" size="xs" leftSection={<IconDog size={12} />}>
                {t('projects.petsAccepted')}
              </Badge>
            )}
          </Group>

          {/* host info */}
          {project.owner && (
            <Group gap="sm" pt="xs" className="border-t border-gray-100">
              {project.owner?.profilePictureUrl ? (
                <Image
                  src={project.owner?.profilePictureUrl}
                  alt={project.owner?.firstName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <Avatar size="sm" radius="xl" color="gray">
                  <IconUsers size={18} />
                </Avatar>
              )}
              <Stack gap={0}>
                <Text size="sm" fw={600}>{project.owner?.firstName}</Text>
                <Group gap={4}>
                  <IconStar size={13} className="text-yellow-400 fill-yellow-400" />
                  <Text size="xs" c="dimmed">{Number(project.owner?.averageRating || 0).toFixed(1)} ({project.owner?.reviewCount || 0} {t('projects.reviews')})</Text>
                </Group>
              </Stack>
            </Group>
          )}
        </Stack>
      </Group>
    </Link>
  );
}


const ITEMS_PER_PAGE = 18;

export function ProjectsPageClient() {
  const t = useTranslations();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [filters, setFilters] = useState<ProjectFiltersState>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const [isMapUpdating, setIsMapUpdating] = useState(false);
  const mapRef = useRef<MapRef | null>(null);
  const isProgrammaticMove = useRef(false);
  // Mobile modal state
  const [mobileModalProject, setMobileModalProject] = useState<Project | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
    setIsMapUpdating(false);
    isProgrammaticMove.current = false;
  }, []);

  const handleMoveStart = useCallback(() => {
    setIsMapUpdating(true);
    if (!isProgrammaticMove.current && filters.location) {
      setFilters(prev => ({ ...prev, location: null }));
    }
  }, [filters.location]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    isProgrammaticMove.current = true;
    setIsMapUpdating(true);
    mapRef.current?.flyTo(lat, lng);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters);
    // Reset map view to show all projects or default
    mapRef.current?.resetView();
    // Also clear programmatic flag
    isProgrammaticMove.current = true;
  }, []);

  const applyClientFilters = useCallback((projectList: Project[], f: ProjectFiltersState) => {
    return projectList.filter((project) => {
      // Project type
      if (f.projectType !== 'all' && project.projectType !== f.projectType) {
        return false;
      }
      // Location
      if (f.location) {
        const locationName = f.location.name.toLowerCase();
        const projectCity = project.address?.city?.toLowerCase() || '';
        const matchesLocation = locationName.includes(projectCity) || projectCity.includes(locationName.split(',')[0].toLowerCase());
        if (!matchesLocation) return false;
      }
      // Amenities
      if (f.internetProvided && !project.internetProvided) return false;
      if (f.familyFriendly && !project.familyFriendly) return false;
      if (f.petsAllowed && !project.petsAllowed) return false;
      if (f.smokingAllowed && !project.smokingAllowed) return false;
      if (f.accommodationProvided && !project.accommodationDetails) return false;
      if (f.foodProvided && !project.foodDetails) return false;
      // Work details
      if (project.hoursPerDay < f.hoursPerDay[0] || project.hoursPerDay > f.hoursPerDay[1]) return false;
      if (project.daysPerWeek < f.daysPerWeek[0] || project.daysPerWeek > f.daysPerWeek[1]) return false;

      if (f.maxHelpers[0] !== 1 || f.maxHelpers[1] !== 30) {
        if (project.maxHelpers < f.maxHelpers[0] || project.maxHelpers > f.maxHelpers[1]) return false;
      }

      // Skills
      if (f.skills.length > 0) {
        const projectSkillCodes = (project.skills || []).map((s: any) => typeof s === 'string' ? s : s.code);
        const hasMatchingSkill = f.skills.some(code => projectSkillCodes.includes(code));
        if (!hasMatchingSkill) return false;
      }

      // Languages
      if (f.languages && f.languages.length > 0) {
        const projectLanguageCodes = (project.languages || []).map((l: any) => typeof l === 'string' ? l : l.code);
        const hasMatchingLanguage = f.languages.some(code => projectLanguageCodes.includes(code));
        if (!hasMatchingLanguage) return false;
      }

      return true;
    });
  }, []);

  const filteredProjects = useMemo(() => {
    return applyClientFilters(projects || [], filters);
  }, [projects, filters, applyClientFilters]);

  const getFilteredCount = useCallback((tempFilters: ProjectFiltersState) => {
    return applyClientFilters(projects || [], tempFilters).length;
  }, [projects, applyClientFilters]);

  // Filter by map bounds for visible projects
  const visibleProjects = useMemo(() => {
    if (!mapBounds) return filteredProjects;
    return filteredProjects.filter(p => isProjectInBounds(p, mapBounds));
  }, [filteredProjects, mapBounds]);

  // Reset page when filters or visible projects change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, visibleProjects.length]);

  // Paginated projects
  const totalPages = Math.ceil(visibleProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = visibleProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Layout hideFooter>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          onLocationSelect={handleLocationSelect}
          onClear={handleClearFilters}
          resultCount={visibleProjects.length}
          getFilteredCount={getFilteredCount}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className={`${isMobile && showMap ? 'hidden' : 'w-full lg:w-[55%] xl:w-[50%]'} flex flex-col overflow-hidden bg-white border-r border-gray-200`}>
            {/* Sticky Header with Status Tabs */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
              <Group justify="space-between" px="md" py="xs">
                <Text size="xs" fw={500} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  {visibleProjects.length} {visibleProjects.length === 1 ? t('projects.foundSingle') : t('projects.found')}
                </Text>
                {/* Hide view toggle on mobile - grid only */}
                <Group gap={4} className="hidden sm:flex" p={4} bg="gray.1" style={{ borderRadius: 8 }}>
                  <ActionIcon
                    variant={viewMode === 'grid' ? 'white' : 'subtle'}
                    color="gray"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    aria-label={t('projects.viewGrid')}
                    aria-pressed={viewMode === 'grid'}
                  >
                    <IconLayoutGrid size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant={viewMode === 'list' ? 'white' : 'subtle'}
                    color="gray"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    aria-label={t('projects.viewList')}
                    aria-pressed={viewMode === 'list'}
                  >
                    <IconList size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </div>

            {/* Scrollable Project List */}
            <div className="flex-1 overflow-y-auto">
              {projectsLoading ? (
                <Stack align="center" justify="center" h="100%" ta="center" py="xl" px="lg">
                  <Loader size="lg" color="eco-primary" />
                  <Text size="sm" c="dimmed" mt="sm">{t('projects.loading')}</Text>
                </Stack>
              ) : visibleProjects.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md" p="md">
                      {paginatedProjects.map((project) => (
                        <ProjectCard
                          key={project._id}
                          project={project}
                          isHovered={hoveredProject?._id === project._id}
                          onHover={setHoveredProject}
                          onMobileClick={setMobileModalProject}
                        />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <div>
                      {paginatedProjects.map((project) => (
                        <ProjectCardList
                          key={project._id}
                          project={project}
                          isHovered={hoveredProject?._id === project._id}
                          onHover={setHoveredProject}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Group justify="center" gap="sm" py="md" className="border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="xs"
                        radius="lg"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {t('common.previous')}
                      </Button>
                      <Text size="sm" c="dimmed">
                        {currentPage} / {totalPages}
                      </Text>
                      <Button
                        variant="outline"
                        size="xs"
                        radius="lg"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {t('common.next')}
                      </Button>
                    </Group>
                  )}
                </>
              ) : (
                <Stack align="center" justify="center" h="100%" ta="center" py="xl" px="lg">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <IconMapPin size={32} className="text-gray-400" />
                  </div>
                  <Title order={4} className="font-display">{t('projects.noResults')}</Title>
                  <Text size="sm" c="dimmed" maw={300}>{t('projects.noResultsDesc')}</Text>
                  <Button
                    radius="xl"
                    color="eco-primary"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    {t('projects.clearFilters')}
                  </Button>
                </Stack>
              )}
            </div>
          </div>

          <div className={`${isMobile && !showMap ? 'hidden' : 'flex-1'} relative`}>
            {isMapUpdating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <Group gap="sm" px="md" py="xs" bg="white" style={{ borderRadius: 'var(--mantine-radius-xl)', boxShadow: 'var(--mantine-shadow-lg)' }}>
                  <Text size="sm" c="dimmed" fw={500}>{t('projects.loadingMap')}</Text>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-eco-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-eco-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-eco-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </Group>
              </div>
            )}
            <ProjectsMap
              ref={mapRef}
              projects={visibleProjects}
              allProjects={filteredProjects}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              onBoundsChange={handleBoundsChange}
              onMoveStart={handleMoveStart}
              hoveredProjectId={hoveredProject?._id}
            />
          </div>
        </div>

        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <Button
            radius="xl"
            size="md"
            color="dark"
            leftSection={showMap ? <IconList size={18} /> : <IconMap size={18} />}
            onClick={() => setShowMap(!showMap)}
            className="shadow-lg"
          >
            {showMap ? t('projects.viewList') : t('projects.viewMap')}
          </Button>
        </div>
      </div>

      {/* Mobile Project Detail Modal */}
      <MobileProjectDetailModal
        project={mobileModalProject}
        isOpen={mobileModalProject !== null}
        onClose={() => setMobileModalProject(null)}
      />
    </Layout>
  );
}
