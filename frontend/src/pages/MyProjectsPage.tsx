import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconFolder,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconCalendar,
  IconUsers,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockUserProjects } from '../data/mockData';
import type { Project } from '../types';

// Project Card Component
function ProjectCard({ project, showEdit = false }: { project: Project; showEdit?: boolean }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/projects/${project.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-float transition-all duration-300 border border-gray-100 group relative"
    >
      {/* Edit Button */}
      {showEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Navigate to edit page
          }}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700 hover:text-eco-primary hover:bg-white shadow-sm transition-all"
        >
          <IconEdit size={18} />
        </button>
      )}

      {/* Image */}
      <div className="h-48 overflow-hidden relative">
        <img
          src={project.images[0]?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${project.is_active ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}`}>
            {project.is_active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
          </span>
        </div>
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

        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-gray-500">
            <IconUsers size={14} />
            <span>{project.max_helpers} {t('projects.helpersMax') || 'helpers max'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <IconCalendar size={14} />
            <span>{project.hours_per_day}h/{t('common.day') || 'day'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MyProjectsPage() {
  const { t } = useTranslation();
  const [projects] = useState<Project[]>(mockUserProjects);
  const isLoading = false;

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-eco-brand-50 flex items-center justify-center text-eco-primary">
                <IconFolder size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900">
                  {t('myProjects.title') || 'My Projects'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {t('myProjects.subtitle') || 'Manage your published projects'}
                </p>
              </div>
            </div>

            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all hover:-translate-y-0.5"
            >
              <IconPlus size={20} />
              {t('myProjects.createNew') || 'Create New Project'}
            </Link>
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
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} showEdit />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-soft">
              <IconFolder size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {t('myProjects.noProjects') || 'No projects yet'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {t('myProjects.noProjectsDesc') || "You haven't created any projects yet. Start your first project and connect with volunteers!"}
              </p>
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
              >
                <IconPlus size={20} />
                {t('myProjects.createFirst') || 'Create Your First Project'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
