'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Container,
  Stack,
  Group,
  Text,
  Title,
  Button,
  ThemeIcon,
  SimpleGrid,
  Paper,
} from '@mantine/core';
import { IconPlus, IconBriefcase } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Layout } from '@/components/common/Layout';
import { useMyMissions } from '@/hooks/useConvex';
import { MissionCard, MissionCardSkeleton } from '@/components/missions/MissionCard';
import { missionsService } from '@/services/missions';
import type { Mission } from '@/types';

type MissionTab = 'all' | 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';

export function MyMissionsClient() {
  const t = useTranslations();
  const router = useRouter();
  const { missions, isLoading } = useMyMissions();
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

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = { all: missions.length };
    for (const m of missions as Mission[]) {
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    }
    byStatus.PUBLISHED = (byStatus.PUBLISHED ?? 0) + (byStatus.IN_PROGRESS ?? 0);
    return byStatus;
  }, [missions]);

  const visibleMissions = useMemo(() => {
    const all = missions as Mission[];
    if (tab === 'all') return all;
    if (tab === 'PUBLISHED') return all.filter((m) => m.status === 'PUBLISHED' || m.status === 'IN_PROGRESS');
    return all.filter((m) => m.status === tab);
  }, [missions, tab]);

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="md">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="md" mb="xl">
              <Group gap="md">
                <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                  <IconBriefcase size={28} />
                </ThemeIcon>
                <Stack gap={4}>
                  <Title order={1} className="font-display">
                    {t('myMissions.title')}
                  </Title>
                  <Text c="dimmed">{t('myMissions.subtitle')}</Text>
                </Stack>
              </Group>

              <Button
                component={Link}
                href="/create-mission"
                radius="xl"
                color="eco-primary"
                size="md"
                leftSection={<IconPlus size={20} />}
                className="shadow-lg shadow-eco-primary/20"
              >
                {t('myMissions.createNew')}
              </Button>
            </Group>

            {/* Filter tabs — full width like participations */}
            <div className="flex w-full items-center rounded-lg bg-gray-100 p-1 gap-0.5">
              {[
                { value: 'all', label: `${t('myMissions.tabs.all')} (${counts.all ?? 0})` },
                { value: 'DRAFT', label: `${t('missions.status.DRAFT')} (${counts.DRAFT ?? 0})` },
                { value: 'PUBLISHED', label: `${t('myMissions.published')} (${counts.PUBLISHED ?? 0})` },
                { value: 'COMPLETED', label: `${t('missions.status.COMPLETED')} (${counts.COMPLETED ?? 0})` },
                { value: 'CANCELLED', label: `${t('missions.status.CANCELLED')} (${counts.CANCELLED ?? 0})` },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => setTab(b.value as MissionTab)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    tab === b.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {isLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MissionCardSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : visibleMissions.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {visibleMissions.map((m) => (
                  <MissionCard
                    key={m._id}
                    mission={m}
                    showEdit
                    showStatus
                    onEdit={(id) => router.push(`/missions/${id}/edit` as any)}
                    onDelete={handleDeleteMission}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Paper radius="lg" p="xl" withBorder className="text-center">
                <Stack align="center" gap="md">
                  <IconBriefcase size={64} className="text-gray-300" />
                  <Title order={3} className="font-display">
                    {t('myMissions.empty')}
                  </Title>
                  <Text c="dimmed" maw={400}>
                    {t('myMissions.emptyDesc')}
                  </Text>
                  <Button
                    component={Link}
                    href="/create-mission"
                    radius="xl"
                    size="md"
                    color="eco-primary"
                    leftSection={<IconPlus size={18} />}
                  >
                    {t('myMissions.createNew')}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
