'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Box,
  Stack,
  Group,
  Text,
  Loader,
  Center,
  Button,
  SegmentedControl,
  Grid,
} from '@mantine/core';
import { IconMap, IconLayoutGrid } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { useMissions, useMissionsMapData, useFavorites } from '@/hooks/useConvex';
import { MissionCard, MissionCardSkeleton } from '@/components/missions/MissionCard';
import {
  MissionFilters,
  initialMissionFilters,
  type MissionFiltersState,
} from '@/components/missions/MissionFilters';
import { MissionsMap, type MissionsMapRef, type MapBounds } from '@/components/missions/MissionsMap';
import type { Mission, MissionMapPoint } from '@/types';

type ViewMode = 'split' | 'grid';

export function MissionsPageClient() {
  const t = useTranslations();
  const locale = useLocale();
  const [filters, setFilters] = useState<MissionFiltersState>(initialMissionFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const mapRef = useRef<MissionsMapRef | null>(null);

  // Backend filters supported by api.missions.list
  const backendFilters = useMemo(
    () => ({
      type: filters.type === 'all' ? undefined : filters.type,
      difficulty: filters.difficulty,
      poste: filters.poste,
      technique: filters.technique,
      pricingMode: filters.pricingMode,
      skills: filters.skills,
      languages: filters.languages,
      startsAfter: filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : undefined,
      endsBefore: filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : undefined,
    }),
    [filters]
  );

  const { missions: rawMissions, isLoading } = useMissions(backendFilters);
  const { mapData } = useMissionsMapData();
  const { favoriteMissionIds } = useFavorites();

  // Apply frontend-only filters (amenities, hours/days/participants ranges, location radius)
  const filteredMissions: Mission[] = useMemo(() => {
    let list = rawMissions as Mission[];

    if (filters.internetProvided) list = list.filter((m) => m.project?.internetProvided);
    if (filters.familyFriendly) list = list.filter((m) => m.project?.familyFriendly);
    if (filters.petsAllowed) list = list.filter((m) => m.project?.petsAllowed);
    if (filters.smokingAllowed) list = list.filter((m) => m.project?.smokingAllowed);

    list = list.filter(
      (m) =>
        m.hoursPerDay >= filters.hoursPerDay[0] &&
        m.hoursPerDay <= filters.hoursPerDay[1] &&
        m.daysPerWeek >= filters.daysPerWeek[0] &&
        m.daysPerWeek <= filters.daysPerWeek[1] &&
        m.maxParticipants >= filters.maxParticipants[0] &&
        m.maxParticipants <= filters.maxParticipants[1]
    );

    if (filters.location) {
      // Approximate radius: filter to within ~50km
      const RADIUS_DEG = 0.5;
      const { lat, lng } = filters.location;
      list = list.filter((m) => {
        const a = m.project?.address;
        if (!a?.latitude || !a?.longitude) return false;
        return Math.abs(a.latitude - lat) < RADIUS_DEG && Math.abs(a.longitude - lng) < RADIUS_DEG;
      });
    }

    return list;
  }, [rawMissions, filters]);

  // Map points: only those visible in the current filtered list
  const visiblePoints: MissionMapPoint[] = useMemo(() => {
    const ids = new Set(filteredMissions.map((m) => m._id));
    return (mapData as MissionMapPoint[]).filter((p) => ids.has(p._id));
  }, [filteredMissions, mapData]);

  // Apply map bounds clipping when user pans
  const visiblePointsInBounds = useMemo(() => {
    if (!mapBounds || viewMode !== 'split') return visiblePoints;
    return visiblePoints.filter(
      (p) =>
        p.latitude >= mapBounds.south &&
        p.latitude <= mapBounds.north &&
        p.longitude >= mapBounds.west &&
        p.longitude <= mapBounds.east
    );
  }, [visiblePoints, mapBounds, viewMode]);

  // Missions visible in the list = filtered + (clipped to map bounds when split view)
  const missionsForList = useMemo(() => {
    if (viewMode !== 'split' || !mapBounds) return filteredMissions;
    const visIds = new Set(visiblePointsInBounds.map((p) => p._id));
    return filteredMissions.filter((m) => visIds.has(m._id));
  }, [filteredMissions, viewMode, mapBounds, visiblePointsInBounds]);

  useEffect(() => {
    if (selectedId) {
      const pt = visiblePoints.find((p) => p._id === selectedId);
      if (pt) mapRef.current?.flyTo(pt.latitude, pt.longitude);
    }
  }, [selectedId, visiblePoints]);

  // Reset map view when location filter changes
  useEffect(() => {
    if (filters.location) {
      mapRef.current?.flyTo(filters.location.lat, filters.location.lng);
    }
  }, [filters.location]);

  return (
    <Layout>
      <MissionFilters
        filters={filters}
        onChange={setFilters}
        onLocationSelect={(lat, lng) => mapRef.current?.flyTo(lat, lng)}
      />

      <Box px={{ base: 'md', sm: 'lg' }} py="md">
        <Group justify="space-between" align="center" mb="md" wrap="wrap">
          <Stack gap={0}>
            <Text fw={700} size="xl">
              {t('missions.title')}
            </Text>
            <Text size="sm" c="dimmed">
              {isLoading
                ? t('common.loading')
                : t('missions.found', { count: missionsForList.length })}
            </Text>
          </Stack>
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            data={[
              {
                value: 'split',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconMap size={14} /> <span>{t('missions.view.split')}</span>
                  </Group>
                ) as any,
              },
              {
                value: 'grid',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconLayoutGrid size={14} /> <span>{t('missions.view.grid')}</span>
                  </Group>
                ) as any,
              },
            ]}
          />
        </Group>

        {viewMode === 'split' ? (
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, lg: 7 }}>
              {isLoading ? (
                <Grid gutter="md">
                  {[...Array(6)].map((_, i) => (
                    <Grid.Col key={i} span={{ base: 12, sm: 6, xl: 4 }}>
                      <MissionCardSkeleton />
                    </Grid.Col>
                  ))}
                </Grid>
              ) : missionsForList.length === 0 ? (
                <Center h={300}>
                  <Stack align="center">
                    <Text c="dimmed">{t('missions.empty')}</Text>
                    <Button variant="subtle" onClick={() => setFilters(initialMissionFilters)}>
                      {t('common.reset')}
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Grid gutter="md">
                  {missionsForList.map((mission) => (
                    <Grid.Col key={mission._id} span={{ base: 12, sm: 6, xl: 4 }}>
                      <MissionCard
                        mission={mission}
                        isHovered={hoveredId === mission._id}
                        onHover={(m) => setHoveredId(m?._id ?? null)}
                        initialFavorite={(favoriteMissionIds as string[]).includes(mission._id)}
                      />
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 5 }} visibleFrom="lg">
              <div style={{ position: 'sticky', top: 144, height: 'calc(100vh - 160px)' }}>
                <MissionsMap
                  ref={mapRef}
                  points={visiblePoints}
                  allPoints={visiblePoints}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onBoundsChange={setMapBounds}
                  hoveredId={hoveredId}
                  locale={locale}
                />
              </div>
            </Grid.Col>
          </Grid>
        ) : (
          // Grid view (no map)
          <>
            {isLoading ? (
              <Grid gutter="md">
                {[...Array(8)].map((_, i) => (
                  <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
                    <MissionCardSkeleton />
                  </Grid.Col>
                ))}
              </Grid>
            ) : filteredMissions.length === 0 ? (
              <Center h={300}>
                <Stack align="center">
                  <Text c="dimmed">{t('missions.empty')}</Text>
                  <Button variant="subtle" onClick={() => setFilters(initialMissionFilters)}>
                    {t('common.reset')}
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Grid gutter="md">
                {filteredMissions.map((mission) => (
                  <Grid.Col key={mission._id} span={{ base: 12, sm: 6, lg: 4, xl: 3 }}>
                    <MissionCard
                      mission={mission}
                      isHovered={hoveredId === mission._id}
                      onHover={(m) => setHoveredId(m?._id ?? null)}
                      initialFavorite={(favoriteMissionIds as string[]).includes(mission._id)}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}

        {isLoading && (
          <Center mt="md">
            <Loader size="sm" />
          </Center>
        )}
      </Box>
    </Layout>
  );
}
