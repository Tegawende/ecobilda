'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Group,
  Text,
  Button,
  Tabs,
  Card,
  Badge,
  Grid,
  Center,
  Loader,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconHomeCog, IconExternalLink, IconEdit, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useMyMissions, useMyPlaces } from '@/hooks/useConvex';
import { MissionCard } from '@/components/missions/MissionCard';
import { missionsService } from '@/services/missions';
import { projectsService } from '@/services/projects';
import type { Mission, Project } from '@/types';

export function MyMissionsClient() {
  const t = useTranslations();
  const router = useRouter();
  const { missions, isLoading: missionsLoading } = useMyMissions();
  const { places, isLoading: placesLoading } = useMyPlaces();
  const [tab, setTab] = useState<string | null>('missions');

  const handleDeleteMission = (m: Mission) => {
    modals.openConfirmModal({
      title: t('myMissions.deleteConfirmTitle'),
      children: <Text size="sm">{t('myMissions.deleteConfirmText', { title: m.title })}</Text>,
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await missionsService.remove(m._id);
          notifications.show({
            title: t('common.deleted'),
            message: m.title,
            color: 'green',
          });
        } catch (e: any) {
          notifications.show({
            title: t('common.error'),
            message: e?.message ?? '',
            color: 'red',
          });
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
          notifications.show({
            title: t('common.deleted'),
            message: p.title,
            color: 'green',
          });
        } catch (e: any) {
          notifications.show({
            title: t('common.error'),
            message: e?.message ?? '',
            color: 'red',
          });
        }
      },
    });
  };

  const draftMissions = missions.filter((m: any) => m.status === 'DRAFT');
  const publishedMissions = missions.filter((m: any) =>
    ['PUBLISHED', 'IN_PROGRESS'].includes(m.status)
  );
  const completedMissions = missions.filter((m: any) => m.status === 'COMPLETED');

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={0}>
            <Text fw={700} size="xl">
              {t('myMissions.title')}
            </Text>
            <Text size="sm" c="dimmed">
              {t('myMissions.subtitle')}
            </Text>
          </Stack>
          <Group>
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

        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>
            <Tabs.Tab value="missions">
              {t('myMissions.tabs.missions')} ({missions.length})
            </Tabs.Tab>
            <Tabs.Tab value="places">
              {t('myPlaces.tabs.places')} ({places.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="missions" pt="md">
            {missionsLoading ? (
              <Center h={200}>
                <Loader />
              </Center>
            ) : missions.length === 0 ? (
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
            ) : (
              <Stack gap="lg">
                {publishedMissions.length > 0 && (
                  <Stack gap="sm">
                    <Text fw={600} size="sm" tt="uppercase" c="dimmed">
                      {t('myMissions.published')}
                    </Text>
                    <Grid gutter="md">
                      {publishedMissions.map((m: any) => (
                        <Grid.Col key={m._id} span={{ base: 12, sm: 6, lg: 4 }}>
                          <MissionCard
                            mission={m as Mission}
                            showEdit
                            showStatus
                            onEdit={(id) => router.push(`/missions/${id}/edit` as any)}
                            onDelete={handleDeleteMission}
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Stack>
                )}

                {draftMissions.length > 0 && (
                  <Stack gap="sm">
                    <Text fw={600} size="sm" tt="uppercase" c="dimmed">
                      {t('myMissions.drafts')}
                    </Text>
                    <Grid gutter="md">
                      {draftMissions.map((m: any) => (
                        <Grid.Col key={m._id} span={{ base: 12, sm: 6, lg: 4 }}>
                          <MissionCard
                            mission={m as Mission}
                            showEdit
                            showStatus
                            onEdit={(id) => router.push(`/missions/${id}/edit` as any)}
                            onDelete={handleDeleteMission}
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Stack>
                )}

                {completedMissions.length > 0 && (
                  <Stack gap="sm">
                    <Text fw={600} size="sm" tt="uppercase" c="dimmed">
                      {t('myMissions.completed')}
                    </Text>
                    <Grid gutter="md">
                      {completedMissions.map((m: any) => (
                        <Grid.Col key={m._id} span={{ base: 12, sm: 6, lg: 4 }}>
                          <MissionCard
                            mission={m as Mission}
                            showEdit
                            showStatus
                            onEdit={(id) => router.push(`/missions/${id}/edit` as any)}
                            onDelete={handleDeleteMission}
                          />
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Stack>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="places" pt="md">
            {placesLoading ? (
              <Center h={200}>
                <Loader />
              </Center>
            ) : places.length === 0 ? (
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
            ) : (
              <Grid gutter="md">
                {places.map((p: any) => (
                  <Grid.Col key={p._id} span={{ base: 12, sm: 6, lg: 4 }}>
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
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeletePlace(p)}
                          >
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
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
