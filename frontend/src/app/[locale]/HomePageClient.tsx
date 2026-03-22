'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ThemeIcon } from '@mantine/core';
import {
  IconPlant,
  IconHammer,
  IconHeartHandshake,
  IconArrowRight,
  IconUserPlus
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { useProjects } from '@/hooks/useData';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { MobileProjectDetailModal } from '@/components/projects/MobileProjectDetailModal';
import type { Project } from '@/types';

export function HomePageClient() {
  const t = useTranslations();
  const { data: projects } = useProjects({ page: 1 });
  const [mobileModalProject, setMobileModalProject] = useState<Project | null>(null);

  const featuredProjects = projects?.slice(0, 3) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative isolate h-screen w-full overflow-hidden">
        <img
          src="/images/home_cover.jpeg"
          alt="Eco-construction site"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-black/40" />

        <div className="relative h-full flex flex-col justify-center items-center text-center px-6 lg:px-8 pt-10">
          <h1 className="text-5xl sm:text-[66px] font-display font-bold text-white drop-shadow-2xl max-w-6xl leading-[1.1]">
            {t('home.hero.title')}
          </h1>
          <p className="mt-8 text-lg sm:text-2xl text-white font-medium max-w-3xl drop-shadow-lg opacity-90">
            {t('home.hero.subtitle') || "Connect with eco-construction and permaculture projects worldwide. Learn new skills while contributing to sustainable communities."}
          </p>
          <div className="mt-12 flex items-center justify-center gap-x-6">
            <Link
              href="/projects"
              className="rounded-full bg-[#67a36f] px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-[#5a8f61] transform hover:-translate-y-1 transition-all duration-300"
            >
              {t('home.hero.browseProjects')}
            </Link>
          </div>
        </div>
      </div>

      {/* Values / Features Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl sm:text-[42px] font-display font-bold tracking-tight text-eco-primary">
              {t('home.about.title') || "Welcome to Ecobilda"}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t('home.about.intro')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-6">
                  <ThemeIcon size={80} radius="lg" color="eco-primary" variant="light" className="transform hover:rotate-3 transition-transform">
                    <IconHammer size={40} stroke={1.5} />
                  </ThemeIcon>
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900 font-display">
                  {t('home.naturalBuilding.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto">{t('home.naturalBuilding.content')}</p>
                </dd>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-6">
                  <ThemeIcon size={80} radius="lg" color="eco-primary" variant="light" className="transform hover:-rotate-3 transition-transform">
                    <IconPlant size={40} stroke={1.5} />
                  </ThemeIcon>
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900 font-display">
                  {t('home.permaculture.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto">{t('home.permaculture.content')}</p>
                </dd>
              </div>

              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-6">
                  <ThemeIcon size={80} radius="lg" color="eco-primary" variant="light" className="transform hover:rotate-3 transition-transform">
                    <IconHeartHandshake size={40} stroke={1.5} />
                  </ThemeIcon>
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900 font-display">
                  {t('home.community.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-gray-600">
                  <p className="flex-auto">{t('home.community.content')}</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Featured Projects */}
      <div className="bg-stone-50 py-24 sm:py-32 border-t border-stone-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-eco-primary sm:text-4xl">
                {t('home.featured.title')}
              </h2>
              <p className="mt-4 text-gray-600">{t('home.featured.subtitle')}</p>
            </div>
            <Link href="/projects" className="hidden sm:flex items-center text-eco-primary font-semibold hover:text-eco-primaryDark group">
              {t('home.featured.viewAll')} <IconArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onMobileClick={setMobileModalProject}
              />
            ))}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link href="/projects" className="inline-flex items-center text-eco-primary font-semibold hover:text-eco-primaryDark">
              {t('home.featured.viewAll')} <IconArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="relative isolate overflow-hidden bg-eco-terracotta/90 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl mb-8 drop-shadow-sm">
            {t('home.community.joinTitle') || "Join an engaged community"}
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center mb-12">
            <div className="mx-auto flex max-w-xs flex-col gap-y-2 p-4">
              <dt className="text-sm leading-7 text-eco-cream/80 font-medium uppercase tracking-wider">{t('home.stats.participants') || "Participants"}</dt>
              <dd className="order-first text-[45px] font-bold tracking-tight text-white mb-2">2,500+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2 p-4">
              <dt className="text-sm leading-7 text-eco-cream/80 font-medium uppercase tracking-wider">{t('home.stats.projects') || "Projects completed"}</dt>
              <dd className="order-first text-[45px] font-bold tracking-tight text-white mb-2">150+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2 p-4">
              <dt className="text-sm leading-7 text-eco-cream/80 font-medium uppercase tracking-wider">{t('home.stats.countries') || "Countries"}</dt>
              <dd className="order-first text-[45px] font-bold tracking-tight text-white mb-2">12</dd>
            </div>
          </div>
          <div className="flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-eco-terracotta shadow-lg hover:bg-eco-cream transition-all transform hover:-translate-y-1"
            >
              <IconUserPlus size={20} />
              {t('home.community.joinBtn') || "Become a member (Free)"}
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
