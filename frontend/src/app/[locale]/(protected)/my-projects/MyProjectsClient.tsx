'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import logger from '@/lib/logger';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Alert,
  SimpleGrid,
  Paper,
  Button,
} from '@mantine/core';
import { IconFolder, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import type { Project } from '@/types';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/ProjectCard';
import { projectsService } from '@/services/projects';
import { Layout } from '@/components/common/Layout';

function FilterTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex bg-gray-100/80 rounded-xl w-full p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap text-center ${value === option.value
            ? 'bg-white text-eco-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function MyProjectsClient() {
  const t = useTranslations();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStatus, setProjectStatus] = useState<'active' | 'past'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await projectsService.getMyProjects();
        const projectList = Array.isArray(response) ? response : ((response as any).results || []);
        setProjects(projectList);
      } catch (err) {
        logger.error('Failed to fetch my projects:', err);
        setError(t('myProjects.fetchError') || 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [t]);

  const filteredProjects = projects.filter(project => {
    if (projectStatus === 'active' && !project.isActive) return false;
    if (projectStatus === 'past' && project.isActive) return false;
    return true;
  });

  const handleEdit = (id: string) => {
    router.push(`/projects/${id}/edit`);
  };

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="md">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="md" mb="xl">
              <Group gap="md">
                <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                  <IconFolder size={28} />
                </ThemeIcon>
                <Stack gap={4}>
                  <Title order={1} className="font-display">
                    {t('myProjects.title') || 'My Projects'}
                  </Title>
                  <Text c="dimmed">
                    {t('myProjects.subtitle') || 'Manage your published projects'}
                  </Text>
                </Stack>
              </Group>

              <Button
                component={Link}
                href="/projects/new"
                radius="xl"
                color="eco-primary"
                size="md"
                leftSection={<IconPlus size={20} />}
                className="shadow-lg shadow-eco-primary/20"
              >
                {t('myProjects.createNew') || 'Create New Project'}
              </Button>
            </Group>

            {/* Filter Tabs */}
            <Paper radius="lg" p="lg" withBorder>
              <FilterTabs
                value={projectStatus}
                onChange={(v: any) => setProjectStatus(v)}
                options={[
                  { value: 'active', label: t('projects.activeProjects') || 'Active projects' },
                  { value: 'past', label: t('projects.pastProjects') || 'Past projects' }
                ]}
              />
            </Paper>

            {/* Error */}
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" onClose={() => setError(null)} withCloseButton>
                {error}
              </Alert>
            )}

            {/* Content */}
            {isLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {[1, 2, 3, 4].map((i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : filteredProjects.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} showEdit onEdit={handleEdit} showStatus />
                ))}
              </SimpleGrid>
            ) : (
              <Paper radius="lg" p="xl" withBorder className="text-center">
                <Stack align="center" gap="md">
                  <IconFolder size={64} className="text-gray-300" />
                  <Title order={3} className="font-display">
                    {projectStatus === 'active'
                      ? (t('myProjects.noActive') || 'No active projects')
                      : (t('myProjects.noPast') || 'No past projects')}
                  </Title>
                  <Text c="dimmed" maw={400}>
                    {projectStatus === 'active'
                      ? (t('myProjects.noActiveDesc') || 'You have no active projects at the moment.')
                      : (t('myProjects.noPastDesc') || 'You have no past projects yet.')}
                  </Text>
                  {projectStatus === 'active' && (
                    <Button
                      component={Link}
                      href="/projects/new"
                      radius="xl"
                      size="md"
                      color="eco-primary"
                      leftSection={<IconPlus size={18} />}
                    >
                      {t('myProjects.createFirst') || 'Create Your First Project'}
                    </Button>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
