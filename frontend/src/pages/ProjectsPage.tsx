import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconMapPin,
  IconUsers,
  IconHeart,
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
import { mockAllProjects } from '../data/mockData';
import type { Project } from '../types';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapRef {
  flyTo: (lat: number, lng: number) => void;
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

// Project Card Component - Grid view (3 per row, more info)
function ProjectCardGrid({
  project,
  isHovered,
  onHover,
}: {
  project: Project;
  isHovered: boolean;
  onHover: (project: Project | null) => void;
}) {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const isNatB = project.project_type === 'NATB';

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`block group cursor-pointer transition-all duration-200 ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={() => onHover(project)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Image Carousel */}
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-3">
        <img
          src={images[currentImageIndex]}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isFavorite
              ? 'bg-white text-eco-terracotta'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-eco-terracotta'
            }`}
        >
          <IconHeart size={18} className={isFavorite ? 'fill-current' : ''} />
        </button>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${isNatB ? 'bg-eco-primary text-white' : 'bg-eco-terracotta text-white'
            }`}>
            {isNatB ? <IconHome size={12} /> : <IconLeaf size={12} />}
            {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
          </span>
        </div>

        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer"
            >
              ›
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-eco-primary transition-colors line-clamp-1">
          {project.title}
        </h3>

        <div className="flex items-center text-gray-500 text-sm">
          <IconMapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate">{project.address?.city}, {project.address?.country?.name}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <IconUsers size={14} />
            {project.max_helpers} max
          </span>
          <span className="flex items-center gap-1">
            <IconClock size={14} />
            {project.hours_per_day}h/{t('common.day')}
          </span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {project.internet_provided && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              <IconWifi size={10} /> WiFi
            </span>
          )}
          {project.family_friendly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              <IconBabyCarriage size={10} /> Famille
            </span>
          )}
          {project.pets_allowed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              <IconDog size={10} /> Animaux
            </span>
          )}
        </div>
      </div>
    </Link>
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
  const [isFavorite, setIsFavorite] = useState(false);

  const images = project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const isNatB = project.project_type === 'NATB';

  return (
    <Link
      to={`/projects/${project.id}`}
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
          <button
            onClick={toggleFavorite}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isFavorite
                ? 'bg-white text-eco-terracotta'
                : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
          >
            <IconHeart size={16} className={isFavorite ? 'fill-current' : ''} />
          </button>

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
              {project.max_helpers} volontaires max
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

          {/* Skills */}
          {project.skills && project.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.skills.slice(0, 4).map((skill, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {skill.display_name_fr || skill.display_name_en}
                </span>
              ))}
              {project.skills.length > 4 && (
                <span className="px-2 py-0.5 text-gray-500 text-xs">
                  +{project.skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Host Info */}
          {project.owner && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <img
                src={project.owner.profile_picture || undefined}
                alt={project.owner.first_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-sm">
                <span className="text-gray-600">Hôte: </span>
                <span className="font-medium text-gray-900">{project.owner.first_name}</span>
                {project.owner.average_rating && (
                  <span className="ml-2 text-gray-500">
                    <IconStar size={12} className="inline text-yellow-500" />
                    {project.owner.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
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
  const mapRef = useRef<MapRef | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  // Handle location select from autocomplete
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo(lat, lng);
  }, []);

  // Filter projects based on filters (NOT map bounds for initial filtering)
  const filteredProjects = useMemo(() => {
    return mockAllProjects.filter((project) => {
      // Type filter
      if (filters.projectType !== 'all' && project.project_type !== filters.projectType) {
        return false;
      }

      // Location filter - only filter by selected location city
      if (filters.location) {
        const matchesCity = project.address?.city?.toLowerCase() === filters.location.city.toLowerCase();
        if (!matchesCity) return false;
      }

      // Amenity filters (now simple booleans - only filter if true)
      if (filters.internetProvided && !project.internet_provided) {
        return false;
      }
      if (filters.familyFriendly && !project.family_friendly) {
        return false;
      }
      if (filters.petsAllowed && !project.pets_allowed) {
        return false;
      }
      if (filters.smokingAllowed && !project.smoking_allowed) {
        return false;
      }

      // Hours per day filter
      if (project.hours_per_day < filters.hoursPerDay[0] || project.hours_per_day > filters.hoursPerDay[1]) {
        return false;
      }

      // Days per week filter
      if (project.days_per_week < filters.daysPerWeek[0] || project.days_per_week > filters.daysPerWeek[1]) {
        return false;
      }

      // Max helpers filter
      if (project.max_helpers < filters.maxHelpers[0] || project.max_helpers > filters.maxHelpers[1]) {
        return false;
      }

      return true;
    });
  }, [filters]);

  // Projects visible on map (filtered by bounds)
  const visibleProjects = useMemo(() => {
    return filteredProjects.filter((project) => isProjectInBounds(project, mapBounds));
  }, [filteredProjects, mapBounds]);

  return (
    <Layout hideFooter>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Filters Bar */}
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          onLocationSelect={handleLocationSelect}
        />

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Project List (Left) */}
          <div className={`${isMobile && showMap ? 'hidden' : 'w-full lg:w-[55%] xl:w-[50%]'} overflow-y-auto bg-white border-r border-gray-200`}>
            {/* View Toggle Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {visibleProjects.length} {visibleProjects.length === 1 ? 'projet' : 'projets'} dans cette zone
              </span>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Vue grille"
                >
                  <IconLayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  title="Vue liste"
                >
                  <IconList size={18} />
                </button>
              </div>
            </div>

            {visibleProjects.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                  {visibleProjects.map((project) => (
                    <ProjectCardGrid
                      key={project.id}
                      project={project}
                      isHovered={hoveredProject?.id === project.id}
                      onHover={setHoveredProject}
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
                <h3 className="text-lg font-display font-bold text-gray-900 mb-2">
                  {t('projects.noResults')}
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mb-4">
                  {t('projects.noResultsDesc')}
                </p>
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="px-5 py-2 rounded-full bg-eco-primary text-white text-sm font-semibold hover:bg-eco-primaryDark transition-all cursor-pointer"
                >
                  {t('projects.clearFilters')}
                </button>
              </div>
            )}
          </div>

          {/* Map (Right) */}
          <div className={`${isMobile && !showMap ? 'hidden' : 'flex-1'} relative`}>
            <ProjectsMap
              ref={mapRef}
              projects={filteredProjects}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              onBoundsChange={handleBoundsChange}
              hoveredProjectId={hoveredProject?.id}
            />
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white font-semibold shadow-lg hover:bg-gray-800 transition-all cursor-pointer"
          >
            {showMap ? (
              <>
                <IconList size={18} />
                Voir la liste
              </>
            ) : (
              <>
                <IconMap size={18} />
                Voir la carte
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
