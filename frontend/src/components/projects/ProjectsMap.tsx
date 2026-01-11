import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
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
    hoveredProjectId?: number | null;
}

export interface ProjectsMapRef {
    flyTo: (lat: number, lng: number) => void;
}

export const ProjectsMap = forwardRef<ProjectsMapRef, ProjectsMapProps>(function ProjectsMap({
    projects,
    selectedProject,
    onProjectSelect,
    onBoundsChange,
    hoveredProjectId,
}, ref) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: number]: { marker: mapboxgl.Marker; element: HTMLDivElement } }>({});
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Expose flyTo method via ref
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
    }), []);

    // Notify bounds change
    const handleBoundsChange = useCallback(() => {
        if (map.current && onBoundsChange) {
            const bounds = map.current.getBounds();
            onBoundsChange({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            });
        }
    }, [onBoundsChange]);

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

        map.current.on('load', () => {
            setIsMapLoaded(true);
            handleBoundsChange();
        });

        // Handle map move/zoom - Update bounds for filtering
        map.current.on('moveend', handleBoundsChange);

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [handleBoundsChange]);

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
            const bgColor = isNatB ? '#70A771' : '#c3595b';

            // Using SVG icons instead of emojis
            const iconSvg = isNatB
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-15l8-4l8 4v15"/><path d="M12 9v13"/><path d="M8 8l-4 2"/><path d="M20 10l-4-2"/></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 21c1.933 0 3.5-1.568 3.5-3.5V11l-3 -2.5l-3 2.5v6.5c0 1.932 1.567 3.5 3.5 3.5z"/><path d="M14 21c1.933 0 3.5-1.568 3.5-3.5V11l-3-2.5l-3 2.5v6.5c0 1.932 1.567 3.5 3.5 3.5z"/><path d="M10.5 12c1.933 0 3.5-1.568 3.5-3.5V3l-3.5 2.5l-3.5-2.5v5.5c0 1.932 1.567 3.5 3.5 3.5z"/></svg>`;

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

        const coverImage = project.images[0]?.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400';
        const isNatB = project.project_type === 'NATB';
        const typeBadge = isNatB
            ? '<span style="background:#70A771;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">Construction</span>'
            : '<span style="background:#c3595b;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">Permaculture</span>';

        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '280px',
            offset: 25,
        })
            .setLngLat([project.address.longitude, project.address.latitude])
            .setHTML(`
        <div style="padding: 0;">
          <img 
            src="${coverImage}" 
            alt="${project.title}"
            style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px 8px 0 0;"
          />
          <div style="padding: 12px;">
            <div style="margin-bottom:8px;">${typeBadge}</div>
            <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #111; line-height: 1.3;">${project.title}</h3>
            <p style="margin: 0 0 8px; font-size: 12px; color: #666;">${project.address.city}, ${project.address.country?.name || ''}</p>
            <div style="display: flex; gap: 12px; font-size: 11px; color: #888; margin-bottom: 12px;">
              <span>${project.max_helpers} volontaires max</span>
              <span>${project.hours_per_day}h/jour</span>
            </div>
            <a 
              href="/projects/${project.id}" 
              style="display: block; padding: 8px 16px; background: #70A771; color: white; text-align: center; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: 600;"
            >
              Voir le projet
            </a>
          </div>
        </div>
      `)
            .addTo(map.current);

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
