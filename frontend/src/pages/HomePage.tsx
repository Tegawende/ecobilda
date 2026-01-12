import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconPlant,
  IconHammer,
  IconHeartHandshake,
  IconArrowRight,
  IconUserPlus
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { mockUserProjects } from '../data/mockData';
import { ProjectCard } from '../components/projects/ProjectCard';
import { MobileProjectDetailModal } from '../components/projects/MobileProjectDetailModal';
import type { Project } from '../types';

export function HomePage() {
  const { t } = useTranslation();
  // Mobile modal state
  const [mobileModalProject, setMobileModalProject] = useState<Project | null>(null);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative isolate h-screen w-full overflow-hidden">
        {/* Full screen background image */}
        <img
          src="/images/home_cover.jpeg"
          alt="Eco-construction site"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        {/* Dark overlay for text readability without losing color */}
        <div className="absolute inset-0 -z-10 bg-black/40" />

        <div className="relative h-full flex flex-col justify-center items-center text-center px-6 lg:px-8 pt-20">
          <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-7xl drop-shadow-xl max-w-4xl">
            {t('home.hero.title') || "Natural Building Everywhere"}
          </h1>
          <p className="mt-6 text-xl leading-8 text-white font-medium max-w-2xl drop-shadow-md text-shadow">
            {t('home.hero.subtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/projects"
              className="rounded-full bg-eco-primary px-6 py-3 text-base font-bold text-white shadow-lg shadow-black/30 hover:bg-eco-primaryDark hover:scale-105 transition-all duration-300 border border-white/20"
            >
              {t('home.hero.browseProjects')}
            </Link>
          </div>
        </div>
      </div>

      {/* Values / Features Section - Clean White Background */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-display font-bold tracking-tight text-eco-primary sm:text-4xl">
              {t('home.about.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t('home.about.intro')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-eco-brand-50 text-eco-primary shadow-sm transform hover:rotate-3 transition-transform">
                  <IconHammer size={40} stroke={1.5} />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900 font-display">
                  {t('home.naturalBuilding.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{t('home.naturalBuilding.content')}</p>
                </dd>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-eco-brand-50 text-eco-primary shadow-sm transform hover:-rotate-3 transition-transform">
                  <IconPlant size={40} stroke={1.5} />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900 font-display">
                  {t('home.permaculture.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{t('home.permaculture.content')}</p>
                </dd>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-eco-brand-50 text-eco-primary shadow-sm transform hover:rotate-3 transition-transform">
                  <IconHeartHandshake size={40} stroke={1.5} />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900 font-display">
                  {t('home.community.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{t('home.community.content')}</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Featured Projects - Light background */}
      <div className="bg-stone-50 py-24 sm:py-32 border-t border-stone-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-eco-primary sm:text-4xl">
                {t('home.featured.title')}
              </h2>
              <p className="mt-4 text-gray-600">{t('home.featured.subtitle')}</p>
            </div>
            <Link to="/projects" className="hidden sm:flex items-center text-eco-primary font-semibold hover:text-eco-primaryDark group">
              {t('home.featured.viewAll')} <IconArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockUserProjects.slice(0, 3).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onMobileClick={setMobileModalProject}
              />
            ))}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link to="/projects" className="inline-flex items-center text-eco-primary font-semibold hover:text-eco-primaryDark">
              Voir tous les projets <IconArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Reassurance / Community Section - Earthy Background */}
      <div className="relative isolate overflow-hidden bg-eco-terracotta/90 py-24 sm:py-32">
        {/* Subtle pattern or texture could go here */}
        <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl mb-8 drop-shadow-sm">
            {t('home.community.joinTitle') || "Rejoignez une communauté engagée"}
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center mb-12">
            <div className="mx-auto flex max-w-xs flex-col gap-y-2 p-4">
              <dt className="text-base leading-7 text-eco-cream/80 font-medium uppercase tracking-wider">{t('home.stats.participants') || "Participants"}</dt>
              <dd className="order-first text-5xl font-bold tracking-tight text-white mb-2">2,500+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2 p-4">
              <dt className="text-base leading-7 text-eco-cream/80 font-medium uppercase tracking-wider">{t('home.stats.projects') || "Projets réalisés"}</dt>
              <dd className="order-first text-5xl font-bold tracking-tight text-white mb-2">150+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2 p-4">
              <dt className="text-base leading-7 text-eco-cream/80 font-medium uppercase tracking-wider">{t('home.stats.countries') || "Pays"}</dt>
              <dd className="order-first text-5xl font-bold tracking-tight text-white mb-2">12</dd>
            </div>
          </div>
          <div className="flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-eco-terracotta shadow-lg hover:bg-eco-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all transform hover:-translate-y-1"
            >
              <IconUserPlus size={20} />
              {t('home.community.joinBtn') || "Devenir membre (Gratuit)"}
            </Link>
          </div>
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
