import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { ProjectFiltersState } from './ProjectFilters';

// Mapbox Geocoding
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

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
    const { t, i18n } = useTranslation();
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
            const results = await searchMapboxLocations(query, i18n.language);
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
    const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(currentMonth);
    const dayNames = [0, 1, 2, 3, 4, 5, 6].map(d =>
        new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(new Date(2024, 0, d + 1))
    );

    const formatDate = (date: Date) => {
        // Return simple format to debug build
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 cursor-pointer">
                    <IconArrowLeft size={22} />
                </button>
                <div className="flex gap-1.5">
                    {(['location', 'dates', 'type'] as const).map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-all ${step === s ? 'bg-eco-primary w-4' :
                                (s === 'location' ? 'bg-eco-primary/50' :
                                    s === 'dates' && step === 'type' ? 'bg-eco-primary/50' : 'bg-gray-300')
                                }`}
                        />
                    ))}
                </div>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100 cursor-pointer">
                    <IconX size={22} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Step 1: Location */}
                {step === 'location' && (
                    <div className="p-4">
                        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{t('projects.filters.whereToGo') || 'Où allez-vous ?'}</h2>
                        <p className="text-gray-500 mb-6">{t('projects.filters.searchByLocation') || 'Recherchez par ville, région ou pays'}</p>

                        <div className="relative mb-4">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 focus-within:border-eco-primary bg-white">
                                {isSearching ? (
                                    <IconLoader2 size={20} className="text-gray-400 animate-spin" />
                                ) : (
                                    <IconMapPin size={20} className="text-gray-400" />
                                )}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={locationQuery}
                                    onChange={(e) => handleLocationSearch(e.target.value)}
                                    placeholder={t('projects.filters.locationPlaceholder') || 'Ex: Bruxelles, Ardennes...'}
                                    className="flex-1 outline-none text-lg bg-transparent"
                                />
                                {locationQuery && (
                                    <button onClick={() => { setLocationQuery(''); setLocationSuggestions([]); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                        <IconX size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {locationSuggestions.length > 0 && (
                            <div className="space-y-1">
                                {locationSuggestions.map((feature) => (
                                    <button
                                        key={feature.id}
                                        onClick={() => selectLocation(feature)}
                                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <IconMapPin size={18} className="text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{feature.text}</p>
                                            <p className="text-sm text-gray-500 truncate">{feature.place_name}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Flexible option */}
                        <button
                            onClick={skipLocation}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors mt-4 cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-eco-primary/10 flex items-center justify-center">
                                <IconSearch size={18} className="text-eco-primary" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">{t('projects.filters.flexible') || 'Je suis flexible'}</p>
                                <p className="text-sm text-gray-500">{t('projects.filters.searchEverywhere') || 'Rechercher partout'}</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Step 2: Dates */}
                {step === 'dates' && (
                    <div className="p-4">
                        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{t('projects.filters.whenToGo') || 'Quand partez-vous ?'}</h2>
                        <p className="text-gray-500 mb-6">{t('projects.filters.selectDates') || 'Sélectionnez vos dates'}</p>

                        {/* Calendar */}
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                    className="p-2 hover:bg-white rounded-full cursor-pointer"
                                >
                                    <IconChevronLeft size={20} />
                                </button>
                                <span className="font-semibold text-gray-900 capitalize">
                                    {monthName} {currentMonth.getFullYear()}
                                </span>
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                    className="p-2 hover:bg-white rounded-full cursor-pointer"
                                >
                                    <IconChevronRight size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {dayNames.map((day) => (
                                    <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {getDaysInMonth(currentMonth).map((date, idx) => (
                                    <div key={idx} className="aspect-square">
                                        {date && (
                                            <button
                                                onClick={() => handleDayClick(date)}
                                                disabled={date < today}
                                                className={`w-full h-full rounded-full text-sm flex items-center justify-center transition-all cursor-pointer
                          ${date < today ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-white'}
                          ${isSelected(date) ? 'bg-eco-primary text-white' : ''}
                          ${isInRange(date) && !isSelected(date) ? 'bg-eco-primary/20' : ''}
                        `}
                                            >
                                                {date.getDate()}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected dates display */}
                        {tempFilters.dateRange.start && (
                            <div className="mt-4 p-3 bg-eco-primary/10 rounded-xl text-center">
                                <span className="text-eco-primary font-medium">
                                    {formatDate(tempFilters.dateRange.start)}
                                    {tempFilters.dateRange.end && (
                                        <> → {formatDate(tempFilters.dateRange.end)}</>
                                    )}
                                </span>
                            </div>
                        )}

                        {/* Skip option */}
                        <button
                            onClick={skipDates}
                            className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-900 cursor-pointer"
                        >
                            {t('projects.filters.skipDates') || 'Dates flexibles'}
                        </button>
                    </div>
                )}

                {/* Step 3: Type */}
                {step === 'type' && (
                    <div className="p-4">
                        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{t('projects.filters.whatType') || 'Quel type de projet ?'}</h2>
                        <p className="text-gray-500 mb-6">{t('projects.filters.chooseType') || 'Choisissez le type de projet'}</p>

                        <div className="space-y-3">
                            {/* All */}
                            <button
                                onClick={() => setTempFilters({ ...tempFilters, projectType: 'all' })}
                                className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${tempFilters.projectType === 'all'
                                    ? 'border-eco-primary bg-eco-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tempFilters.projectType === 'all' ? 'bg-eco-primary text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <IconSearch size={22} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900">{t('projects.filters.all')}</p>
                                    <p className="text-sm text-gray-500">{t('projects.filters.allDescription') || 'Tous les types de projets'}</p>
                                </div>
                                {tempFilters.projectType === 'all' && (
                                    <IconCheck size={22} className="text-eco-primary" />
                                )}
                            </button>

                            {/* Natural Building */}
                            <button
                                onClick={() => setTempFilters({ ...tempFilters, projectType: 'NATB' })}
                                className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${tempFilters.projectType === 'NATB'
                                    ? 'border-eco-primary bg-eco-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tempFilters.projectType === 'NATB' ? 'bg-eco-primary text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <IconHome size={22} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900">{t('projects.naturalBuilding')}</p>
                                    <p className="text-sm text-gray-500">{t('projects.filters.natbDescription') || 'Construction écologique'}</p>
                                </div>
                                {tempFilters.projectType === 'NATB' && (
                                    <IconCheck size={22} className="text-eco-primary" />
                                )}
                            </button>

                            {/* Permaculture */}
                            <button
                                onClick={() => setTempFilters({ ...tempFilters, projectType: 'PERM' })}
                                className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all cursor-pointer ${tempFilters.projectType === 'PERM'
                                    ? 'border-eco-terracotta bg-eco-terracotta/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tempFilters.projectType === 'PERM' ? 'bg-eco-terracotta text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    <IconLeaf size={22} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900">{t('projects.permaculture')}</p>
                                    <p className="text-sm text-gray-500">{t('projects.filters.permDescription') || 'Jardins et agriculture durable'}</p>
                                </div>
                                {tempFilters.projectType === 'PERM' && (
                                    <IconCheck size={22} className="text-eco-terracotta" />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Action buttons */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {step === 'location' && locationQuery && locationSuggestions.length === 0 && !isSearching && (
                    <button
                        onClick={() => setStep('dates')}
                        className="w-full py-4 bg-eco-primary text-white font-bold rounded-xl shadow-lg cursor-pointer hover:bg-eco-primaryDark transition-all"
                    >
                        {t('common.continue') || 'Continuer'}
                    </button>
                )}
                {step === 'dates' && (
                    <button
                        onClick={confirmDates}
                        className="w-full py-4 bg-eco-primary text-white font-bold rounded-xl shadow-lg cursor-pointer hover:bg-eco-primaryDark transition-all"
                    >
                        {t('common.continue') || 'Continuer'}
                    </button>
                )}
                {step === 'type' && (
                    <button
                        onClick={applySearch}
                        className="w-full py-4 bg-eco-primary text-white font-bold rounded-xl shadow-lg cursor-pointer hover:bg-eco-primaryDark transition-all flex items-center justify-center gap-2"
                    >
                        <IconSearch size={20} />
                        {t('projects.filters.search') || 'Rechercher'}
                    </button>
                )}
            </div>
        </div>
    );
}
