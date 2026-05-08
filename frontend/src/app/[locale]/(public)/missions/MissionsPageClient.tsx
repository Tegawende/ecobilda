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
  Grid,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconList, IconMap } from '@tabler/icons-react';
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

export function MissionsPageClient() {
  const t = useTranslations();
  const locale = useLocale();
  // Default to desktop during SSR so the map renders on first paint for desktop users.
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const [filters, setFilters] = useState<MissionFiltersState>(initialMissionFilters);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [mobileShowMap, setMobileShowMap] = useState(false);
  const mapRef = useRef<MissionsMapRef | null>(null);

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

  const visiblePoints: MissionMapPoint[] = useMemo(() => {
    const ids = new Set(filteredMissions.map((m) => m._id));
    return (mapData as MissionMapPoint[]).filter((p) => ids.has(p._id));
  }, [filteredMissions, mapData]);

  const visiblePointsInBounds = useMemo(() => {
    if (!mapBounds) return visiblePoints;
    return visiblePoints.filter(
      (p) =>
        p.latitude >= mapBounds.south &&
        p.latitude <= mapBounds.north &&
        p.longitude >= mapBounds.west &&
        p.longitude <= mapBounds.east
    );
  }, [visiblePoints, mapBounds]);

  const missionsForList = useMemo(() => {
    if (!mapBounds || !isDesktop) return filteredMissions;
    const visIds = new Set(visiblePointsInBounds.map((p) => p._id));
    return filteredMissions.filter((m) => visIds.has(m._id));
  }, [filteredMissions, mapBounds, visiblePointsInBounds, isDesktop]);

  useEffect(() => {
    if (selectedId) {
      const pt = visiblePoints.find((p) => p._id === selectedId);
      if (pt) mapRef.current?.flyTo(pt.latitude, pt.longitude);
    }
  }, [selectedId, visiblePoints]);

  useEffect(() => {
    if (filters.location) {
      mapRef.current?.flyTo(filters.location.lat, filters.location.lng);
    }
  }, [filters.location]);

  // Reset bounds-clipping whenever filters change so the list updates
  // immediately, before the map re-fits. The map will then auto-fit to
  // the new set without re-emitting bounds (programmatic moves are filtered
  // in MissionsMap).
  useEffect(() => {
    setMapBounds(null);
  }, [
    filters.type,
    filters.difficulty,
    filters.poste,
    filters.technique,
    filters.pricingMode,
    filters.skills,
    filters.languages,
    filters.dateRange.start,
    filters.dateRange.end,
    filters.location,
    filters.internetProvided,
    filters.familyFriendly,
    filters.petsAllowed,
    filters.smokingAllowed,
    filters.hoursPerDay,
    filters.daysPerWeek,
    filters.maxParticipants,
  ]);

  // Layout decisions
  const showList = isDesktop || !mobileShowMap;
  const showMap = isDesktop || mobileShowMap;

  return (
    <Layout>
      <MissionFilters
        filters={filters}
        onChange={setFilters}
        onLocationSelect={(lat, lng) => mapRef.current?.flyTo(lat, lng)}
      />

      <Box
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: 'calc(100vh - 64px - 56px)',
          overflow: 'hidden',
        }}
      >
        {/* List side */}
        {showList && (
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: isDesktop ? '0 0 55%' : '1 1 100%',
              width: isDesktop ? '55%' : '100%',
              maxWidth: isDesktop ? '55%' : '100%',
              minWidth: 0,
              backgroundColor: 'white',
              borderRight: isDesktop ? '1px solid var(--mantine-color-gray-2)' : 'none',
              overflow: 'hidden',
            }}
          >
            <Box px="md" py="xs" style={{ borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
              <Text size="xs" fw={500} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                {missionsForList.length <= 1
                  ? `${missionsForList.length} ${t('missions.foundSingle')}`
                  : t('missions.found', { count: missionsForList.length })}
              </Text>
            </Box>

            <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {isLoading ? (
                <Box p="md">
                  <Grid gutter="md">
                    {[...Array(6)].map((_, i) => (
                      <Grid.Col key={i} span={{ base: 12, sm: 6, xl: 4 }}>
                        <MissionCardSkeleton />
                      </Grid.Col>
                    ))}
                  </Grid>
                </Box>
              ) : missionsForList.length === 0 ? (
                <Center h="100%">
                  <Stack align="center" py="xl" px="lg" ta="center" gap="md">
                    <Text c="dimmed">{t('missions.empty')}</Text>
                    <Button variant="subtle" onClick={() => setFilters(initialMissionFilters)}>
                      {t('common.reset')}
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Box p="md">
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
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Map side */}
        {showMap && (
          <Box
            style={{
              flex: isDesktop ? '1 1 45%' : '1 1 100%',
              width: isDesktop ? '45%' : '100%',
              minWidth: 0,
              minHeight: 0,
              position: 'relative',
            }}
          >
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
            {isLoading && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'white',
                  borderRadius: 999,
                  padding: '6px 14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  zIndex: 10,
                }}
              >
                <Loader size="xs" />
                <Text size="xs" c="dimmed" fw={500}>
                  {t('common.loading')}
                </Text>
              </div>
            )}
          </Box>
        )}
      </Box>

      {/* Mobile-only floating toggle */}
      {!isDesktop && (
        <Button
          radius="xl"
          size="md"
          color="dark"
          leftSection={mobileShowMap ? <IconList size={18} /> : <IconMap size={18} />}
          onClick={() => setMobileShowMap((m) => !m)}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {mobileShowMap ? t('missions.view.list') : t('missions.view.map')}
        </Button>
      )}
    </Layout>
  );
}
