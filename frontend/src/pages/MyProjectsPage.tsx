import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconFolder,
  IconPlus,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockUserProjects } from '../data/mockData';
import type { Project } from '../types';
import { ProjectCard, ProjectCardSkeleton } from '../components/projects/ProjectCard';
import logger from '../utils/logger';

// Filter Tabs Component
function FilterTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex overflow-x-auto gap-1 p-1 bg-gray-100/80 rounded-xl w-full no-scrollbar">
      <div className="flex gap-1 min-w-full justify-center">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 sm:flex-none sm:min-w-[120px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${value === option.value
              ? 'bg-white text-eco-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MyProjectsPage() {
  const { t } = useTranslation();
  const [projects] = useState<Project[]>(mockUserProjects);
  const [projectStatus, setProjectStatus] = useState<'active' | 'past'>('active');
  const isLoading = false;

  const filteredProjects = projects.filter(project => {
    if (projectStatus === 'active' && !project.is_active) return false;
    if (projectStatus === 'past' && project.is_active) return false;
    return true;
  });

  const handleEdit = (id: number) => {
    // TODO: Navigate to edit page
    logger.debug('Edit project:', id);
  };

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-eco-primary">
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

          {/* Status Tabs */}
          <div className="flex justify-center mb-8 pb-4 border-b border-gray-100">
            <FilterTabs
              value={projectStatus}
              onChange={(v: any) => setProjectStatus(v)}
              options={[
                { value: 'active', label: t('projects.activeProjects') || 'Projets en cours' },
                { value: 'past', label: t('projects.pastProjects') || 'Anciens projets' }
              ]}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  showEdit
                  onEdit={handleEdit}
                  showStatus
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-soft max-w-4xl mx-auto">
              <IconFolder size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                {projectStatus === 'active'
                  ? (t('myProjects.noActive') || 'Aucun projet actif')
                  : (t('myProjects.noPast') || 'Aucun ancien projet')}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {projectStatus === 'active'
                  ? (t('myProjects.noActiveDesc') || "Vous n'avez pas de projets en cours pour le moment.")
                  : (t('myProjects.noPastDesc') || "Vous n'avez pas encore d'anciens projets.")}
              </p>
              {projectStatus === 'active' && (
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark shadow-lg shadow-eco-primary/20 transition-all"
                >
                  <IconPlus size={20} />
                  {t('myProjects.createFirst') || 'Create Your First Project'}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
