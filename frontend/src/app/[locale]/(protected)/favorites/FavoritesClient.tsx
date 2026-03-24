'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Container, Title, Text, SimpleGrid, Paper, Button, Group, Stack, ThemeIcon, ActionIcon, Badge, Avatar } from '@mantine/core';
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
  IconStar,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import type { Project } from '@/types';

import { ProjectCard } from '@/components/projects/ProjectCard';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { MobileProjectDetailModal } from '@/components/projects/MobileProjectDetailModal';
import { ProjectCardSkeleton } from '@/components/projects/ProjectCard';

// Reuse ProjectCardList from ProjectsPage for consistency
function ProjectCardList({ project }: { project: Project }) {
  const t = useTranslations();
  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.image)
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  const isNatB = project.project_type === 'NATB';

  return (
    <Link href={`/projects/${project.id}`}
      className="block group cursor-pointer"
    >
      <Paper radius="lg" p="md" mb="md" withBorder className="hover:shadow-md transition-all">
        <Group align="flex-start" gap="md" wrap="nowrap">
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
          <Stack gap="xs" className="flex-1 min-w-0">
            <Title order={4} className="group-hover:text-eco-primary transition-colors line-clamp-1">
              {project.title}
            </Title>
            <Group gap="xs">
              <IconMapPin size={14} className="text-eco-terracotta" />
              <Text size="sm" c="dimmed" truncate>{project.address?.city}, {project.address?.country?.name}</Text>
            </Group>

            <Text size="sm" c="dimmed" lineClamp={2}>
              {project.description}
            </Text>

            <Group gap="md">
              <Group gap={4}>
                <IconUsers size={14} />
                <Text size="xs" c="dimmed">{project.max_helpers} {t('projects.volunteers') || 'volunteers'}</Text>
              </Group>
              <Group gap={4}>
                <IconClock size={14} />
                <Text size="xs" c="dimmed">{project.hours_per_day}h/{t('common.day') || 'day'}</Text>
              </Group>
            </Group>

            {/* Amenities */}
            <Group gap="xs">
              {project.internet_provided && (
                <Badge variant="light" color="gray" size="xs" leftSection={<IconWifi size={12} />}>
                  {t('projects.wifi')}
                </Badge>
              )}
              {project.family_friendly && (
                <Badge variant="light" color="gray" size="xs" leftSection={<IconBabyCarriage size={12} />}>
                  {t('projects.familyFriendly') || 'Family'}
                </Badge>
              )}
              {project.pets_allowed && (
                <Badge variant="light" color="gray" size="xs" leftSection={<IconDog size={12} />}>
                  {t('projects.petsAllowed') || 'Pets'}
                </Badge>
              )}
            </Group>

            {/* Host Info */}
            {project.owner && (
              <Group gap="sm" pt="xs" className="border-t border-gray-100">
                <Avatar src={project.owner.profile_picture} size="xs" radius="xl" />
                <Text size="xs" c="dimmed">
                  {t('common.by') || 'By'} <Text component="span" fw={500}>{project.owner.first_name}</Text>
                </Text>
                {project.owner.average_rating && (
                  <Group gap={4}>
                    <Text size="xs" fw={600} c="yellow">{Number(project.owner.average_rating || 0).toFixed(1)}</Text>
                    <IconStar size={12} className="text-yellow-500 fill-yellow-500" />
                  </Group>
                )}
              </Group>
            )}
          </Stack>
        </Group>
      </Paper>
    </Link>
  );
}

export function FavoritesClient() {
  const t = useTranslations();
  const [favorites, setFavorites] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch favorites from API
    setIsLoading(false);
  }, []);
  // Mobile modal state
  const [mobileModalProject, setMobileModalProject] = useState<Project | null>(null);

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="md">
          {/* Header */}
          <Group justify="space-between" align="flex-start" mb="xl">
            <Group gap="md">
              <ThemeIcon size={48} radius="md" color="red" variant="light">
                <IconHeart size={28} className="fill-current" />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={1} className="font-display">
                  {t('favorites.title') || 'My Favorites'}
                </Title>
                <Text c="dimmed">
                  {t('favorites.subtitle') || 'Projects you saved for later'}
                </Text>
              </Stack>
            </Group>

            {/* View Toggle - Hidden on mobile */}
            <Group gap={4} className="hidden sm:flex" p={4} bg="white" style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <ActionIcon
                variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                color={viewMode === 'grid' ? 'gray' : 'gray'}
                onClick={() => setViewMode('grid')}
              >
                <IconLayoutGrid size={18} />
              </ActionIcon>
              <ActionIcon
                variant={viewMode === 'list' ? 'filled' : 'subtle'}
                color={viewMode === 'list' ? 'gray' : 'gray'}
                onClick={() => setViewMode('list')}
              >
                <IconList size={18} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Content */}
          {isLoading ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </SimpleGrid>
          ) : favorites.length > 0 ? (
            viewMode === 'grid' ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {favorites.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    initialFavorite={true}
                    onMobileClick={setMobileModalProject}
                  />
                ))}
              </SimpleGrid>
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
            <Paper radius="xl" p="xl" withBorder className="text-center max-w-xl mx-auto">
              <Stack align="center" gap="md">
                <IconHeart size={64} className="text-gray-300" />
                <Title order={3} className="font-display">
                  {t('favorites.noFavorites') || 'No favorites yet'}
                </Title>
                <Text c="dimmed" maw={400}>
                  {t('favorites.noFavoritesDesc') || 'Start exploring projects and save the ones you like!'}
                </Text>
                <Button
                  component={Link} href="/projects"
                  radius="xl"
                  size="md"
                  color="eco-primary"
                >
                  {t('favorites.browseProjects') || 'Browse Projects'}
                </Button>
              </Stack>
            </Paper>
          )}
        </Container>
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
