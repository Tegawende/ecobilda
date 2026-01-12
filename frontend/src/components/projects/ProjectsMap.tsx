import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Project } from '../../types';

// Set Mapbox token from env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface ProjectsMapProps {
    projects: Project[];
    selectedProject: Project | null;
    onProjectSelect: (project: Project | null) => void;
    onBoundsChange?: (bounds: MapBounds) => void;
    onMoveStart?: () => void;
    hoveredProjectId?: number | null;
}

export interface ProjectsMapRef {
    flyTo: (lat: number, lng: number) => void;
    resetView: () => void;
}

export const ProjectsMap = forwardRef<ProjectsMapRef, ProjectsMapProps>(function ProjectsMap({
    projects,
    selectedProject,
    onProjectSelect,
    onBoundsChange,
    onMoveStart,
    hoveredProjectId,
}, ref) {
    const { t } = useTranslation();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: number]: { marker: mapboxgl.Marker; element: HTMLDivElement } }>({});
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Keep refs to callbacks to avoid re-initializing map when/if they change
    const onBoundsChangeRef = useRef(onBoundsChange);
    const onMoveStartRef = useRef(onMoveStart);

    useEffect(() => {
        onBoundsChangeRef.current = onBoundsChange;
    }, [onBoundsChange]);

    useEffect(() => {
        onMoveStartRef.current = onMoveStart;
    }, [onMoveStart]);

    // Expose flyTo and resetView methods via ref
    useImperativeHandle(ref, () => ({
        flyTo: (lat: number, lng: number) => {
            if (map.current) {
                map.current.flyTo({
                    center: [lng, lat],
                    zoom: 10,
                    duration: 1500,
                });
            }
        },
        resetView: () => {
            if (!map.current) return;

            // If there are projects, fit bounds to them
            if (projects.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                let hasValidCoords = false;

                projects.forEach((project) => {
                    if (project.address?.latitude && project.address?.longitude) {
                        bounds.extend([project.address.longitude, project.address.latitude]);
                        hasValidCoords = true;
                    }
                });

                if (hasValidCoords) {
                    map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
                    return;
                }
            }

            // Fallback to default Europe view
            map.current.flyTo({
                center: [4.5, 48],
                zoom: 5,
                duration: 1500,
            });
        }
    }), [projects]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [4.5, 48], // Europe center
            zoom: 5,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Helper to get current bounds
        const getBounds = () => {
            if (!map.current) return null;
            const bounds = map.current.getBounds();
            if (!bounds) return null;
            // TypeScript assertion: bounds is not null after check
            const boundsNonNull = bounds;
            return {
                north: boundsNonNull.getNorth(),
                south: boundsNonNull.getSouth(),
                east: boundsNonNull.getEast(),
                west: boundsNonNull.getWest(),
            };
        };

        map.current.on('load', () => {
            setIsMapLoaded(true);
            const bounds = getBounds();
            if (bounds && onBoundsChangeRef.current) {
                onBoundsChangeRef.current(bounds);
            }
        });

        // Handle map move/zoom - use refs to get latest callbacks
        map.current.on('movestart', () => {
            if (onMoveStartRef.current) onMoveStartRef.current();
        });

        map.current.on('moveend', () => {
            const bounds = getBounds();
            if (bounds && onBoundsChangeRef.current) {
                onBoundsChangeRef.current(bounds);
            }
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []); // Empty dependency array - initialize once!

    // Update markers when projects change
    useEffect(() => {
        if (!map.current || !isMapLoaded) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
        markersRef.current = {};

        // Add markers for each project
        projects.forEach((project) => {
            if (!project.address?.latitude || !project.address?.longitude) return;

            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'project-marker';
            el.style.cssText = 'cursor: pointer;';

            const isNatB = project.project_type === 'NATB';
            const bgColor = isNatB ? 'var(--color-eco-primary)' : 'var(--color-eco-terracotta)';

            // Using SVG icons matching IconHome and IconLeaf from Tabler Icons
            const iconSvg = isNatB
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;

            el.innerHTML = `
        <div class="marker-inner" style="
          width: 36px;
          height: 36px;
          background-color: ${bgColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s;
        ">
          ${iconSvg}
        </div>
      `;

            const markerInner = el.querySelector('.marker-inner') as HTMLElement;

            el.addEventListener('mouseenter', () => {
                markerInner.style.transform = 'scale(1.15)';
                markerInner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
            });
            el.addEventListener('mouseleave', () => {
                if (selectedProject?.id !== project.id) {
                    markerInner.style.transform = 'scale(1)';
                    markerInner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                }
            });

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([project.address.longitude, project.address.latitude])
                .addTo(map.current!);

            // Click handler
            el.addEventListener('click', () => {
                onProjectSelect(project);
                showPopup(project);
            });

            markersRef.current[project.id] = { marker, element: el };
        });

        // Fit bounds to show all markers if there are any
        if (projects.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            let hasValidCoords = false;

            projects.forEach((project) => {
                if (project.address?.latitude && project.address?.longitude) {
                    bounds.extend([project.address.longitude, project.address.latitude]);
                    hasValidCoords = true;
                }
            });

            if (hasValidCoords) {
                map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
            }
        }
    }, [projects, isMapLoaded, onProjectSelect]);

    // Show popup for project
    const showPopup = (project: Project) => {
        if (!map.current || !project.address?.latitude || !project.address?.longitude) return;

        // Remove existing popup
        if (popupRef.current) {
            popupRef.current.remove();
        }

        const images = project.images.length > 0
            ? project.images.map(img => img.image)
            : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'];

        // Preload all images for instant switching
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        const isNatB = project.project_type === 'NATB';
        const badgeColor = isNatB ? 'var(--color-eco-primary)' : 'var(--color-eco-terracotta)';
        const badgeText = isNatB ? t('projects.naturalBuilding') : t('projects.permaculture');

        // Icon SVGs for badge - matching IconHome and IconLeaf from Tabler Icons
        const iconSvg = isNatB
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;

        // Amenity icons
        const amenities = [];
        if (project.internet_provided) {
            amenities.push(`<span style="display:inline-flex;align-items:center;gap:2px;padding:2px 6px;background:#f3f4f6;border-radius:9999px;font-size:10px;color:#4b5563;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 18h.01"/><path d="M9.172 15.172a4 4 0 0 1 5.656 0"/><path d="M6.343 12.343a8 8 0 0 1 11.314 0"/><path d="M3.515 9.515a12 12 0 0 1 16.97 0"/></svg>
                ${t('projects.wifi')}
            </span>`);
        }
        if (project.family_friendly) {
            amenities.push(`<span style="display:inline-flex;align-items:center;gap:2px;padding:2px 6px;background:#f3f4f6;border-radius:9999px;font-size:10px;color:#4b5563;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="20" rx="10" ry="3"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="6" r="2"/></svg>
                ${t('projects.familyFriendly')}
            </span>`);
        }
        if (project.pets_allowed) {
            amenities.push(`<span style="display:inline-flex;align-items:center;gap:2px;padding:2px 6px;background:#f3f4f6;border-radius:9999px;font-size:10px;color:#4b5563;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 16c-3 0-5-2-5-5c0-4 5-9 5-9s5 5 5 9c0 3-2 5-5 5z"/><path d="M16 16c-1.5 0-3-1-3-2.5"/></svg>
                ${t('projects.petsAllowed')}
            </span>`);
        }

        // Carousel dots
        const dots = images.map((_, idx) =>
            `<span style="width:${idx === 0 ? '8px' : '6px'};height:6px;border-radius:9999px;background:${idx === 0 ? 'white' : 'rgba(255,255,255,0.5)'};transition:all 0.2s;" data-dot="${idx}"></span>`
        ).join('');

        const popupId = `popup-${project.id}-${Date.now()}`;

        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '320px',
            offset: 25,
            className: 'project-popup'
        })
            .setLngLat([project.address.longitude, project.address.latitude])
            .setHTML(`
        <div id="${popupId}" style="padding: 0; font-family: system-ui, -apple-system, sans-serif; border-radius: 12px; overflow: hidden;">
          <!-- Image Container with Carousel -->
          <div style="position: relative; width: 100%; height: 180px; overflow: hidden;">
            <div class="carousel-images" style="display: flex; width: ${images.length * 100}%; height: 100%; transition: transform 0.3s ease;">
              ${images.map(img => `<img src="${img}" alt="${project.title}" style="width: ${100 / images.length}%; height: 100%; object-fit: cover; flex-shrink: 0;"/>`).join('')}
            </div>
            
            <!-- Top Right Buttons Container (Favorite + Close) -->
            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 10;">
              <!-- Favorite Button -->
              <button class="favorite-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
              <!-- Close Button -->
              <button class="close-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            
            <!-- Type Badge -->
            <div style="position: absolute; top: 10px; left: 10px;">
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: ${badgeColor}; color: white; border-radius: 9999px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${iconSvg}
                ${badgeText}
              </span>
            </div>
            
            ${images.length > 1 ? `
            <!-- Navigation Arrows -->
            <button class="nav-prev" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: #1f2937;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="nav-next" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: #1f2937;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            
            <!-- Dots -->
            <div class="carousel-dots" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px;">
              ${dots}
            </div>
            ` : ''}
          </div>
          
          <!-- Content -->
          <div style="padding: 14px;">
            <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 600; color: #111; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.title}</h3>
            
            <p style="margin: 0 0 10px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              ${project.address.city}, ${project.address.country?.name || ''}
            </p>
            
            <div style="display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 10px;">
              <span style="display: flex; align-items: center; gap: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${project.max_helpers} ${t('projects.max')}
              </span>
              <span style="display: flex; align-items: center; gap: 4px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${project.hours_per_day}${t('projects.hoursPerDayShort')}
              </span>
            </div>
            
            ${amenities.length > 0 ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">${amenities.join('')}</div>` : ''}
            
            <a 
              href="/projects/${project.id}" 
              target="_blank"
              rel="noopener noreferrer"
              style="display: block; padding: 10px 16px; background: var(--color-eco-primary); color: white; text-align: center; text-decoration: none; border-radius: 10px; font-size: 13px; font-weight: 600; transition: background 0.2s;"
              onmouseover="this.style.background='var(--color-eco-primaryDark)'"
              onmouseout="this.style.background='var(--color-eco-primary)'"
            >
              ${t('projects.viewProject') || 'Voir le projet'}
            </a>
          </div>
        </div>
      `)
            .addTo(map.current);

        // Add carousel functionality after popup is added
        setTimeout(() => {
            const popupEl = document.getElementById(popupId);
            if (!popupEl) return;

            let currentIndex = 0;
            const carousel = popupEl.querySelector('.carousel-images') as HTMLElement;
            const dotsContainer = popupEl.querySelector('.carousel-dots');
            const prevBtn = popupEl.querySelector('.nav-prev') as HTMLElement;
            const nextBtn = popupEl.querySelector('.nav-next') as HTMLElement;
            const imageContainer = popupEl.querySelector('div[style*="position: relative"]') as HTMLElement;
            const favoriteBtn = popupEl.querySelector('.favorite-btn') as HTMLButtonElement;
            const closeBtn = popupEl.querySelector('.close-btn') as HTMLButtonElement;

            if (images.length > 1 && imageContainer && prevBtn && nextBtn) {
                // Show arrows on hover
                imageContainer.addEventListener('mouseenter', () => {
                    prevBtn.style.opacity = '1';
                    nextBtn.style.opacity = '1';
                });
                imageContainer.addEventListener('mouseleave', () => {
                    prevBtn.style.opacity = '0';
                    nextBtn.style.opacity = '0';
                });

                // Navigation
                const updateCarousel = () => {
                    if (carousel) {
                        carousel.style.transform = `translateX(-${currentIndex * (100 / images.length)}%)`;
                    }
                    if (dotsContainer) {
                        dotsContainer.querySelectorAll('span').forEach((dot, idx) => {
                            (dot as HTMLElement).style.width = idx === currentIndex ? '8px' : '6px';
                            (dot as HTMLElement).style.background = idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)';
                        });
                    }
                };

                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentIndex = (currentIndex - 1 + images.length) % images.length;
                    updateCarousel();
                });

                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentIndex = (currentIndex + 1) % images.length;
                    updateCarousel();
                });
            }

            // Favorite toggle
            if (favoriteBtn) {
                let isFavorite = false;
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    isFavorite = !isFavorite;
                    const svg = favoriteBtn.querySelector('svg');
                    if (svg) {
                        svg.setAttribute('fill', isFavorite ? 'var(--color-eco-terracotta)' : 'none');
                        svg.setAttribute('stroke', isFavorite ? 'var(--color-eco-terracotta)' : '#666');
                    }
                    favoriteBtn.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        favoriteBtn.style.transform = 'scale(1)';
                    }, 150);
                });
            }

            // Close button handler
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (popupRef.current) {
                        popupRef.current.remove();
                        popupRef.current = null;
                    }
                    onProjectSelect(null);
                });
            }
        }, 50);

        popupRef.current = popup;
    };

    // Highlight hovered project marker
    useEffect(() => {
        Object.entries(markersRef.current).forEach(([id, { element }]) => {
            const markerInner = element.querySelector('.marker-inner') as HTMLElement;
            if (markerInner) {
                if (parseInt(id) === hoveredProjectId) {
                    markerInner.style.transform = 'scale(1.25)';
                    markerInner.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
                    markerInner.style.zIndex = '1000';
                } else {
                    markerInner.style.transform = 'scale(1)';
                    markerInner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                    markerInner.style.zIndex = '1';
                }
            }
        });
    }, [hoveredProjectId]);

    // Pan to selected project
    useEffect(() => {
        if (selectedProject && map.current && selectedProject.address?.latitude && selectedProject.address?.longitude) {
            showPopup(selectedProject);
            map.current.flyTo({
                center: [selectedProject.address.longitude, selectedProject.address.latitude],
                zoom: 11,
                duration: 800,
            });
        }
    }, [selectedProject]);

    return (
        <div
            ref={mapContainer}
            className="w-full h-full"
            style={{ minHeight: '100%' }}
        />
    );
});
