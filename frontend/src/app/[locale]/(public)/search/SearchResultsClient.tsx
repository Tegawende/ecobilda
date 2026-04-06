'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Paper,
  Checkbox,
  Radio,
  Collapse,
  Pagination,
  Center,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconFilter,
  IconPlant,
  IconHammer,
  IconWifi,
  IconUsers,
  IconPaw,
  IconSmokingNo,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Layout } from '@/components/common/Layout';
import { InteractiveMap } from '@/components/search/InteractiveMap';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/ProjectCard';
import { projectsService } from '@/services/projects';
import type { Project } from '@/types';

const ITEMS_PER_PAGE = 12;

export function SearchResultsClient() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, { toggle: toggleFilters }] = useDisclosure(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    projectTypes: [] as ('PERM' | 'NATB')[],
    is_free: null as boolean | null,
    internetProvided: false,
    familyFriendly: false,
    petsAllowed: false,
    smokingAllowed: false,
  });

  // Fetch projects based on search params
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};

        const location = searchParams.get('location');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        if (location) params.search = location;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        params.exclude_own = 'true';  // Always exclude user's own projects from search

        const response = await projectsService.getProjects(params);
        setProjects(response.results || []);
        setFilteredProjects(response.results || []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
        setFilteredProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [searchParams]);

  // Apply filters
  useEffect(() => {
    let filtered = [...projects];

    if (filters.projectTypes.length > 0) {
      filtered = filtered.filter(p => filters.projectTypes.includes(p.projectType));
    }

    if (filters.is_free !== null) {
      filtered = filtered.filter(p => (p as any).is_free === filters.is_free);
    }

    if (filters.internetProvided) {
      filtered = filtered.filter(p => p.internetProvided);
    }
    if (filters.familyFriendly) {
      filtered = filtered.filter(p => p.familyFriendly);
    }
    if (filters.petsAllowed) {
      filtered = filtered.filter(p => p.petsAllowed);
    }
    if (filters.smokingAllowed) {
      filtered = filtered.filter(p => p.smokingAllowed);
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, filters]);

  const handleBoundsChange = (bounds: { north: number; south: number; east: number; west: number }) => {
    const projectsInBounds = projects.filter(project => {
      if (!project.address?.latitude || !project.address?.longitude) return false;
      return (
        project.address.latitude >= bounds.south &&
        project.address.latitude <= bounds.north &&
        project.address.longitude >= bounds.west &&
        project.address.longitude <= bounds.east
      );
    });
    setFilteredProjects(projectsInBounds);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const toggleProjectType = (type: 'PERM' | 'NATB') => {
    setFilters(prev => ({
      ...prev,
      projectTypes: prev.projectTypes.includes(type)
        ? prev.projectTypes.filter(t => t !== type)
        : [...prev.projectTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      projectTypes: [],
      is_free: null,
      internetProvided: false,
      familyFriendly: false,
      petsAllowed: false,
      smokingAllowed: false,
    });
  };

  const hasActiveFilters =
    filters.projectTypes.length > 0 ||
    filters.is_free !== null ||
    filters.internetProvided ||
    filters.familyFriendly ||
    filters.petsAllowed ||
    filters.smokingAllowed;

  return (
    <Layout>
      {/* Header with filters */}
      <Box bg="white" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box maw="1920px" mx="auto" px="xl" py="md">
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="lg">
              {filteredProjects.length === 1 ? t('search.results', { count: filteredProjects.length }) : t('search.resultsPlural', { count: filteredProjects.length })}
            </Text>
            {hasActiveFilters && (
              <Button variant="subtle" size="xs" onClick={clearFilters}>
                {t('search.clearFilters')}
              </Button>
            )}
          </Group>

          {/* Quick filter buttons */}
          <ScrollArea type="auto" offsetScrollbars>
            <Group gap="xs" wrap="nowrap" pb="xs">
              <Button
                variant={hasActiveFilters ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconFilter size={16} />}
                onClick={toggleFilters}
              >
                {t('search.filters')}
              </Button>

              <Button
                variant={filters.projectTypes.includes('PERM') ? 'filled' : 'outline'}
                color="eco-primary"
                size="sm"
                leftSection={<IconPlant size={16} />}
                onClick={() => toggleProjectType('PERM')}
              >
                {t('search.permaculture')}
              </Button>

              <Button
                variant={filters.projectTypes.includes('NATB') ? 'filled' : 'outline'}
                color="orange"
                size="sm"
                leftSection={<IconHammer size={16} />}
                onClick={() => toggleProjectType('NATB')}
              >
                {t('search.naturalBuilding')}
              </Button>

              <Button
                variant={filters.is_free === true ? 'filled' : 'outline'}
                color="cyan"
                size="sm"
                onClick={() => setFilters({ ...filters, is_free: filters.is_free === true ? null : true })}
              >
                {t('search.free')}
              </Button>

              <Button
                variant={filters.is_free === false ? 'filled' : 'outline'}
                color="cyan"
                size="sm"
                onClick={() => setFilters({ ...filters, is_free: filters.is_free === false ? null : false })}
              >
                {t('search.paid')}
              </Button>

              <Button
                variant={filters.internetProvided ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconWifi size={16} />}
                onClick={() => setFilters({ ...filters, internetProvided: !filters.internetProvided })}
              >
                {t('search.internet')}
              </Button>

              <Button
                variant={filters.familyFriendly ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconUsers size={16} />}
                onClick={() => setFilters({ ...filters, familyFriendly: !filters.familyFriendly })}
              >
                {t('search.familyFriendly')}
              </Button>

              <Button
                variant={filters.petsAllowed ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconPaw size={16} />}
                onClick={() => setFilters({ ...filters, petsAllowed: !filters.petsAllowed })}
              >
                {t('search.pets')}
              </Button>

              <Button
                variant={filters.smokingAllowed ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconSmokingNo size={16} />}
                onClick={() => setFilters({ ...filters, smokingAllowed: !filters.smokingAllowed })}
              >
                {t('search.smoking')}
              </Button>
            </Group>
          </ScrollArea>

          {/* Expandable detailed filters */}
          <Collapse in={showFilters}>
            <Paper mt="md" p="md" bg="gray.0" radius="md" withBorder>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl">
                {/* Project Type */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">{t('search.projectType')}</Text>
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconPlant size={16} color="var(--color-eco-primary)" />
                        <span>{t('search.permaculture')}</span>
                      </Group>
                    }
                    checked={filters.projectTypes.includes('PERM')}
                    onChange={() => toggleProjectType('PERM')}
                  />
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconHammer size={16} color="orange" />
                        <span>{t('search.naturalBuilding')}</span>
                      </Group>
                    }
                    checked={filters.projectTypes.includes('NATB')}
                    onChange={() => toggleProjectType('NATB')}
                  />
                </Stack>

                {/* Price */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">{t('search.price')}</Text>
                  <Radio.Group
                    value={filters.is_free === null ? 'all' : filters.is_free ? 'free' : 'paid'}
                    onChange={(value) => setFilters({
                      ...filters,
                      is_free: value === 'all' ? null : value === 'free'
                    })}
                  >
                    <Stack gap="xs">
                      <Radio value="all" label={t('common.all')} />
                      <Radio value="free" label={t('search.free')} />
                      <Radio value="paid" label={t('search.paid')} />
                    </Stack>
                  </Radio.Group>
                </Stack>

                {/* Amenities */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">{t('search.amenities')}</Text>
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconWifi size={16} />
                        <span>{t('search.internet')}</span>
                      </Group>
                    }
                    checked={filters.internetProvided}
                    onChange={(e) => setFilters({ ...filters, internetProvided: e.currentTarget.checked })}
                  />
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconUsers size={16} />
                        <span>{t('search.familyFriendly')}</span>
                      </Group>
                    }
                    checked={filters.familyFriendly}
                    onChange={(e) => setFilters({ ...filters, familyFriendly: e.currentTarget.checked })}
                  />
                </Stack>

                {/* Policies */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">{t('search.policies')}</Text>
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconPaw size={16} />
                        <span>{t('search.petsAllowed')}</span>
                      </Group>
                    }
                    checked={filters.petsAllowed}
                    onChange={(e) => setFilters({ ...filters, petsAllowed: e.currentTarget.checked })}
                  />
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconSmokingNo size={16} />
                        <span>{t('search.smokingAllowed')}</span>
                      </Group>
                    }
                    checked={filters.smokingAllowed}
                    onChange={(e) => setFilters({ ...filters, smokingAllowed: e.currentTarget.checked })}
                  />
                </Stack>
              </SimpleGrid>
            </Paper>
          </Collapse>
        </Box>
      </Box>

      {/* Main content - Split view */}
      <Box style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
        {/* Left side - Scrollable projects list */}
        <Box w={{ base: '100%', lg: '50%' }} style={{ overflowY: 'auto' }}>
          <Box maw="900px" mx="auto" px="xl" py="xl">
            {isLoading ? (
              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : filteredProjects.length > 0 ? (
              <>
                <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
                  {paginatedProjects.map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </SimpleGrid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Center mt="xl">
                    <Pagination
                      total={totalPages}
                      value={currentPage}
                      onChange={setCurrentPage}
                      withEdges
                    />
                  </Center>
                )}
              </>
            ) : (
              <Center py={64}>
                <Stack align="center" gap="xs">
                  <Text size="lg" c="dimmed">{t('search.noResults')}</Text>
                  <Text size="sm" c="dimmed">{t('search.adjustCriteria')}</Text>
                </Stack>
              </Center>
            )}
          </Box>
        </Box>

        {/* Right side - Fixed map (hidden on mobile) */}
        <Box w="50%" h="100%" pos="sticky" top={0} visibleFrom="lg">
          <InteractiveMap projects={filteredProjects} onBoundsChange={handleBoundsChange} />
        </Box>
      </Box>
    </Layout>
  );
}
