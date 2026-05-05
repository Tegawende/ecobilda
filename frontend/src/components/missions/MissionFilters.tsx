'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconSearch,
  IconCalendar,
  IconFilter,
  IconHome,
  IconSchool,
  IconX,
  IconLoader2,
  IconMapPin,
} from '@tabler/icons-react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Switch,
  Badge,
  Select,
  Box,
  ScrollArea,
  Divider,
  RangeSlider,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
  POSTE_OPTIONS,
  DIFFICULTY_OPTIONS,
  TECHNIQUES_BY_POSTE,
  type Poste,
  techniqueI18nKey,
} from '@/types/missions';
import { useSkills, useLanguages } from '@/hooks/useConvex';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  place_type: string[];
}

async function searchMapboxLocations(query: string): Promise<MapboxFeature[]> {
  if (!query || query.length < 2 || !MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,region,country&limit=5`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return data.features ?? [];
  } catch {
    return [];
  }
}

export interface MissionFiltersState {
  type: 'all' | 'CHANTIER' | 'FORMATION';
  location: { name: string; lat: number; lng: number } | null;
  dateRange: { start: Date | null; end: Date | null };
  difficulty?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  poste?: string;
  technique?: string;
  pricingMode?: 'FREE' | 'PAID';
  maxParticipants: [number, number];
  hoursPerDay: [number, number];
  daysPerWeek: [number, number];
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  skills: string[];
  languages: string[];
}

export const initialMissionFilters: MissionFiltersState = {
  type: 'all',
  location: null,
  dateRange: { start: null, end: null },
  maxParticipants: [1, 30],
  hoursPerDay: [1, 10],
  daysPerWeek: [1, 7],
  internetProvided: false,
  familyFriendly: false,
  petsAllowed: false,
  smokingAllowed: false,
  skills: [],
  languages: [],
};

interface MissionFiltersProps {
  filters: MissionFiltersState;
  onChange: (next: MissionFiltersState) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  onReset?: () => void;
}

export function MissionFilters({ filters, onChange, onLocationSelect, onReset }: MissionFiltersProps) {
  const t = useTranslations();
  const { skills } = useSkills();
  const { languages } = useLanguages();

  const [locationQuery, setLocationQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationResults, setLocationResults] = useState<MapboxFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowLocationDropdown(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!filters.location) {
      setLocationQuery('');
      setLocationResults([]);
    }
  }, [filters.location]);

  const set = <K extends keyof MissionFiltersState>(key: K, value: MissionFiltersState[K]) =>
    onChange({ ...filters, [key]: value });

  const handleLocationSearch = (q: string) => {
    setLocationQuery(q);
    setShowLocationDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setLocationResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchMapboxLocations(q);
      setLocationResults(r);
      setIsSearching(false);
    }, 300);
  };

  const pickLocation = (f: MapboxFeature) => {
    const [lng, lat] = f.center;
    set('location', { name: f.place_name, lat, lng });
    setLocationQuery(f.text);
    setShowLocationDropdown(false);
    onLocationSelect?.(lat, lng);
  };

  const clearLocation = () => {
    set('location', null);
    setLocationQuery('');
    setLocationResults([]);
  };

  const formatDateRange = () => {
    if (!filters.dateRange.start && !filters.dateRange.end) return t('missions.filters.dates');
    const fmt = (d: Date) => d.toLocaleDateString();
    if (filters.dateRange.start && filters.dateRange.end) {
      return `${fmt(filters.dateRange.start)} – ${fmt(filters.dateRange.end)}`;
    }
    if (filters.dateRange.start) return `${t('missions.filters.startingFrom')} ${fmt(filters.dateRange.start)}`;
    return t('missions.filters.dates');
  };

  const activeAdvancedCount =
    (filters.difficulty ? 1 : 0) +
    (filters.poste ? 1 : 0) +
    (filters.technique ? 1 : 0) +
    (filters.pricingMode ? 1 : 0) +
    (filters.internetProvided ? 1 : 0) +
    (filters.familyFriendly ? 1 : 0) +
    (filters.petsAllowed ? 1 : 0) +
    (filters.smokingAllowed ? 1 : 0) +
    filters.skills.length +
    filters.languages.length +
    (filters.hoursPerDay[0] > 1 || filters.hoursPerDay[1] < 10 ? 1 : 0) +
    (filters.daysPerWeek[0] > 1 || filters.daysPerWeek[1] < 7 ? 1 : 0) +
    (filters.maxParticipants[0] > 1 || filters.maxParticipants[1] < 30 ? 1 : 0);

  const hasActive =
    filters.type !== 'all' ||
    !!filters.location ||
    !!filters.dateRange.start ||
    activeAdvancedCount > 0;

  const clearAll = () => {
    onChange(initialMissionFilters);
    setLocationQuery('');
    setLocationResults([]);
    onReset?.();
  };

  const openModal = () => {
    setTempFilters(filters);
    setShowModal(true);
  };

  const applyModal = () => {
    onChange(tempFilters);
    setShowModal(false);
  };

  const resetModal = () => setTempFilters(initialMissionFilters);

  const setTemp = <K extends keyof MissionFiltersState>(key: K, value: MissionFiltersState[K]) =>
    setTempFilters({ ...tempFilters, [key]: value });

  const techOptionsTemp = tempFilters.poste
    ? (TECHNIQUES_BY_POSTE[tempFilters.poste as Poste] || []).map((tech) => ({
        value: tech,
        label: t(techniqueI18nKey(tech)),
      }))
    : [];

  const toggleTempSkill = (code: string) => {
    const cur = tempFilters.skills;
    setTemp('skills', cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  };
  const toggleTempLang = (code: string) => {
    const cur = tempFilters.languages;
    setTemp('languages', cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 sticky z-20" style={{ top: 64 }}>
        <div className="px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" ref={locationRef}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all min-w-[220px] ${
                  showLocationDropdown ? 'border-eco-primary ring-2 ring-eco-primary/20' : 'border-gray-300'
                }`}
              >
                {isSearching ? (
                  <IconLoader2 size={18} className="text-gray-400 animate-spin" />
                ) : (
                  <IconSearch size={18} className="text-gray-400" />
                )}
                <input
                  type="text"
                  value={locationQuery || filters.location?.name?.split(',')[0] || ''}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder={t('missions.filters.searchPlaceholder')}
                  className="flex-1 outline-none text-sm bg-transparent"
                />
                {filters.location && (
                  <button onClick={clearLocation} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <IconX size={16} />
                  </button>
                )}
              </div>
              {showLocationDropdown && (locationResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-full min-w-[280px] max-h-72 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      <IconLoader2 size={20} className="animate-spin mx-auto mb-2" />
                      {t('missions.filters.searching')}
                    </div>
                  ) : (
                    locationResults.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => pickLocation(f)}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <IconMapPin size={16} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{f.text}</p>
                          <p className="text-xs text-gray-500 truncate">{f.place_name}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${
                  filters.dateRange.start
                    ? 'border-eco-primary bg-eco-primary/5'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <IconCalendar size={18} className="text-gray-400" />
                <span className="text-sm">{formatDateRange()}</span>
              </button>
              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50">
                  <DatePicker
                    type="range"
                    value={[filters.dateRange.start, filters.dateRange.end] as any}
                    onChange={(v: any) => {
                      const [s, e] = v ?? [null, null];
                      set('dateRange', { start: s ? new Date(s) : null, end: e ? new Date(e) : null });
                    }}
                    minDate={new Date()}
                    numberOfColumns={2}
                  />
                  <Group justify="flex-end" mt="sm">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        set('dateRange', { start: null, end: null });
                        setShowCalendar(false);
                      }}
                    >
                      {t('common.reset')}
                    </Button>
                    <Button size="xs" onClick={() => setShowCalendar(false)} color="dark">
                      {t('common.apply')}
                    </Button>
                  </Group>
                </div>
              )}
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-full">
              <button
                onClick={() => set('type', 'all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filters.type === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('missions.filters.all')}
              </button>
              <button
                onClick={() => set('type', 'CHANTIER')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filters.type === 'CHANTIER'
                    ? 'bg-eco-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <IconHome size={16} />
                <span className="hidden sm:inline">{t('missions.types.CHANTIER')}</span>
              </button>
              <button
                onClick={() => set('type', 'FORMATION')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filters.type === 'FORMATION'
                    ? 'bg-eco-terracotta text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <IconSchool size={16} />
                <span className="hidden sm:inline">{t('missions.types.FORMATION')}</span>
              </button>
            </div>

            <button
              onClick={openModal}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                activeAdvancedCount > 0
                  ? 'border-eco-primary bg-eco-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <IconFilter size={16} />
              <span className="text-sm font-semibold">{t('common.filter')}</span>
              {activeAdvancedCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-eco-primary text-white text-xs flex items-center justify-center font-bold">
                  {activeAdvancedCount}
                </span>
              )}
            </button>

            {hasActive && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <IconX size={14} />
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={
          <Group justify="space-between" w="100%">
            <Text fw={700}>{t('common.filter')}</Text>
            <Button variant="subtle" size="xs" onClick={resetModal}>
              {t('common.reset')}
            </Button>
          </Group>
        }
        size="lg"
        radius="lg"
        centered
      >
        <ScrollArea h="60vh" type="auto">
          <Stack gap="md" p="xs">
            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.difficulty')}
              </Text>
              <Group gap="xs">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <Badge
                    key={d.value}
                    variant={tempFilters.difficulty === d.value ? 'filled' : 'light'}
                    color="dark"
                    radius="xl"
                    size="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setTemp(
                        'difficulty',
                        tempFilters.difficulty === d.value ? undefined : (d.value as any)
                      )
                    }
                  >
                    {t(d.i18nKey)}
                  </Badge>
                ))}
              </Group>
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.poste')}
              </Text>
              <Select
                data={POSTE_OPTIONS.map((o) => ({ value: o.value, label: t(o.i18nKey) }))}
                value={tempFilters.poste ?? null}
                onChange={(v) => setTempFilters({ ...tempFilters, poste: v ?? undefined, technique: undefined })}
                clearable
                placeholder={t('common.any')}
              />
              {tempFilters.poste && techOptionsTemp.length > 0 && (
                <Select
                  mt="xs"
                  data={techOptionsTemp}
                  value={tempFilters.technique ?? null}
                  onChange={(v) => setTemp('technique', (v ?? undefined) as any)}
                  clearable
                  placeholder={t('missions.filters.technique')}
                />
              )}
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.pricingMode')}
              </Text>
              <Group gap="xs">
                <Badge
                  variant={tempFilters.pricingMode === 'FREE' ? 'filled' : 'light'}
                  color="green"
                  radius="xl"
                  size="lg"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setTemp('pricingMode', tempFilters.pricingMode === 'FREE' ? undefined : 'FREE')
                  }
                >
                  {t('missions.filters.freeOnly')}
                </Badge>
                <Badge
                  variant={tempFilters.pricingMode === 'PAID' ? 'filled' : 'light'}
                  color="orange"
                  radius="xl"
                  size="lg"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setTemp('pricingMode', tempFilters.pricingMode === 'PAID' ? undefined : 'PAID')
                  }
                >
                  {t('missions.filters.paidOnly')}
                </Badge>
              </Group>
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.amenities')}
              </Text>
              <Stack gap={4}>
                <Switch
                  label={t('createPlace.fields.wifi')}
                  checked={tempFilters.internetProvided}
                  onChange={(e) => setTemp('internetProvided', e.currentTarget.checked)}
                />
                <Switch
                  label={t('createPlace.fields.familyFriendly')}
                  checked={tempFilters.familyFriendly}
                  onChange={(e) => setTemp('familyFriendly', e.currentTarget.checked)}
                />
                <Switch
                  label={t('createPlace.fields.petsAllowed')}
                  checked={tempFilters.petsAllowed}
                  onChange={(e) => setTemp('petsAllowed', e.currentTarget.checked)}
                />
                <Switch
                  label={t('createPlace.fields.smokingAllowed')}
                  checked={tempFilters.smokingAllowed}
                  onChange={(e) => setTemp('smokingAllowed', e.currentTarget.checked)}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.hoursPerDay')}: {tempFilters.hoursPerDay[0]}–{tempFilters.hoursPerDay[1]}h
              </Text>
              <RangeSlider
                min={1}
                max={10}
                value={tempFilters.hoursPerDay}
                onChange={(v) => setTemp('hoursPerDay', v as [number, number])}
              />
            </Box>
            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.daysPerWeek')}: {tempFilters.daysPerWeek[0]}–{tempFilters.daysPerWeek[1]}
              </Text>
              <RangeSlider
                min={1}
                max={7}
                value={tempFilters.daysPerWeek}
                onChange={(v) => setTemp('daysPerWeek', v as [number, number])}
              />
            </Box>
            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.maxParticipants')}: {tempFilters.maxParticipants[0]}–{tempFilters.maxParticipants[1]}
              </Text>
              <RangeSlider
                min={1}
                max={30}
                value={tempFilters.maxParticipants}
                onChange={(v) => setTemp('maxParticipants', v as [number, number])}
              />
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.skills')}
              </Text>
              <Group gap={6}>
                {skills.map((s: any) => {
                  const checked = tempFilters.skills.includes(s.code);
                  return (
                    <Badge
                      key={s.code}
                      variant={checked ? 'filled' : 'light'}
                      color="eco-primary"
                      radius="xl"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleTempSkill(s.code)}
                    >
                      {s.displayNameFr || s.displayNameEn}
                    </Badge>
                  );
                })}
              </Group>
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={600} mb={6}>
                {t('missions.filters.languages')}
              </Text>
              <Group gap={6}>
                {languages.slice(0, 20).map((l: any) => {
                  const checked = tempFilters.languages.includes(l.code);
                  return (
                    <Badge
                      key={l.code}
                      variant={checked ? 'filled' : 'light'}
                      color="dark"
                      radius="xl"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleTempLang(l.code)}
                    >
                      {l.name}
                    </Badge>
                  );
                })}
              </Group>
            </Box>
          </Stack>
        </ScrollArea>
        <Divider my="sm" />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setShowModal(false)} radius="xl">
            {t('common.cancel')}
          </Button>
          <Button onClick={applyModal} color="eco-primary" radius="xl">
            {t('common.apply')}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
