'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    IconArrowLeft,
    IconSearch,
    IconMapPin,
    IconHome,
    IconLeaf,
    IconX,
    IconLoader2,
    IconChevronLeft,
    IconChevronRight,
    IconCheck,
} from '@tabler/icons-react';
import {
    ActionIcon,
    Box,
    Button,
    Center,
    Group,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
    UnstyledButton,
} from '@mantine/core';
import type { ProjectFiltersState } from './ProjectFilters';

// Mapbox Geocoding
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapboxFeature {
    id: string;
    place_name: string;
    center: [number, number];
    place_type: string[];
    text: string;
}

async function searchMapboxLocations(query: string, lang: string = 'fr'): Promise<MapboxFeature[]> {
    if (!query || query.length < 2 || !MAPBOX_TOKEN) return [];
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
            `access_token=${MAPBOX_TOKEN}&types=place,locality,region,country&limit=5&language=${lang}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.features || [];
    } catch {
        return [];
    }
}

interface MobileSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: ProjectFiltersState;
    onFiltersChange: (filters: ProjectFiltersState) => void;
    onLocationSelect?: (lat: number, lng: number) => void;
}

type Step = 'location' | 'dates' | 'type';

export function MobileSearchModal({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    onLocationSelect,
}: MobileSearchModalProps) {
    const t = useTranslations();
    const locale = useLocale();
    const [step, setStep] = useState<Step>('location');
    const [tempFilters, setTempFilters] = useState(filters);
    const [locationQuery, setLocationQuery] = useState(filters.location?.name || '');
    const [locationSuggestions, setLocationSuggestions] = useState<MapboxFeature[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectingEnd, setSelectingEnd] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStep('location');
            setTempFilters(filters);
            setLocationQuery(filters.location?.name || '');
            setLocationSuggestions([]);
            document.body.style.overflow = 'hidden';
            // Focus input after animation
            setTimeout(() => inputRef.current?.focus(), 300);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, filters]);

    // Location search
    const handleLocationSearch = (query: string) => {
        setLocationQuery(query);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.length < 2) {
            setLocationSuggestions([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            const results = await searchMapboxLocations(query, locale);
            setLocationSuggestions(results);
            setIsSearching(false);
        }, 300);
    };

    const selectLocation = (feature: MapboxFeature) => {
        const [lng, lat] = feature.center;
        setTempFilters({
            ...tempFilters,
            location: { name: feature.place_name, lat, lng },
        });
        setLocationQuery(feature.text);
        setLocationSuggestions([]);
        // Auto-advance to next step
        setStep('dates');
    };

    const skipLocation = () => {
        setTempFilters({ ...tempFilters, location: null });
        setLocationQuery('');
        setStep('dates');
    };

    // Calendar logic
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(currentMonth);
    const dayNames = [0, 1, 2, 3, 4, 5, 6].map(d =>
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, d + 1))
    );

    const formatDate = (date: Date) => {
        return date.toLocaleDateString();
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];
        const startDay = (firstDay.getDay() + 6) % 7;
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
        return days;
    };

    const handleDayClick = (date: Date) => {
        if (!selectingEnd || !tempFilters.dateRange.start) {
            setTempFilters({
                ...tempFilters,
                dateRange: { start: date, end: null },
            });
            setSelectingEnd(true);
        } else {
            const start = tempFilters.dateRange.start;
            if (date < start) {
                setTempFilters({
                    ...tempFilters,
                    dateRange: { start: date, end: start },
                });
            } else {
                setTempFilters({
                    ...tempFilters,
                    dateRange: { start, end: date },
                });
            }
            setSelectingEnd(false);
        }
    };

    const isInRange = (date: Date) => {
        const { start, end } = tempFilters.dateRange;
        if (!start || !end) return false;
        return date >= start && date <= end;
    };

    const isSelected = (date: Date) => {
        const { start, end } = tempFilters.dateRange;
        if (start && date.toDateString() === start.toDateString()) return true;
        if (end && date.toDateString() === end.toDateString()) return true;
        return false;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const confirmDates = () => {
        setStep('type');
    };

    const skipDates = () => {
        setTempFilters({
            ...tempFilters,
            dateRange: { start: null, end: null },
        });
        setStep('type');
    };

    // Apply and close
    const applySearch = () => {
        onFiltersChange(tempFilters);
        if (tempFilters.location) {
            onLocationSelect?.(tempFilters.location.lat, tempFilters.location.lng);
        }
        onClose();
    };

    const goBack = () => {
        if (step === 'dates') setStep('location');
        else if (step === 'type') setStep('dates');
        else onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col" style={{ animation: 'slideUp 0.25s ease-out' }}>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

            {/* Header */}
            <Group justify="space-between" p="md" className="border-b border-gray-200">
                <ActionIcon variant="subtle" color="gray" radius="xl" onClick={goBack} size="lg">
                    <IconArrowLeft size={22} />
                </ActionIcon>
                <Group gap={6}>
                    {(['location', 'dates', 'type'] as const).map((s) => (
                        <div
                            key={s}
                            className={`h-2 rounded-full transition-all ${step === s ? 'bg-eco-primary w-4' :
                                (s === 'location' ? 'bg-eco-primary/50' :
                                    s === 'dates' && step === 'type' ? 'bg-eco-primary/50' : 'bg-gray-300')
                                } ${step === s ? '' : 'w-2'}`}
                        />
                    ))}
                </Group>
                <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onClose} size="lg">
                    <IconX size={22} />
                </ActionIcon>
            </Group>

            {/* Content */}
            <Box className="flex-1 overflow-y-auto">
                {/* Step 1: Location */}
                {step === 'location' && (
                    <Stack p="md" gap="md">
                        <Box>
                            <Title order={2} className="font-display" mb={4}>{t('projects.filters.whereToGo')}</Title>
                            <Text c="dimmed">{t('projects.filters.searchByLocation')}</Text>
                        </Box>

                        <TextInput
                            ref={inputRef}
                            value={locationQuery}
                            onChange={(e) => handleLocationSearch(e.currentTarget.value)}
                            placeholder={t('projects.filters.locationPlaceholder')}
                            size="lg"
                            radius="xl"
                            leftSection={isSearching ? (
                                <IconLoader2 size={20} className="text-gray-400 animate-spin" />
                            ) : (
                                <IconMapPin size={20} className="text-gray-400" />
                            )}
                            rightSection={locationQuery ? (
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => { setLocationQuery(''); setLocationSuggestions([]); }}>
                                    <IconX size={18} />
                                </ActionIcon>
                            ) : undefined}
                        />

                        {/* Suggestions */}
                        {locationSuggestions.length > 0 && (
                            <Stack gap={4}>
                                {locationSuggestions.map((feature) => (
                                    <UnstyledButton
                                        key={feature.id}
                                        onClick={() => selectLocation(feature)}
                                        className="rounded-xl hover:bg-gray-50 transition-colors"
                                        px="md"
                                        py="sm"
                                    >
                                        <Group gap="sm" wrap="nowrap">
                                            <Center className="w-10 h-10 rounded-full bg-gray-100">
                                                <IconMapPin size={18} className="text-gray-500" />
                                            </Center>
                                            <Box className="flex-1 min-w-0">
                                                <Text fw={500} truncate>{feature.text}</Text>
                                                <Text size="sm" c="dimmed" truncate>{feature.place_name}</Text>
                                            </Box>
                                        </Group>
                                    </UnstyledButton>
                                ))}
                            </Stack>
                        )}

                        {/* Flexible option */}
                        <UnstyledButton
                            onClick={skipLocation}
                            className="rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                            px="md"
                            py="sm"
                        >
                            <Group gap="sm">
                                <Center className="w-10 h-10 rounded-full bg-eco-primary/10">
                                    <IconSearch size={18} className="text-eco-primary" />
                                </Center>
                                <Box>
                                    <Text fw={500}>{t('projects.filters.flexible')}</Text>
                                    <Text size="sm" c="dimmed">{t('projects.filters.searchEverywhere')}</Text>
                                </Box>
                            </Group>
                        </UnstyledButton>
                    </Stack>
                )}

                {/* Step 2: Dates */}
                {step === 'dates' && (
                    <Stack p="md" gap="md">
                        <Box>
                            <Title order={2} className="font-display" mb={4}>{t('projects.filters.whenToGo')}</Title>
                            <Text c="dimmed">{t('projects.filters.selectDates')}</Text>
                        </Box>

                        {/* Calendar */}
                        <Paper bg="gray.0" radius="lg" p="md">
                            <Group justify="space-between" mb="md">
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    radius="xl"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                >
                                    <IconChevronLeft size={20} />
                                </ActionIcon>
                                <Text fw={600} className="capitalize">
                                    {monthName} {currentMonth.getFullYear()}
                                </Text>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    radius="xl"
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                >
                                    <IconChevronRight size={20} />
                                </ActionIcon>
                            </Group>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {dayNames.map((day) => (
                                    <Text key={day} ta="center" size="xs" c="dimmed" fw={500} py={8}>
                                        {day}
                                    </Text>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {getDaysInMonth(currentMonth).map((date, idx) => (
                                    <div key={idx} className="aspect-square">
                                        {date && (
                                            <UnstyledButton
                                                onClick={() => handleDayClick(date)}
                                                disabled={date < today}
                                                className={`w-full h-full rounded-full text-sm flex items-center justify-center transition-all
                          ${date < today ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-white cursor-pointer'}
                          ${isSelected(date) ? 'bg-eco-primary text-white' : ''}
                          ${isInRange(date) && !isSelected(date) ? 'bg-eco-primary/20' : ''}
                        `}
                                            >
                                                {date.getDate()}
                                            </UnstyledButton>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Paper>

                        {/* Selected dates display */}
                        {tempFilters.dateRange.start && (
                            <Paper bg="var(--color-eco-primary-light, rgba(76, 175, 80, 0.1))" radius="md" p="sm" ta="center">
                                <Text className="text-eco-primary" fw={500}>
                                    {formatDate(tempFilters.dateRange.start)}
                                    {tempFilters.dateRange.end && (
                                        <> &rarr; {formatDate(tempFilters.dateRange.end)}</>
                                    )}
                                </Text>
                            </Paper>
                        )}

                        {/* Skip option */}
                        <UnstyledButton onClick={skipDates} className="w-full py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors" ta="center">
                            {t('projects.filters.skipDates')}
                        </UnstyledButton>
                    </Stack>
                )}

                {/* Step 3: Type */}
                {step === 'type' && (
                    <Stack p="md" gap="md">
                        <Box>
                            <Title order={2} className="font-display" mb={4}>{t('projects.filters.whatType')}</Title>
                            <Text c="dimmed">{t('projects.filters.chooseType')}</Text>
                        </Box>

                        <Stack gap="sm">
                            {/* All */}
                            <UnstyledButton
                                onClick={() => setTempFilters({ ...tempFilters, projectType: 'all' })}
                                className={`rounded-xl border-2 transition-all ${tempFilters.projectType === 'all'
                                    ? 'border-eco-primary bg-eco-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                p="md"
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Center className={`w-12 h-12 rounded-xl ${tempFilters.projectType === 'all' ? 'bg-eco-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <IconSearch size={22} />
                                    </Center>
                                    <Box className="flex-1">
                                        <Text fw={600}>{t('projects.filters.all')}</Text>
                                        <Text size="sm" c="dimmed">{t('projects.filters.allDescription')}</Text>
                                    </Box>
                                    {tempFilters.projectType === 'all' && (
                                        <IconCheck size={22} className="text-eco-primary" />
                                    )}
                                </Group>
                            </UnstyledButton>

                            {/* Natural Building */}
                            <UnstyledButton
                                onClick={() => setTempFilters({ ...tempFilters, projectType: 'NATB' })}
                                className={`rounded-xl border-2 transition-all ${tempFilters.projectType === 'NATB'
                                    ? 'border-eco-primary bg-eco-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                p="md"
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Center className={`w-12 h-12 rounded-xl ${tempFilters.projectType === 'NATB' ? 'bg-eco-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <IconHome size={22} />
                                    </Center>
                                    <Box className="flex-1">
                                        <Text fw={600}>{t('projects.naturalBuilding')}</Text>
                                        <Text size="sm" c="dimmed">{t('projects.filters.natbDescription')}</Text>
                                    </Box>
                                    {tempFilters.projectType === 'NATB' && (
                                        <IconCheck size={22} className="text-eco-primary" />
                                    )}
                                </Group>
                            </UnstyledButton>

                            {/* Permaculture */}
                            <UnstyledButton
                                onClick={() => setTempFilters({ ...tempFilters, projectType: 'PERM' })}
                                className={`rounded-xl border-2 transition-all ${tempFilters.projectType === 'PERM'
                                    ? 'border-eco-terracotta bg-eco-terracotta/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                p="md"
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Center className={`w-12 h-12 rounded-xl ${tempFilters.projectType === 'PERM' ? 'bg-eco-terracotta text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <IconLeaf size={22} />
                                    </Center>
                                    <Box className="flex-1">
                                        <Text fw={600}>{t('projects.permaculture')}</Text>
                                        <Text size="sm" c="dimmed">{t('projects.filters.permDescription')}</Text>
                                    </Box>
                                    {tempFilters.projectType === 'PERM' && (
                                        <IconCheck size={22} className="text-eco-terracotta" />
                                    )}
                                </Group>
                            </UnstyledButton>
                        </Stack>
                    </Stack>
                )}
            </Box>

            {/* Footer - Action buttons */}
            <Box p="md" className="border-t border-gray-200 bg-white">
                {step === 'location' && locationQuery && locationSuggestions.length === 0 && !isSearching && (
                    <Button
                        fullWidth
                        size="lg"
                        radius="md"
                        onClick={() => setStep('dates')}
                        className="bg-eco-primary hover:bg-eco-primaryDark shadow-lg transition-all"
                    >
                        {t('common.continue')}
                    </Button>
                )}
                {step === 'dates' && (
                    <Button
                        fullWidth
                        size="lg"
                        radius="md"
                        onClick={confirmDates}
                        className="bg-eco-primary hover:bg-eco-primaryDark shadow-lg transition-all"
                    >
                        {t('common.continue')}
                    </Button>
                )}
                {step === 'type' && (
                    <Button
                        fullWidth
                        size="lg"
                        radius="md"
                        onClick={applySearch}
                        leftSection={<IconSearch size={20} />}
                        className="bg-eco-primary hover:bg-eco-primaryDark shadow-lg transition-all"
                    >
                        {t('projects.filters.search')}
                    </Button>
                )}
            </Box>
        </div>
    );
}
