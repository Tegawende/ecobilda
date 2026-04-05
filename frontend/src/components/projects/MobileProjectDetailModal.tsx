'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
    IconArrowLeft,
    IconMapPin,
    IconUsers,
    IconClock,
    IconCalendar,
    IconWifi,
    IconBabyCarriage,
    IconDog,
    IconSmoking,
    IconHome,
    IconLeaf,
    IconStar,
    IconChevronLeft,
    IconChevronRight,
} from '@tabler/icons-react';
import { FavoriteButton } from '../common/FavoriteButton';
import type { Project } from '@/types';
import { Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

interface MobileProjectDetailModalProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
    initialFavorite?: boolean;
}

export function MobileProjectDetailModal({
    project,
    isOpen,
    onClose,
    initialFavorite = false,
}: MobileProjectDetailModalProps) {
    const t = useTranslations();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);

    // Reset image index when project changes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [project?._id]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const images = project?.images && project.images.length > 0
        ? project.images.map(img => img.url || '')
        : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200'];

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    if (!isOpen || !project) return null;

    const isNatB = project.projectType === 'NATB';

    return (
        <div
            className="fixed inset-0 z-[100] bg-white flex flex-col"
            style={{
                animation: 'slideUp 0.3s ease-out',
            }}
        >
            <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

            {/* Image Section with overlaid header */}
            <div className="relative w-full aspect-[16/10] flex-shrink-0">
                {/* Image */}
                <img
                    src={images[currentImageIndex]}
                    alt={`${project.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                />

                {/* Gradient overlay for better button visibility */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg z-10"
                >
                    <IconArrowLeft size={22} className="text-gray-800" />
                </button>

                {/* Favorite Button */}
                <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton
                        projectId={project._id}
                        variant="ghost"
                        size="md"
                        initialFavorite={initialFavorite}
                    />
                </div>

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        {currentImageIndex + 1} / {images.length}
                    </div>
                )}

                {/* Image Navigation */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md z-10 text-gray-800"
                        >
                            <IconChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md z-10 text-gray-800"
                        >
                            <IconChevronRight size={20} />
                        </button>
                    </>
                )}

                {/* Dots Navigation */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-6">
                    {/* Title and Type Badge */}
                    <div>
                        <span className={`inline-flex items-center gap-1.5 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wider shadow-sm ${isNatB ? 'bg-eco-primary' : 'bg-eco-terracotta'
                            }`}>
                            {isNatB ? <IconHome size={12} /> : <IconLeaf size={12} />}
                            {isNatB ? t('projects.naturalBuilding') : t('projects.permaculture')}
                        </span>
                        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">{project.title}</h1>
                        <div className="flex items-center text-gray-500">
                            <IconMapPin size={18} className="mr-1.5" />
                            {project.address?.city}, {project.address?.country?.name}
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-3 font-display">{t('projectDetail.about')}</h2>
                        <p className="text-gray-600 leading-relaxed">{project.description}</p>
                    </div>

                    {/* Work Details */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 font-display">{t('projects.filters.workDetails') || 'Détails du travail'}</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="w-10 h-10 mx-auto rounded-xl bg-eco-primary/10 flex items-center justify-center mb-2">
                                    <IconClock size={20} className="text-eco-primary" />
                                </div>
                                <p className="text-xs text-gray-500">{t('projects.hoursPerDayShort') || 'Heures/jour'}</p>
                                <p className="font-bold text-gray-900">{project.hoursPerDay}h</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 mx-auto rounded-xl bg-eco-primary/10 flex items-center justify-center mb-2">
                                    <IconCalendar size={20} className="text-eco-primary" />
                                </div>
                                <p className="text-xs text-gray-500">{t('projects.daysPerWeekShort') || 'Jours/sem'}</p>
                                <p className="font-bold text-gray-900">{project.daysPerWeek}j</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 mx-auto rounded-xl bg-eco-primary/10 flex items-center justify-center mb-2">
                                    <IconUsers size={20} className="text-eco-primary" />
                                </div>
                                <p className="text-xs text-gray-500">{t('projects.volunteers') || 'Volontaires'}</p>
                                <p className="font-bold text-gray-900">{project.maxHelpers}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 font-display">{t('projects.filters.amenities') || 'Équipements'}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${project.internetProvided ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                                }`}>
                                <IconWifi size={20} className={project.internetProvided ? 'text-eco-primary' : 'text-gray-400'} />
                                <span className="text-sm font-medium">{t('projects.wifi') || 'WiFi'}</span>
                            </div>
                            <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${project.familyFriendly ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                                }`}>
                                <IconBabyCarriage size={20} className={project.familyFriendly ? 'text-eco-primary' : 'text-gray-400'} />
                                <span className="text-sm font-medium">{t('projects.familyFriendly') || 'Familles'}</span>
                            </div>
                            <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${project.petsAllowed ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                                }`}>
                                <IconDog size={20} className={project.petsAllowed ? 'text-eco-primary' : 'text-gray-400'} />
                                <span className="text-sm font-medium">{t('projects.petsAllowed') || 'Animaux'}</span>
                            </div>
                            <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${project.smokingAllowed ? 'border-eco-primary bg-eco-primary/5' : 'border-gray-200 opacity-50'
                                }`}>
                                <IconSmoking size={20} className={project.smokingAllowed ? 'text-eco-primary' : 'text-gray-400'} />
                                <span className="text-sm font-medium">{t('projects.smokingAllowed') || 'Fumeur'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Host */}
                    {project.owner && (
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 font-display">{t('projectDetail.yourHost') || 'Votre hôte'}</h2>
                            <div className="flex items-center gap-4">
                                <img
                                    src={project.owner?.profilePictureUrl || undefined}
                                    alt={`${project.owner?.firstName} ${project.owner?.lastName}`}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-eco-primary"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {project.owner?.firstName} {project.owner?.lastName}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <IconStar size={16} className="text-yellow-500 mr-1" />
                                        {Number(project.owner?.averageRating || 0).toFixed(1)} ({project.owner?.reviewCount} {t('projectDetail.reviews') || 'avis'})
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Date Selection */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                        <div className="text-gray-500 text-sm mb-3">{t('projectDetail.selectDates')}</div>
                        <DatePickerInput
                            type="range"
                            placeholder={t('projectDetail.pickDates')}
                            value={dates}
                            onChange={setDates}
                            numberOfColumns={1}
                            size="md"
                            radius="xl"
                            leftSection={<IconCalendar size={18} stroke={1.5} />}
                            styles={{
                                input: {
                                    borderColor: '#e5e7eb',
                                    '&:focus': {
                                        borderColor: 'var(--eco-primary)',
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Spacer for fixed button */}
                    <div className="h-20" />
                </div>
            </div>

            {/* Fixed Apply Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-10">
                <Button fullWidth size="lg" radius="xl" color="eco-primary" className="shadow-lg shadow-eco-primary/20">
                    {t('projectDetail.apply')}
                </Button>
            </div>
        </div>
    );
}
