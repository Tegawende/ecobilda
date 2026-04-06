'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
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
import { IconFolder, IconPlus, IconCheck } from '@tabler/icons-react';
import type { Project } from '@/types';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/ProjectCard';
import { useMyProjects } from '@/hooks/useConvex';
import { Layout } from '@/components/common/Layout';


export function MyProjectsClient() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab');
  const [projectStatus, setProjectStatus] = useState<'pending' | 'active' | 'past'>(
    initialTab === 'pending' || initialTab === 'active' || initialTab === 'past' ? initialTab : 'active'
  );
  const [showCreatedAlert, setShowCreatedAlert] = useState(searchParams?.get('created') === 'true');

  const { projects: rawProjects, isLoading } = useMyProjects();
  const projects = (rawProjects || []) as Project[];

  const pendingProjects = projects.filter(p => p.status === 'PENDING');
  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  const pastProjects = projects.filter(p => p.status === 'REJECTED' || (!p.isActive && p.status !== 'PENDING'));
  const filteredProjects = projectStatus === 'pending' ? pendingProjects : projectStatus === 'active' ? activeProjects : pastProjects;

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
                    {t('myProjects.title')}
                  </Title>
                  <Text c="dimmed">
                    {t('myProjects.subtitle')}
                  </Text>
                </Stack>
              </Group>

              <Button
                component={Link}
                href="/create-project"
                radius="xl"
                color="eco-primary"
                size="md"
                leftSection={<IconPlus size={20} />}
                className="shadow-lg shadow-eco-primary/20"
              >
                {t('myProjects.createNew')}
              </Button>
            </Group>

            {/* Project Created Alert */}
            {showCreatedAlert && (
              <Alert
                icon={<IconCheck size={18} />}
                color="green"
                variant="light"
                withCloseButton
                onClose={() => setShowCreatedAlert(false)}
                radius="md"
              >
                <Text fw={500}>{t('myProjects.projectCreated')}</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('myProjects.projectCreatedDesc')}
                </Text>
              </Alert>
            )}

            {/* Filter Tabs */}
            <div className="inline-flex w-fit items-center rounded-md bg-gray-100 p-1 gap-0.5">
              {[
                { value: 'pending', label: t('myProjects.pendingTab') },
                { value: 'active', label: t('myProjects.activeTab') },
                { value: 'past', label: t('myProjects.pastTab') },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setProjectStatus(tab.value as 'pending' | 'active' | 'past')}
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    projectStatus === tab.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {isLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : filteredProjects.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} showEdit onEdit={handleEdit} showStatus />
                ))}
              </SimpleGrid>
            ) : (
              <Paper radius="lg" p="xl" withBorder className="text-center">
                <Stack align="center" gap="md">
                  <IconFolder size={64} className="text-gray-300" />
                  <Title order={3} className="font-display">
                    {projectStatus === 'pending'
                      ? t('myProjects.noPending')
                      : projectStatus === 'active'
                      ? t('myProjects.noActive')
                      : t('myProjects.noPast')}
                  </Title>
                  <Text c="dimmed" maw={400}>
                    {projectStatus === 'pending'
                      ? t('myProjects.noPendingDesc')
                      : projectStatus === 'active'
                      ? t('myProjects.noActiveDesc')
                      : t('myProjects.noPastDesc')}
                  </Text>
                  {(projectStatus === 'active' || projectStatus === 'pending') && (
                    <Button
                      component={Link}
                      href="/create-project"
                      radius="xl"
                      size="md"
                      color="eco-primary"
                      leftSection={<IconPlus size={18} />}
                    >
                      {t('myProjects.createFirst')}
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
