'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Container,
  Grid,
  Stack,
  Group,
  Text,
  Loader,
  Center,
  Drawer,
  ActionIcon,
  Button,
  SegmentedControl,
  Paper,
} from '@mantine/core';
import { IconFilter, IconMap, IconList, IconLayoutGrid } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { useMissions, useMissionsMapData, useFavorites } from '@/hooks/useConvex';
import { MissionCard, MissionCardSkeleton } from '@/components/missions/MissionCard';
import {
  MissionFilters,
  initialMissionFilters,
  type MissionFiltersState,
} from '@/components/missions/MissionFilters';
import { MissionsMap, type MissionsMapRef } from '@/components/missions/MissionsMap';
import type { Mission, MissionMapPoint } from '@/types';

type ViewMode = 'split' | 'grid' | 'map';

export function MissionsPageClient() {
  const t = useTranslations();
  const [filters, setFilters] = useState<MissionFiltersState>(initialMissionFilters);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MissionsMapRef | null>(null);

  const { missions, isLoading } = useMissions(filters);
  const { mapData } = useMissionsMapData();
  const { favoriteMissionIds } = useFavorites();

  const visiblePoints: MissionMapPoint[] = useMemo(() => {
    const ids = new Set(missions.map((m: any) => m._id));
    return mapData.filter((p: MissionMapPoint) => ids.has(p._id));
  }, [missions, mapData]);

  useEffect(() => {
    if (selectedId) {
      const pt = visiblePoints.find((p) => p._id === selectedId);
      if (pt) mapRef.current?.flyTo(pt.latitude, pt.longitude);
    }
  }, [selectedId, visiblePoints]);

  const reset = () => setFilters(initialMissionFilters);

  return (
    <Layout>
      <Container size="xl" py="md">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Stack gap={0}>
              <Text fw={700} size="xl">
                {t('missions.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {isLoading
                  ? t('common.loading')
                  : t('missions.found', { count: missions.length })}
              </Text>
            </Stack>
            <Group gap="xs">
              <SegmentedControl
                size="xs"
                value={viewMode}
                onChange={(v) => setViewMode(v as ViewMode)}
                data={[
                  { label: <IconLayoutGrid size={16} />, value: 'split' },
                  { label: <IconList size={16} />, value: 'grid' },
                  { label: <IconMap size={16} />, value: 'map' },
                ]}
              />
              {/* Mobile filter button (drawer) */}
              <ActionIcon
                hiddenFrom="md"
                variant="default"
                size="lg"
                radius="xl"
                onClick={() => setFiltersDrawerOpen(true)}
                aria-label={t('missions.filters.title')}
              >
                <IconFilter size={18} />
              </ActionIcon>
            </Group>
          </Group>

          <Grid gutter="md">
            {/* Sidebar filters — desktop only */}
            <Grid.Col span={{ base: 12, md: 3 }} visibleFrom="md">
              <Paper
                withBorder
                radius="md"
                p="md"
                style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}
              >
                <MissionFilters
                  filters={filters}
                  onChange={setFilters}
                  onReset={reset}
                  isLoading={isLoading}
                />
              </Paper>
            </Grid.Col>

            {/* Main content */}
            <Grid.Col span={{ base: 12, md: 9 }}>
              {viewMode === 'split' && (
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, lg: 7 }}>
                    {isLoading ? (
                      <Grid gutter="md">
                        {[...Array(6)].map((_, i) => (
                          <Grid.Col key={i} span={{ base: 12, sm: 6, xl: 6 }}>
                            <MissionCardSkeleton />
                          </Grid.Col>
                        ))}
                      </Grid>
                    ) : missions.length === 0 ? (
                      <Center h={300}>
                        <Stack align="center">
                          <Text c="dimmed">{t('missions.empty')}</Text>
                          <Button variant="subtle" onClick={reset}>
                            {t('common.reset')}
                          </Button>
                        </Stack>
                      </Center>
                    ) : (
                      <Grid gutter="md">
                        {missions.map((mission: any) => (
                          <Grid.Col key={mission._id} span={{ base: 12, sm: 6, xl: 6 }}>
                            <MissionCard
                              mission={mission as Mission}
                              isHovered={hoveredId === mission._id}
                              onHover={(m) => setHoveredId(m?._id ?? null)}
                              initialFavorite={favoriteMissionIds.includes(mission._id)}
                            />
                          </Grid.Col>
                        ))}
                      </Grid>
                    )}
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, lg: 5 }} visibleFrom="lg">
                    <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 100px)' }}>
                      <MissionsMap
                        ref={mapRef}
                        points={visiblePoints}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        hoveredId={hoveredId}
                      />
                    </div>
                  </Grid.Col>
                </Grid>
              )}

              {viewMode === 'grid' && (
                <Grid gutter="md">
                  {isLoading
                    ? [...Array(8)].map((_, i) => (
                        <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4 }}>
                          <MissionCardSkeleton />
                        </Grid.Col>
                      ))
                    : missions.length === 0 ? (
                        <Grid.Col span={12}>
                          <Center h={300}>
                            <Stack align="center">
                              <Text c="dimmed">{t('missions.empty')}</Text>
                              <Button variant="subtle" onClick={reset}>
                                {t('common.reset')}
                              </Button>
                            </Stack>
                          </Center>
                        </Grid.Col>
                      ) : (
                        missions.map((mission: any) => (
                          <Grid.Col key={mission._id} span={{ base: 12, sm: 6, lg: 4 }}>
                            <MissionCard
                              mission={mission as Mission}
                              isHovered={hoveredId === mission._id}
                              onHover={(m) => setHoveredId(m?._id ?? null)}
                              initialFavorite={favoriteMissionIds.includes(mission._id)}
                            />
                          </Grid.Col>
                        ))
                      )}
                </Grid>
              )}

              {viewMode === 'map' && (
                <div style={{ height: 'calc(100vh - 200px)' }}>
                  <MissionsMap
                    ref={mapRef}
                    points={visiblePoints}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    hoveredId={hoveredId}
                  />
                </div>
              )}
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Mobile drawer */}
        <Drawer
          opened={filtersDrawerOpen}
          onClose={() => setFiltersDrawerOpen(false)}
          title={t('missions.filters.title')}
          position="right"
          size="md"
          padding="md"
        >
          <MissionFilters
            filters={filters}
            onChange={setFilters}
            onReset={reset}
            isLoading={isLoading}
          />
        </Drawer>

        {isLoading && (
          <Center mt="md">
            <Loader size="sm" />
          </Center>
        )}
      </Container>
    </Layout>
  );
}
