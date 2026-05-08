'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Group,
  Text,
  Button,
  Card,
  Badge,
  Grid,
  Center,
  Loader,
  ActionIcon,
  Tabs,
  Box,
  Title,
} from '@mantine/core';
import {
  IconPlus,
  IconHomeCog,
  IconEdit,
  IconTrash,
  IconHome,
  IconBriefcase,
} from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Layout } from '@/components/common/Layout';
import { useMyMissions, useMyPlaces } from '@/hooks/useConvex';
import { MissionCard } from '@/components/missions/MissionCard';
import { missionsService } from '@/services/missions';
import { projectsService } from '@/services/projects';
import type { Mission, Project } from '@/types';

type MissionTab = 'all' | 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED' | 'places';

export function MyMissionsClient() {
  const t = useTranslations();
  const router = useRouter();
  const { missions, isLoading: missionsLoading } = useMyMissions();
  const { places, isLoading: placesLoading } = useMyPlaces();
  const [tab, setTab] = useState<MissionTab>('all');

  const handleDeleteMission = (m: Mission) => {
    modals.openConfirmModal({
      title: t('myMissions.deleteConfirmTitle'),
      children: <Text size="sm">{t('myMissions.deleteConfirmText', { title: m.title })}</Text>,
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await missionsService.remove(m._id);
          notifications.show({ title: t('common.deleted'), message: m.title, color: 'green' });
        } catch (e: any) {
          notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
        }
      },
    });
  };

  const handleDeletePlace = (p: Project) => {
    modals.openConfirmModal({
      title: t('myPlaces.deleteConfirmTitle'),
      children: <Text size="sm">{t('myPlaces.deleteConfirmText', { title: p.title })}</Text>,
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await projectsService.deleteProject(p._id);
          notifications.show({ title: t('common.deleted'), message: p.title, color: 'green' });
        } catch (e: any) {
          notifications.show({ title: t('common.error'), message: e?.message ?? '', color: 'red' });
        }
      },
    });
  };

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = { all: missions.length };
    for (const m of missions as Mission[]) {
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    }
    // Count IN_PROGRESS as PUBLISHED for tab purposes
    byStatus.PUBLISHED = (byStatus.PUBLISHED ?? 0) + (byStatus.IN_PROGRESS ?? 0);
    return byStatus;
  }, [missions]);

  const visibleMissions = useMemo(() => {
    const all = missions as Mission[];
    if (tab === 'all' || tab === 'places') return all;
    if (tab === 'PUBLISHED') return all.filter((m) => m.status === 'PUBLISHED' || m.status === 'IN_PROGRESS');
    return all.filter((m) => m.status === tab);
  }, [missions, tab]);

  return (
    <Layout>
      <Container size="xl" py="md">
        <Stack gap="md">
          {/* Top bar — title + CTAs */}
          <Group justify="space-between" wrap="wrap" gap="md" align="flex-end">
            <Stack gap={2}>
              <Title order={2}>{t('myMissions.title')}</Title>
              <Text size="sm" c="dimmed">
                {t('myMissions.subtitle')}
              </Text>
            </Stack>
            <Group gap="xs">
              <Button
                component={Link}
                href="/create-project"
                variant="default"
                leftSection={<IconHomeCog size={16} />}
                radius="xl"
              >
                {t('myPlaces.createNew')}
              </Button>
              <Button
                component={Link}
                href="/create-mission"
                color="eco-primary"
                leftSection={<IconPlus size={16} />}
                radius="xl"
              >
                {t('myMissions.createNew')}
              </Button>
            </Group>
          </Group>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(v) => setTab((v as MissionTab) ?? 'all')}
            color="eco-primary"
            variant="pills"
            radius="xl"
          >
            <Tabs.List>
              <Tabs.Tab value="all" leftSection={<IconBriefcase size={14} />}>
                {t('myMissions.tabs.all')} ({counts.all ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="DRAFT">
                {t('missions.status.DRAFT')} ({counts.DRAFT ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="PUBLISHED">
                {t('myMissions.published')} ({counts.PUBLISHED ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="COMPLETED">
                {t('missions.status.COMPLETED')} ({counts.COMPLETED ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="CANCELLED">
                {t('missions.status.CANCELLED')} ({counts.CANCELLED ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="places" leftSection={<IconHome size={14} />} ml="auto">
                {t('myPlaces.tabs.places')} ({places.length})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          {/* Content */}
          {tab === 'places' ? (
            <PlacesGrid
              places={places as Project[]}
              isLoading={placesLoading}
              onDelete={handleDeletePlace}
              t={t}
            />
          ) : (
            <MissionsGrid
              missions={visibleMissions}
              isLoading={missionsLoading}
              onEdit={(id) => router.push(`/missions/${id}/edit` as any)}
              onDelete={handleDeleteMission}
              t={t}
            />
          )}
        </Stack>
      </Container>
    </Layout>
  );
}

function MissionsGrid({
  missions,
  isLoading,
  onEdit,
  onDelete,
  t,
}: {
  missions: Mission[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (m: Mission) => void;
  t: any;
}) {
  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }
  if (missions.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Text c="dimmed">{t('myMissions.empty')}</Text>
          <Button
            component={Link}
            href="/create-mission"
            color="eco-primary"
            leftSection={<IconPlus size={16} />}
            radius="xl"
          >
            {t('myMissions.createNew')}
          </Button>
        </Stack>
      </Center>
    );
  }
  return (
    <Grid gutter="md">
      {missions.map((m) => (
        <Grid.Col key={m._id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
          <MissionCard
            mission={m}
            showEdit
            showStatus
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid.Col>
      ))}
    </Grid>
  );
}

function PlacesGrid({
  places,
  isLoading,
  onDelete,
  t,
}: {
  places: Project[];
  isLoading: boolean;
  onDelete: (p: Project) => void;
  t: any;
}) {
  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }
  if (places.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Text c="dimmed">{t('myPlaces.empty')}</Text>
          <Button
            component={Link}
            href="/create-project"
            leftSection={<IconHomeCog size={16} />}
            radius="xl"
          >
            {t('myPlaces.createNew')}
          </Button>
        </Stack>
      </Center>
    );
  }
  return (
    <Grid gutter="md">
      {places.map((p) => (
        <Grid.Col key={p._id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
          <Card withBorder radius="lg" padding="md">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap">
                <Text fw={700} className="line-clamp-1">
                  {p.title}
                </Text>
                <Badge
                  size="xs"
                  color={
                    p.status === 'ACTIVE'
                      ? 'green'
                      : p.status === 'PENDING'
                        ? 'yellow'
                        : 'red'
                  }
                  variant="light"
                  radius="xl"
                >
                  {p.status === 'ACTIVE'
                    ? t('common.active')
                    : p.status === 'PENDING'
                      ? t('common.pending')
                      : t('common.rejected')}
                </Badge>
              </Group>
              {p.address?.city && (
                <Text size="sm" c="dimmed">
                  {p.address.city}
                  {p.address.country?.name ? `, ${p.address.country.name}` : ''}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                {t('myPlaces.missionsCount', { count: p.missionsCount ?? 0 })}
              </Text>
              <Group justify="flex-end" gap={4} mt="xs">
                <ActionIcon
                  variant="subtle"
                  component={Link as any}
                  href={`/projects/${p._id}/edit` as any}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" onClick={() => onDelete(p)}>
                  <IconTrash size={16} />
                </ActionIcon>
                {p.status === 'ACTIVE' && (
                  <Button
                    component={Link}
                    href="/create-mission"
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    radius="xl"
                  >
                    {t('myPlaces.addMission')}
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
}
