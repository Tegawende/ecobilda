import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { Layout } from '../components/common/Layout';
import { ProjectsMap } from '../components/projects/ProjectsMap';
import { ProjectFilters, defaultFilters, type ProjectFiltersState } from '../components/projects/ProjectFilters';
import { FavoriteButton } from '../components/common/FavoriteButton';
import { mockAllProjects } from '../data/mockData';
import type { Project } from '../types';
import { ProjectCard } from '../components/projects/ProjectCard';
import { MobileProjectDetailModal } from '../components/projects/MobileProjectDetailModal';

// Star Rating Component with percentage fill
const StarRating = memo(function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const partialFill = (rating - fullStars) * 100;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          let fillPercentage = 0;
          if (star <= fullStars) {
            fillPercentage = 100;
          } else if (star === fullStars + 1) {
            fillPercentage = partialFill;
          }

          return (
            <div key={star} className="relative" style={{ width: size, height: size }}>
              {/* Empty star (background) */}
              <IconStar
                size={size}
                className="absolute text-gray-300"
                style={{ strokeWidth: 1.5 }}
              />
              {/* Filled star with clip */}
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
      </div>
    </div>
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
  const { t } = useTranslation();
  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];
  const isNatB = project.project_type === 'NATB';

  return (
    <Link
      to={`/projects/${project.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group cursor-pointer transition-all duration-200 ${isHovered ? 'bg-gray-50' : ''}`}
      onMouseEnter={() => onHover(project)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
        {/* Image */}
        <div className="relative w-[200px] h-[150px] flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Favorite Button */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton projectId={project.id} variant="ghost" size="sm" />
          </div>

          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isNatB ? 'bg-eco-primary text-white' : 'bg-eco-terracotta text-white'
              }`}>
              {isNatB ? <IconHome size={10} /> : <IconLeaf size={10} />}
              {isNatB ? 'Construction' : 'Permaculture'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-1">
          {/* Title & Location */}
          <h3 className="font-semibold text-gray-900 text-lg group-hover:text-eco-primary transition-colors line-clamp-1 mb-1">
            {project.title}
          </h3>

          <div className="flex items-center text-gray-500 text-sm mb-2">
            <IconMapPin size={14} className="mr-1 flex-shrink-0" />
            <span>{project.address?.city}, {project.address?.country?.name}</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {project.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <IconUsers size={14} />
              {project.max_helpers} {t('projects.volunteers') || 'volunteers'} max
            </span>
            <span className="flex items-center gap-1">
              <IconClock size={14} />
              {project.hours_per_day}h/{t('common.day')}
            </span>
            <span>{project.days_per_week}j/semaine</span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-3">
            {project.internet_provided && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-eco-primary/10 text-eco-primary text-xs rounded-full font-medium">
                <IconWifi size={12} /> WiFi inclus
              </span>
            )}
            {project.family_friendly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-eco-primary/10 text-eco-primary text-xs rounded-full font-medium">
                <IconBabyCarriage size={12} /> Familles bienvenues
              </span>
            )}
            {project.pets_allowed && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-eco-primary/10 text-eco-primary text-xs rounded-full font-medium">
                <IconDog size={12} /> Animaux acceptés
              </span>
            )}
          </div>

          {/* host info */}
          {project.owner && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <img
                src={project.owner.profile_picture || undefined}
                alt={project.owner.first_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Hôte:</span>
                <span className="text-sm font-medium text-gray-900">{project.owner.first_name}</span>
              </div>
              {project.owner.average_rating && (
                <StarRating rating={project.owner.average_rating} size={14} />
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


export function ProjectsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ProjectFiltersState>(defaultFilters);
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

  const filteredProjects = useMemo(() => {
    return mockAllProjects.filter((project) => {
      if (filters.projectType !== 'all' && project.project_type !== filters.projectType) {
        return false;
      }
      if (filters.location) {
        const locationName = filters.location.name.toLowerCase();
        const projectCity = project.address?.city?.toLowerCase() || '';
        const matchesLocation = locationName.includes(projectCity) || projectCity.includes(locationName.split(',')[0].toLowerCase());
        if (!matchesLocation) return false;
      }
      if (filters.internetProvided && !project.internet_provided) return false;
      if (filters.familyFriendly && !project.family_friendly) return false;
      if (filters.petsAllowed && !project.pets_allowed) return false;
      if (filters.smokingAllowed && !project.smoking_allowed) return false;
      if (project.hours_per_day < filters.hoursPerDay[0] || project.hours_per_day > filters.hoursPerDay[1]) return false;
      if (project.days_per_week < filters.daysPerWeek[0] || project.days_per_week > filters.daysPerWeek[1]) return false;

      if (filters.maxHelpers[0] !== 1 || filters.maxHelpers[1] !== 20) {
        if (project.max_helpers < filters.maxHelpers[0] || project.max_helpers > filters.maxHelpers[1]) return false;
      }


      return true;
    });
  }, [filters]);

  const visibleProjects = useMemo(() => {
    return filteredProjects.filter((project) => isProjectInBounds(project, mapBounds));
  }, [filteredProjects, mapBounds]);

  return (
    <Layout hideFooter>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          onLocationSelect={handleLocationSelect}
          onClear={handleClearFilters}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className={`${isMobile && showMap ? 'hidden' : 'w-full lg:w-[55%] xl:w-[50%]'} flex flex-col overflow-hidden bg-white border-r border-gray-200`}>
            {/* Sticky Header with Status Tabs */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex flex-col">

              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  {visibleProjects.length} {visibleProjects.length === 1 ? t('projects.foundSingle') || 'projet trouvé' : t('projects.found') || 'projets trouvés'}
                </span>
                {/* Hide view toggle on mobile - grid only */}
                <div className="hidden sm:flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title={t('projects.viewGrid') || 'Vue grille'}
                  >
                    <IconLayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    title={t('projects.viewList') || 'Vue liste'}
                  >
                    <IconList size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Project List */}
            <div className="flex-1 overflow-y-auto">
              {visibleProjects.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    {visibleProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isHovered={hoveredProject?.id === project.id}
                        onHover={setHoveredProject}
                        onMobileClick={setMobileModalProject}
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {visibleProjects.map((project) => (
                      <ProjectCardList
                        key={project.id}
                        project={project}
                        isHovered={hoveredProject?.id === project.id}
                        onHover={setHoveredProject}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <IconMapPin size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-gray-900 mb-2">{t('projects.noResults')}</h3>
                  <p className="text-gray-500 text-sm max-w-xs mb-4">{t('projects.noResultsDesc')}</p>
                  <button
                    onClick={handleClearFilters}
                    className="px-5 py-2 rounded-full bg-eco-primary text-white text-sm font-semibold hover:bg-eco-primaryDark transition-all cursor-pointer"
                  >
                    {t('projects.clearFilters')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`${isMobile && !showMap ? 'hidden' : 'flex-1'} relative`}>
            {isMapUpdating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg">
                  <span className="text-sm text-gray-600 font-medium">{t('projects.loadingMap') || 'Chargement'}</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-eco-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-eco-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-eco-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <ProjectsMap
              ref={mapRef}
              projects={filteredProjects}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              onBoundsChange={handleBoundsChange}
              onMoveStart={handleMoveStart}
              hoveredProjectId={hoveredProject?.id}
            />
          </div>
        </div>

        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white font-semibold shadow-lg hover:bg-gray-800 transition-all cursor-pointer"
          >
            {showMap ? (
              <><IconList size={18} /> {t('projects.viewList') || 'Voir la liste'}</>
            ) : (
              <><IconMap size={18} /> {t('projects.viewMap') || 'Voir la carte'}</>
            )}
          </button>
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
