import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Layout } from '../components/common/Layout';
import { InteractiveMap } from '../components/search/InteractiveMap';
import { ProjectCard, ProjectCardSkeleton } from '../components/projects/ProjectCard';
import { projectsService } from '../services/projects';
import type { Project } from '../types';

const ITEMS_PER_PAGE = 12;

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, { toggle: toggleFilters }] = useDisclosure(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    project_types: [] as ('PERM' | 'NATB')[],
    is_free: null as boolean | null,
    internet_provided: false,
    family_friendly: false,
    pets_allowed: false,
    smoking_allowed: false,
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

    if (filters.project_types.length > 0) {
      filtered = filtered.filter(p => filters.project_types.includes(p.project_type));
    }

    if (filters.is_free !== null) {
      filtered = filtered.filter(p => p.is_free === filters.is_free);
    }

    if (filters.internet_provided) {
      filtered = filtered.filter(p => p.internet_provided);
    }
    if (filters.family_friendly) {
      filtered = filtered.filter(p => p.family_friendly);
    }
    if (filters.pets_allowed) {
      filtered = filtered.filter(p => p.pets_allowed);
    }
    if (filters.smoking_allowed) {
      filtered = filtered.filter(p => p.smoking_allowed);
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
      project_types: prev.project_types.includes(type)
        ? prev.project_types.filter(t => t !== type)
        : [...prev.project_types, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      project_types: [],
      is_free: null,
      internet_provided: false,
      family_friendly: false,
      pets_allowed: false,
      smoking_allowed: false,
    });
  };

  const hasActiveFilters =
    filters.project_types.length > 0 ||
    filters.is_free !== null ||
    filters.internet_provided ||
    filters.family_friendly ||
    filters.pets_allowed ||
    filters.smoking_allowed;

  return (
    <Layout>
      {/* Header with filters */}
      <Box bg="white" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box maw="1920px" mx="auto" px="xl" py="md">
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="lg">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </Text>
            {hasActiveFilters && (
              <Button variant="subtle" size="xs" onClick={clearFilters}>
                Clear all filters
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
                Filters
              </Button>

              <Button
                variant={filters.project_types.includes('PERM') ? 'filled' : 'outline'}
                color="eco-primary"
                size="sm"
                leftSection={<IconPlant size={16} />}
                onClick={() => toggleProjectType('PERM')}
              >
                Permaculture
              </Button>

              <Button
                variant={filters.project_types.includes('NATB') ? 'filled' : 'outline'}
                color="orange"
                size="sm"
                leftSection={<IconHammer size={16} />}
                onClick={() => toggleProjectType('NATB')}
              >
                Natural Building
              </Button>

              <Button
                variant={filters.is_free === true ? 'filled' : 'outline'}
                color="cyan"
                size="sm"
                onClick={() => setFilters({ ...filters, is_free: filters.is_free === true ? null : true })}
              >
                Free
              </Button>

              <Button
                variant={filters.is_free === false ? 'filled' : 'outline'}
                color="cyan"
                size="sm"
                onClick={() => setFilters({ ...filters, is_free: filters.is_free === false ? null : false })}
              >
                Paid
              </Button>

              <Button
                variant={filters.internet_provided ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconWifi size={16} />}
                onClick={() => setFilters({ ...filters, internet_provided: !filters.internet_provided })}
              >
                Internet
              </Button>

              <Button
                variant={filters.family_friendly ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconUsers size={16} />}
                onClick={() => setFilters({ ...filters, family_friendly: !filters.family_friendly })}
              >
                Family Friendly
              </Button>

              <Button
                variant={filters.pets_allowed ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconPaw size={16} />}
                onClick={() => setFilters({ ...filters, pets_allowed: !filters.pets_allowed })}
              >
                Pets
              </Button>

              <Button
                variant={filters.smoking_allowed ? 'filled' : 'outline'}
                size="sm"
                leftSection={<IconSmokingNo size={16} />}
                onClick={() => setFilters({ ...filters, smoking_allowed: !filters.smoking_allowed })}
              >
                Smoking
              </Button>
            </Group>
          </ScrollArea>

          {/* Expandable detailed filters */}
          <Collapse in={showFilters}>
            <Paper mt="md" p="md" bg="gray.0" radius="md" withBorder>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl">
                {/* Project Type */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">Project Type</Text>
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconPlant size={16} color="var(--color-eco-primary)" />
                        <span>Permaculture</span>
                      </Group>
                    }
                    checked={filters.project_types.includes('PERM')}
                    onChange={() => toggleProjectType('PERM')}
                  />
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconHammer size={16} color="orange" />
                        <span>Natural Building</span>
                      </Group>
                    }
                    checked={filters.project_types.includes('NATB')}
                    onChange={() => toggleProjectType('NATB')}
                  />
                </Stack>

                {/* Price */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">Price</Text>
                  <Radio.Group
                    value={filters.is_free === null ? 'all' : filters.is_free ? 'free' : 'paid'}
                    onChange={(value) => setFilters({
                      ...filters,
                      is_free: value === 'all' ? null : value === 'free'
                    })}
                  >
                    <Stack gap="xs">
                      <Radio value="all" label="All" />
                      <Radio value="free" label="Free" />
                      <Radio value="paid" label="Paid" />
                    </Stack>
                  </Radio.Group>
                </Stack>

                {/* Amenities */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">Amenities</Text>
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconWifi size={16} />
                        <span>Internet</span>
                      </Group>
                    }
                    checked={filters.internet_provided}
                    onChange={(e) => setFilters({ ...filters, internet_provided: e.currentTarget.checked })}
                  />
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconUsers size={16} />
                        <span>Family Friendly</span>
                      </Group>
                    }
                    checked={filters.family_friendly}
                    onChange={(e) => setFilters({ ...filters, family_friendly: e.currentTarget.checked })}
                  />
                </Stack>

                {/* Policies */}
                <Stack gap="xs">
                  <Text fw={600} size="sm">Policies</Text>
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconPaw size={16} />
                        <span>Pets Allowed</span>
                      </Group>
                    }
                    checked={filters.pets_allowed}
                    onChange={(e) => setFilters({ ...filters, pets_allowed: e.currentTarget.checked })}
                  />
                  <Checkbox
                    label={
                      <Group gap="xs">
                        <IconSmokingNo size={16} />
                        <span>Smoking Allowed</span>
                      </Group>
                    }
                    checked={filters.smoking_allowed}
                    onChange={(e) => setFilters({ ...filters, smoking_allowed: e.currentTarget.checked })}
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
                    <ProjectCard key={project.id} project={project} />
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
                  <Text size="lg" c="dimmed">No projects match your filters</Text>
                  <Text size="sm" c="dimmed">Try adjusting your search criteria</Text>
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
