import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RangeSlider } from '@mantine/core';
import {
    IconFilter,
    IconX,
    IconWifi,
    IconBabyCarriage,
    IconDog,
    IconSmoking,
    IconLeaf,
    IconHome,
    IconCalendar,
    IconMapPin,
    IconChevronLeft,
    IconChevronRight,
    IconSearch,
    IconLoader2,
} from '@tabler/icons-react';
import { MobileSearchModal } from './MobileSearchModal';

export interface ProjectFiltersState {
    projectType: 'all' | 'NATB' | 'PERM';
    location: { name: string; lat: number; lng: number } | null;
    dateRange: { start: Date | null; end: Date | null };
    maxHelpers: [number, number];
    hoursPerDay: [number, number];
    daysPerWeek: [number, number];
    internetProvided: boolean;
    familyFriendly: boolean;
    petsAllowed: boolean;
    smokingAllowed: boolean;
}

interface ProjectFiltersProps {
    filters: ProjectFiltersState;
    onFiltersChange: (filters: ProjectFiltersState) => void;
    onLocationSelect?: (lat: number, lng: number) => void;
    onClear?: () => void;
}

export const defaultFilters: ProjectFiltersState = {
    projectType: 'all',
    location: null,
    dateRange: { start: null, end: null },
    maxHelpers: [1, 30],
    hoursPerDay: [1, 10],
    daysPerWeek: [1, 7],
    internetProvided: false,
    familyFriendly: false,
    petsAllowed: false,
    smokingAllowed: false,
};

// Get Mapbox token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Mapbox Geocoding API search
interface MapboxFeature {
    id: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
    place_type: string[];
    text: string;
    context?: { id: string; text: string }[];
}

async function searchMapboxLocations(query: string): Promise<MapboxFeature[]> {
    if (!query || query.length < 2 || !MAPBOX_TOKEN) return [];

    try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
            `access_token=${MAPBOX_TOKEN}&types=place,locality,region,country&limit=5&language=fr`
        );

        if (!response.ok) return [];

        const data = await response.json();
        return data.features || [];
    } catch (error) {
        console.error('Mapbox geocoding error:', error);
        return [];
    }
}

// Dual-Month Calendar Component (Airbnb-style)
function Calendar({
    selectedStart,
    selectedEnd,
    onSelect,
    onClose,
}: {
    selectedStart: Date | null;
    selectedEnd: Date | null;
    onSelect: (start: Date | null, end: Date | null) => void;
    onClose: () => void;
}) {
    const [baseMonth, setBaseMonth] = useState(() => {
        // Start with the month of selectedStart, or current month
        if (selectedStart) {
            return new Date(selectedStart.getFullYear(), selectedStart.getMonth(), 1);
        }
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });
    const [selectingEnd, setSelectingEnd] = useState(false);
    const [tempStart, setTempStart] = useState<Date | null>(selectedStart);
    const [tempEnd, setTempEnd] = useState<Date | null>(selectedEnd);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

    const { t, i18n } = useTranslation();

    // Get day names starting with Sunday (like Airbnb)
    const dayNames = [0, 1, 2, 3, 4, 5, 6].map(d =>
        new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(new Date(2024, 0, d)) // Jan 2024 starts on Monday, so d=0 is Sunday
    );

    // Calculate the second month
    const secondMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1);

    const getMonthName = (date: Date) => {
        return new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(date);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: (Date | null)[] = [];

        // Add empty days for the first week (Sunday = 0)
        const startDay = firstDay.getDay();
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Add actual days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const isInRange = (date: Date) => {
        if (!tempStart) return false;

        // If we're selecting end date and hovering, show preview range
        if (selectingEnd && hoveredDate) {
            const rangeEnd = hoveredDate >= tempStart ? hoveredDate : tempStart;
            const actualStart = hoveredDate >= tempStart ? tempStart : hoveredDate;
            return date > actualStart && date < rangeEnd;
        }

        if (!tempEnd) return false;
        return date > tempStart && date < tempEnd;
    };

    const isRangeStart = (date: Date) => {
        if (!tempStart) return false;
        return date.toDateString() === tempStart.toDateString();
    };

    const isRangeEnd = (date: Date) => {
        if (selectingEnd && hoveredDate && tempStart) {
            const endDate = hoveredDate >= tempStart ? hoveredDate : tempStart;
            const startDate = hoveredDate >= tempStart ? tempStart : hoveredDate;
            if (date.toDateString() === endDate.toDateString() && endDate.toDateString() !== startDate.toDateString()) {
                return true;
            }
        }
        if (!tempEnd) return false;
        return date.toDateString() === tempEnd.toDateString();
    };

    const isSelected = (date: Date) => {
        return isRangeStart(date) || isRangeEnd(date);
    };

    const handleDayClick = (date: Date) => {
        if (!selectingEnd || !tempStart) {
            setTempStart(date);
            setTempEnd(null);
            setSelectingEnd(true);
        } else {
            if (date < tempStart) {
                setTempStart(date);
                setTempEnd(tempStart);
            } else if (date.toDateString() === tempStart.toDateString()) {
                // Clicking same date - reset
                setTempStart(date);
                setTempEnd(null);
                setSelectingEnd(true);
            } else {
                setTempEnd(date);
            }
            setSelectingEnd(false);
            setHoveredDate(null);
        }
    };

    const handleApply = () => {
        onSelect(tempStart, tempEnd);
        onClose();
    };

    const handleClear = () => {
        setTempStart(null);
        setTempEnd(null);
        setSelectingEnd(false);
        onSelect(null, null);
        onClose();
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we can go to previous month (not before current month)
    const canGoPrev = baseMonth > new Date(today.getFullYear(), today.getMonth(), 1);

    // Render a single month
    const renderMonth = (monthDate: Date) => {
        const days = getDaysInMonth(monthDate);

        return (
            <div className="flex-1 min-w-[280px]">
                {/* Month name */}
                <div className="text-center mb-4">
                    <span className="font-semibold text-gray-900 capitalize">
                        {getMonthName(monthDate)}
                    </span>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 mb-1">
                    {dayNames.map((day, idx) => (
                        <div key={idx} className="text-center text-xs text-gray-500 font-medium py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                    {days.map((date, idx) => {
                        const isPast = date && date < today;
                        const isStart = date && isRangeStart(date);
                        const isEnd = date && isRangeEnd(date);
                        const inRange = date && isInRange(date);
                        const selected = date && isSelected(date);

                        return (
                            <div
                                key={idx}
                                className={`relative h-10 flex items-center justify-center
                                    ${inRange ? 'bg-gray-100' : ''}
                                    ${isStart && (tempEnd || (selectingEnd && hoveredDate)) ? 'bg-gradient-to-r from-transparent via-gray-100 to-gray-100 rounded-l-full' : ''}
                                    ${isEnd && tempStart && (!isStart || tempEnd) ? 'bg-gradient-to-l from-transparent via-gray-100 to-gray-100 rounded-r-full' : ''}
                                `}
                            >
                                {date && (
                                    <button
                                        onClick={() => handleDayClick(date)}
                                        onMouseEnter={() => selectingEnd && setHoveredDate(date)}
                                        onMouseLeave={() => setHoveredDate(null)}
                                        disabled={!!isPast}
                                        className={`w-10 h-10 rounded-full text-sm font-medium flex items-center justify-center transition-all
                                            ${isPast ? 'text-gray-300 cursor-not-allowed line-through' : 'cursor-pointer'}
                                            ${!isPast && !selected ? 'hover:bg-gray-200' : ''}
                                            ${selected ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}
                                            ${inRange && !selected ? '' : ''}
                                            ${date.toDateString() === today.toDateString() && !selected ? 'font-bold' : ''}
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50" style={{ width: '640px' }}>
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1))}
                    disabled={!canGoPrev}
                    className={`p-2 rounded-full transition-colors ${canGoPrev ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                >
                    <IconChevronLeft size={20} />
                </button>
                <div className="flex-1" />
                <button
                    onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                    <IconChevronRight size={20} />
                </button>
            </div>

            {/* Two months side by side */}
            <div className="flex gap-8">
                {renderMonth(baseMonth)}
                {renderMonth(secondMonth)}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <button
                    onClick={handleClear}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 underline cursor-pointer"
                >
                    {t('common.clear')}
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        {t('common.apply')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Toggle button for amenities (simple on/off)
const AmenityToggle = ({
    value,
    onChange,
    icon: Icon,
    label,
}: {
    value: boolean;
    onChange: (val: boolean) => void;
    icon: React.ElementType;
    label: string;
}) => (
    <button
        onClick={() => onChange(!value)}
        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer w-full ${value
            ? 'border-eco-primary bg-eco-primary/10'
            : 'border-gray-200 hover:border-gray-300'
            }`}
    >
        <Icon size={24} className={value ? 'text-eco-primary' : 'text-gray-400'} />
        <span className="text-sm font-medium text-gray-700 flex-1 text-left">{label}</span>
        <div className={`w-10 h-6 rounded-full transition-all ${value ? 'bg-eco-primary' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-all mt-0.5 ${value ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
        </div>
    </button>
);

// Mantine Range slider component
const RangeInput = ({
    label,
    value,
    onChange,
    min,
    max,
    unit,
}: {
    label: string;
    value: [number, number];
    onChange: (val: [number, number]) => void;
    min: number;
    max: number;
    unit: string;
}) => {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-sm text-gray-500">
                    {value[0]} - {value[1]} {unit}
                </span>
            </div>
            <RangeSlider
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                step={1}
                minRange={1}
                color="eco-primary"
                size="md"
                styles={{
                    track: { height: 8 },
                    thumb: {
                        height: 18,
                        width: 18,
                        borderWidth: 2,
                    },
                }}
            />
        </div>
    );
};

export function ProjectFilters({ filters, onFiltersChange, onLocationSelect, onClear }: ProjectFiltersProps) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [tempFilters, setTempFilters] = useState(filters);
    const [locationQuery, setLocationQuery] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<MapboxFeature[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const locationRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
                setShowLocationDropdown(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync locationQuery when filters.location changes (e.g., cleared from parent)
    useEffect(() => {
        if (filters.location === null) {
            setLocationQuery('');
            setLocationSuggestions([]);
        }
    }, [filters.location]);

    // Debounced Mapbox search
    const handleLocationSearch = (query: string) => {
        setLocationQuery(query);
        setShowLocationDropdown(true);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length < 2) {
            setLocationSuggestions([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        // Debounce the API call
        debounceRef.current = setTimeout(async () => {
            const results = await searchMapboxLocations(query);
            setLocationSuggestions(results);
            setIsSearching(false);
        }, 300);
    };

    const setFilter = <K extends keyof ProjectFiltersState>(key: K, value: ProjectFiltersState[K]) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const handleLocationSelect = (feature: MapboxFeature) => {
        const [lng, lat] = feature.center;
        setFilter('location', {
            name: feature.place_name,
            lat,
            lng,
        });
        setLocationQuery(feature.text);
        setShowLocationDropdown(false);
        setLocationSuggestions([]);
        onLocationSelect?.(lat, lng);
    };

    const clearLocation = () => {
        setFilter('location', null);
        setLocationQuery('');
        setLocationSuggestions([]);
    };

    const countActiveFilters = () => {
        let count = 0;
        if (filters.internetProvided) count++;
        if (filters.familyFriendly) count++;
        if (filters.petsAllowed) count++;
        if (filters.smokingAllowed) count++;
        if (filters.hoursPerDay[0] > 1 || filters.hoursPerDay[1] < 10) count++;
        if (filters.daysPerWeek[0] > 1 || filters.daysPerWeek[1] < 7) count++;
        if (filters.maxHelpers[0] > 1 || filters.maxHelpers[1] < 30) count++;
        return count;
    };

    const activeFilterCount = countActiveFilters();

    const hasActiveFilters =
        filters.projectType !== 'all' ||
        filters.location !== null ||
        filters.dateRange.start !== null ||
        activeFilterCount > 0;

    const clearAllFilters = () => {
        onFiltersChange(defaultFilters);
        setTempFilters(defaultFilters);
        setLocationQuery('');
        setLocationSuggestions([]);
        onClear?.();
    };

    const openModal = () => {
        setTempFilters(filters);
        setShowModal(true);
    };

    const applyFilters = () => {
        onFiltersChange(tempFilters);
        setShowModal(false);
    };

    const setTempFilter = <K extends keyof ProjectFiltersState>(key: K, value: ProjectFiltersState[K]) => {
        setTempFilters({ ...tempFilters, [key]: value });
    };



    const formatDateRange = () => {
        if (!filters.dateRange.start && !filters.dateRange.end) return t('projects.filters.dates') || 'Dates';
        const format = (d: Date) => d.toLocaleDateString();
        if (filters.dateRange.start && filters.dateRange.end) {
            return `${format(filters.dateRange.start)} - ${format(filters.dateRange.end)}`;
        }
        if (filters.dateRange.start) {
            return `${t('projects.filters.startingFrom') || 'À partir du'} ${format(filters.dateRange.start)}`;
        }
        return t('projects.filters.dates') || 'Dates';
    };

    // Get location icon based on type
    const getLocationIcon = (feature: MapboxFeature) => {
        const type = feature.place_type?.[0] || 'place';
        if (type === 'country') return '🌍';
        if (type === 'region') return '📍';
        return '📍';
    };

    return (
        <>
            {/* Mobile Search Bar */}
            <div className="sm:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        {/* Centered Search Input - triggers modal */}
                        <button
                            onClick={() => setShowMobileSearch(true)}
                            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-full border border-gray-300 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
                        >
                            <IconSearch size={20} className="text-eco-primary" />
                            <div className="flex-1 min-w-0">
                                {filters.location || filters.dateRange.start || filters.projectType !== 'all' ? (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {filters.location?.name?.split(',')[0] || t('projects.filters.anywhere') || 'Partout'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {formatDateRange()}
                                            {filters.projectType !== 'all' && ` · ${filters.projectType === 'NATB' ? t('projects.naturalBuilding') : t('projects.permaculture')}`}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">{t('projects.filters.searchPlaceholder') || 'Où allez-vous ?'}</p>
                                )}
                            </div>
                        </button>

                        {/* Filter Button */}
                        <button
                            onClick={openModal}
                            className={`p-3 rounded-full border transition-all cursor-pointer ${activeFilterCount > 0
                                ? 'border-eco-primary bg-eco-primary/10'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <IconFilter size={18} className={activeFilterCount > 0 ? 'text-eco-primary' : 'text-gray-600'} />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-eco-primary text-white text-[10px] flex items-center justify-center font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Reset Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="p-3 rounded-full border border-gray-300 hover:border-gray-400 cursor-pointer"
                            >
                                <IconX size={18} className="text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="px-6 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Location Input with Mapbox Autocomplete */}
                        <div className="relative" ref={locationRef}>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all min-w-[220px] ${showLocationDropdown ? 'border-eco-primary ring-2 ring-eco-primary/20' : 'border-gray-300'
                                }`}>
                                {isSearching ? (
                                    <IconLoader2 size={18} className="text-gray-400 animate-spin" />
                                ) : (
                                    <IconSearch size={18} className="text-gray-400" />
                                )}
                                <input
                                    type="text"
                                    value={locationQuery}
                                    onChange={(e) => handleLocationSearch(e.target.value)}
                                    onFocus={() => setShowLocationDropdown(true)}
                                    placeholder={t('projects.filters.searchPlaceholder') || 'Où allez-vous ?'}
                                    className="flex-1 outline-none text-sm bg-transparent"
                                />
                                {filters.location && (
                                    <button onClick={clearLocation} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                        <IconX size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Mapbox Location Dropdown */}
                            {showLocationDropdown && (locationSuggestions.length > 0 || isSearching) && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-full min-w-[280px] max-h-72 overflow-y-auto z-50">
                                    {isSearching ? (
                                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                            <IconLoader2 size={20} className="animate-spin mx-auto mb-2" />
                                            {t('projects.filters.searching') || 'Recherche...'}
                                        </div>
                                    ) : (
                                        locationSuggestions.map((feature) => (
                                            <button
                                                key={feature.id}
                                                onClick={() => handleLocationSelect(feature)}
                                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                                    {getLocationIcon(feature)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{feature.text}</p>
                                                    <p className="text-xs text-gray-500 truncate">{feature.place_name}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* No results state */}
                            {showLocationDropdown && locationQuery.length >= 2 && !isSearching && locationSuggestions.length === 0 && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-4 px-4 w-full min-w-[280px] z-50">
                                    <div className="text-center text-gray-500 text-sm">
                                        <IconMapPin size={24} className="mx-auto mb-2 text-gray-400" />
                                        {t('projects.filters.noResultsFor') || 'Aucun résultat pour'} "{locationQuery}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date Picker */}
                        <div className="relative" ref={calendarRef}>
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer ${filters.dateRange.start ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <IconCalendar size={18} className="text-gray-400" />
                                <span className="text-sm">{formatDateRange()}</span>
                            </button>

                            {showCalendar && (
                                <Calendar
                                    selectedStart={filters.dateRange.start}
                                    selectedEnd={filters.dateRange.end}
                                    onSelect={(start, end) => setFilter('dateRange', { start, end })}
                                    onClose={() => setShowCalendar(false)}
                                />
                            )}
                        </div>

                        {/* Project Type Pills - Icons only on mobile, text on desktop */}
                        <div className="flex gap-1 p-1 bg-gray-100 rounded-full">
                            <button
                                onClick={() => setFilter('projectType', 'all')}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${filters.projectType === 'all'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {t('projects.filters.all')}
                            </button>
                            <button
                                onClick={() => setFilter('projectType', 'NATB')}
                                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${filters.projectType === 'NATB'
                                    ? 'bg-eco-primary text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                title={t('projects.naturalBuilding')}
                            >
                                <IconHome size={16} />
                                <span className="hidden sm:inline">{t('projects.naturalBuilding')}</span>
                            </button>
                            <button
                                onClick={() => setFilter('projectType', 'PERM')}
                                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${filters.projectType === 'PERM'
                                    ? 'bg-eco-terracotta text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                title={t('projects.permaculture')}
                            >
                                <IconLeaf size={16} />
                                <span className="hidden sm:inline">{t('projects.permaculture')}</span>
                            </button>
                        </div>

                        {/* Filters Button */}
                        <button
                            onClick={openModal}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${activeFilterCount > 0
                                ? 'border-eco-primary bg-eco-primary/5'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <IconFilter size={16} />
                            <span className="text-sm font-semibold">{t('common.filter')}</span>
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-eco-primary text-white text-xs flex items-center justify-center font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                                <IconX size={14} />
                                {t('projects.clearFilters')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl mx-4">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                            >
                                <IconX size={20} />
                            </button>
                            <h2 className="font-display font-bold text-lg">{t('common.filter')}</h2>
                            <button
                                onClick={() => setTempFilters(defaultFilters)}
                                className="text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                            >
                                {t('common.reset')}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-8">
                            {/* Amenities */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">{t('projects.filters.amenities') || 'Équipements & Conditions'}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <AmenityToggle
                                        value={tempFilters.internetProvided}
                                        onChange={(val) => setTempFilter('internetProvided', val)}
                                        icon={IconWifi}
                                        label={t('projects.filters.wifi') || 'WiFi inclus'}
                                    />
                                    <AmenityToggle
                                        value={tempFilters.familyFriendly}
                                        onChange={(val) => setTempFilter('familyFriendly', val)}
                                        icon={IconBabyCarriage}
                                        label={t('projects.filters.family') || 'Familles bienvenues'}
                                    />
                                    <AmenityToggle
                                        value={tempFilters.petsAllowed}
                                        onChange={(val) => setTempFilter('petsAllowed', val)}
                                        icon={IconDog}
                                        label={t('projects.filters.pets') || 'Animaux acceptés'}
                                    />
                                    <AmenityToggle
                                        value={tempFilters.smokingAllowed}
                                        onChange={(val) => setTempFilter('smokingAllowed', val)}
                                        icon={IconSmoking}
                                        label={t('projects.filters.smoking') || 'Fumeur autorisé'}
                                    />
                                </div>
                            </div>

                            {/* Work Details */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">{t('projects.filters.workDetails')}</h3>
                                <div className="space-y-6">
                                    <RangeInput
                                        label={t('projects.hoursPerDay')}
                                        value={tempFilters.hoursPerDay}
                                        onChange={(val) => setTempFilter('hoursPerDay', val)}
                                        min={1}
                                        max={10}
                                        unit="h"
                                    />
                                    <RangeInput
                                        label={t('projects.daysPerWeek')}
                                        value={tempFilters.daysPerWeek}
                                        onChange={(val) => setTempFilter('daysPerWeek', val)}
                                        min={1}
                                        max={7}
                                        unit="j"
                                    />
                                    <RangeInput
                                        label={t('projects.filters.maxVolunteers')}
                                        value={tempFilters.maxHelpers}
                                        onChange={(val) => setTempFilter('maxHelpers', val)}
                                        min={1}
                                        max={30}
                                        unit=""
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-6 py-2.5 bg-eco-primary text-white font-semibold rounded-lg hover:bg-eco-primaryDark transition-all cursor-pointer"
                            >
                                {t('projects.filters.applyFilters')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Search Modal (Airbnb-style) */}
            <MobileSearchModal
                isOpen={showMobileSearch}
                onClose={() => setShowMobileSearch(false)}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onLocationSelect={onLocationSelect}
            />
        </>
    );
}
