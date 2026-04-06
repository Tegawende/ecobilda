'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Container, Title, Text, SimpleGrid, Paper, Button, Group, Stack, ThemeIcon, ActionIcon, Badge, Avatar, Box } from '@mantine/core';
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
import { useFavorites } from '@/hooks/useConvex';

import { ProjectCard } from '@/components/projects/ProjectCard';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { MobileProjectDetailModal } from '@/components/projects/MobileProjectDetailModal';
import { ProjectCardSkeleton } from '@/components/projects/ProjectCard';

// Reuse same list card style as browse projects page
function ProjectCardList({ project }: { project: Project }) {
  const t = useTranslations();
  const images = project.images && project.images.length > 0
    ? project.images.map(img => img.url || '')
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];
  const isNatB = project.projectType === 'NATB';

  return (
    <Link href={`/projects/${project._id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block group cursor-pointer transition-all duration-200"
    >
      <Group gap="md" p="md" wrap="nowrap" align="flex-start" className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        {/* Image */}
        <div className="relative w-[200px] h-[150px] flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton projectId={project._id} variant="ghost" size="sm" initialFavorite={true} />
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

          {/* Host info */}
          {project.owner && (
            <Group gap="sm" pt="xs" className="border-t border-gray-100">
              <Avatar src={project.owner?.profilePictureUrl || undefined} size="sm" radius="xl" color="gray">
                {!project.owner?.profilePictureUrl && <IconUsers size={18} />}
              </Avatar>
              <Stack gap={0}>
                <Text size="sm" fw={600}>{project.owner?.firstName} {project.owner?.lastName?.charAt(0)}.</Text>
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

export function FavoritesClient() {
  const t = useTranslations();
  const { favoriteProjectIds, isLoading: favLoading } = useFavorites();
  const favoriteProjects = useQuery(
    api.projects.getByIds,
    favoriteProjectIds.length > 0 ? { ids: favoriteProjectIds as any } : "skip"
  );
  const favorites = (favoriteProjects ?? []) as Project[];
  const isLoading = favLoading || (favoriteProjectIds.length > 0 && favoriteProjects === undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Mobile modal state
  const [mobileModalProject, setMobileModalProject] = useState<Project | null>(null);

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="md">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <Group gap="md" mb="xl">
                <ThemeIcon size={48} radius="md" color="red" variant="light">
                  <IconHeart size={28} className="fill-current" />
                </ThemeIcon>
                <Stack gap={4}>
                  <Title order={1} className="font-display">
                    {t('favorites.title')}
                  </Title>
                  <Text c="dimmed">
                    {t('favorites.subtitle')}
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
                      key={project._id}
                      project={project}
                      initialFavorite={true}
                      onMobileClick={setMobileModalProject}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box maw={900} mx="auto">
                  {favorites.map((project) => (
                    <ProjectCardList
                      key={project._id}
                      project={project}
                    />
                  ))}
                </Box>
              )
            ) : (
              <Paper radius="lg" p="xl" withBorder className="text-center max-w-xl mx-auto">
                <Stack align="center" gap="md">
                  <IconHeart size={64} className="text-gray-300" />
                  <Title order={3} className="font-display">
                    {t('favorites.noFavorites')}
                  </Title>
                  <Text c="dimmed" maw={400}>
                    {t('favorites.noFavoritesDesc')}
                  </Text>
                  <Button
                    component={Link} href="/projects"
                    radius="xl"
                    size="md"
                    color="eco-primary"
                  >
                    {t('favorites.browseProjects')}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
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
