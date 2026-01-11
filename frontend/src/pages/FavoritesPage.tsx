import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconHeart,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconHeartOff,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockFavoriteProjects } from '../data/mockData';
import type { Project } from '../types';

// Project Card Component (Same as MyProjects but without edit)
function FavoriteProjectCard({ project, onRemove }: { project: Project; onRemove?: (id: number) => void }) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-float transition-all duration-300 border border-gray-100 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Remove Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove?.(project.id);
        }}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isHovered ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur text-eco-terracotta'} shadow-sm`}
        title={t('favorites.remove') || 'Remove from favorites'}
      >
        {isHovered ? <IconHeartOff size={18} /> : <IconHeart size={18} className="fill-current" />}
      </button>

      <Link to={`/projects/${project.id}`}>
        {/* Image */}
        <div className="h-48 overflow-hidden relative">
          <img
            src={project.images[0]?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Type Badge */}
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${project.project_type === 'NATB' ? 'bg-white/90 text-eco-primary' : 'bg-white/90 text-eco-terracotta'}`}>
              {project.project_type === 'NATB' ? (t('projects.naturalBuilding') || 'Natural Building') : (t('projects.permaculture') || 'Permaculture')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-display font-bold text-gray-900 mb-2 group-hover:text-eco-primary transition-colors line-clamp-1">
            {project.title}
          </h3>

          <div className="flex items-center text-gray-500 text-sm mb-3">
            <IconMapPin size={14} className="mr-1 text-eco-terracotta flex-shrink-0" />
            <span className="truncate">{project.address?.city}, {project.address?.country?.name}</span>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <img
              src={project.owner?.profile_picture || undefined}
              alt={`${project.owner?.first_name} ${project.owner?.last_name}`}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {project.owner?.first_name} {project.owner?.last_name}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function FavoritesPage() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Project[]>(mockFavoriteProjects);
  const isLoading = false;

  const handleRemoveFavorite = (projectId: number) => {
    setFavorites(favorites.filter(p => p.id !== projectId));
  };

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
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

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((project) => (
                <FavoriteProjectCard
                  key={project.id}
                  project={project}
                  onRemove={handleRemoveFavorite}
                />
              ))}
            </div>
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
    </Layout>
  );
}
