import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconHeart,
  IconLayoutGrid,
  IconList,
  IconMapPin,
  IconUsers,
  IconClock,
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconHome,
  IconLeaf,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockFavoriteProjects } from '../data/mockData';
import type { Project } from '../types';

import { ProjectCard } from '../components/projects/ProjectCard';
import { FavoriteButton } from '../components/common/FavoriteButton';
import { MobileProjectDetailModal } from '../components/projects/MobileProjectDetailModal';

// Reuse ProjectCardList from ProjectsPage for consistency
function ProjectCardList({ project }: { project: Project }) {
  const { t } = useTranslation();
  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  const isNatB = project.project_type === 'NATB';

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block group cursor-pointer transition-all duration-200"
    >
      <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 mb-4">
        {/* Project Image */}
        <div className="relative w-[210px] h-[160px] flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton projectId={project.id} variant="ghost" size="sm" initialFavorite={true} />
          </div>

          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${isNatB ? 'bg-eco-primary text-white' : 'bg-eco-terracotta text-white'}`}>
              {isNatB ? <IconHome size={10} /> : <IconLeaf size={10} />}
              {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-1">
          <h3 className="font-bold text-gray-900 text-xl group-hover:text-eco-primary transition-colors line-clamp-1 mb-0.5">
            {project.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <IconMapPin size={14} className="mr-1 flex-shrink-0 text-eco-terracotta" />
            <span className="truncate text-base">{project.address?.city}, {project.address?.country?.name}</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
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
          <div className="flex flex-wrap gap-1 mb-3">
            {project.internet_provided && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <IconWifi size={12} /> {t('projects.wifi')}
              </span>
            )}
            {project.family_friendly && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <IconBabyCarriage size={12} /> {t('projects.familyFriendly') || 'Family'}
              </span>
            )}
            {project.pets_allowed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                <IconDog size={12} /> {t('projects.petsAllowed') || 'Pets'}
              </span>
            )}
          </div>

          {/* Host Info */}
          {project.owner && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <img
                  src={project.owner.profile_picture || undefined}
                  alt={project.owner.first_name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs text-gray-600">
                  {t('common.by') || 'By'} <span className="font-medium text-gray-900">{project.owner.first_name}</span>
                </span>
              </div>
              {project.owner.average_rating && (
                <div className="flex items-center gap-0.5 text-yellow-500">
                  <span className="text-xs font-bold">{project.owner.average_rating.toFixed(1)}</span>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function FavoritesPage() {
  const { t } = useTranslation();
  const [favorites] = useState<Project[]>(mockFavoriteProjects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isLoading = false;
  // Mobile modal state
  const [mobileModalProject, setMobileModalProject] = useState<Project | null>(null);

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-eco-terracotta">
                <IconHeart size={28} className="fill-current" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900">
                  {t('favorites.title') || 'My Favorites'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {t('favorites.subtitle') || 'Projects you saved for later'}
                </p>
              </div>
            </div>

            {/* View Toggle - Hidden on mobile */}
            <div className="hidden sm:flex gap-1 p-1 bg-white rounded-lg shadow-sm border border-gray-100">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
                  }`}
                title="Grid view"
              >
                <IconLayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all cursor-pointer ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
                  }`}
                title="List view"
              >
                <IconList size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    initialFavorite={true}
                    onMobileClick={setMobileModalProject}
                  />
                ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {favorites.map((project) => (
                  <ProjectCardList
                    key={project.id}
                    project={project}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-soft">
              <IconHeart size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('favorites.noFavorites') || 'No favorites yet'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {t('favorites.noFavoritesDesc') || 'Start exploring projects and save the ones you like!'}
              </p>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
              >
                {t('favorites.browseProjects') || 'Browse Projects'}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Project Detail Modal */}
      <MobileProjectDetailModal
        project={mobileModalProject}
        isOpen={mobileModalProject !== null}
        onClose={() => setMobileModalProject(null)}
        initialFavorite={true}
      />
    </Layout>
  );
}
