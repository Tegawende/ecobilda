'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Center, Stack, Text, Box } from '@mantine/core';
import { IconMap } from '@tabler/icons-react';
import type { Project } from '@/types';

interface InteractiveMapProps {
  projects: Project[];
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export function InteractiveMap({ projects, onBoundsChange }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const router = useRouter();
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Keep callback ref up to date without causing re-renders
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  // Handle WebGL context loss
  const handleWebGLError = useCallback(() => {
    if (mapRef.current) {
      try {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
        setMapError('WebGL context lost. Please refresh the page.');
      } catch (error) {
        console.error('Error handling WebGL context loss:', error);
      }
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).mapboxgl) {
      console.warn('Mapbox GL JS not loaded');
      return;
    }

    const mapboxgl = (window as any).mapboxgl;

    if (!mapboxgl.accessToken) {
      console.warn('Mapbox access token not set');
      return;
    }

    if (!mapRef.current && mapContainerRef.current) {
      try {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [2.3522, 48.8566], // Paris as default center
          zoom: 4,
          trackResize: true,
          preserveDrawingBuffer: false,
          collectResourceTiming: false,
          // Disable telemetry to prevent CORS errors
          transformRequest: (url: string, resourceType: string) => {
            // Block telemetry and analytics requests to prevent CORS errors
            if (url.includes('events.mapbox.com') || 
                url.includes('api.mapbox.com/events') ||
                url.includes('telemetry') ||
                url.includes('analytics') ||
                resourceType === 'Event') {
              return null;
            }
            return { url };
          },
          // Reduce WebGL warnings
          antialias: false,
          fadeDuration: 0,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // Handle bounds change
        map.on('moveend', () => {
          if (onBoundsChangeRef.current && mapRef.current) {
            try {
              const bounds = map.getBounds();
              onBoundsChangeRef.current({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
              });
            } catch (error) {
              console.warn('Error getting map bounds:', error);
            }
          }
        });

        map.on('load', () => {
          setIsMapReady(true);
          setMapError(null);
        });

        // Handle WebGL context loss
        map.on('webglcontextlost', (e: Event) => {
          e.preventDefault();
          handleWebGLError();
        });

        map.on('webglcontextrestored', () => {
          setMapError(null);
          setIsMapReady(true);
        });

        // Handle errors
        map.on('error', (e: any) => {
          console.warn('Mapbox error:', e.error);
          if (e.error?.message?.includes('WebGL')) {
            handleWebGLError();
          }
        });

        mapRef.current = map;
      } catch (error) {
        console.error('Failed to initialize Mapbox map:', error);
        setMapError('Failed to load map. Please refresh the page.');
      }
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [handleWebGLError]);

  // Update markers when projects change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      markersRef.current = [];

      // Add new markers
      projects.forEach(project => {
        if (!project.address?.latitude || !project.address?.longitude) {
          console.warn(`Project ${project._id} missing coordinates:`, {
            hasAddress: !!project.address,
            latitude: project.address?.latitude,
            longitude: project.address?.longitude,
          });
          return;
        }

        try {
          const el = document.createElement('div');
          el.className = 'marker';
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.borderRadius = '50%';
          el.style.cursor = 'pointer';
          el.style.backgroundImage = project.images?.[0]?.url
            ? `url(${project.images[0].url})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

          const marker = new mapboxgl.Marker(el)
            .setLngLat([project.address.longitude, project.address.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${project.title}</h3>
                  <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
                    ${project.address?.city ?? ''}, ${project.address?.country?.name ?? ''}
                  </p>
                  <p style="font-size: 12px; color: #888;">
                    ${project.projectType === 'PERM' ? 'Permaculture' : 'Natural Building'}
                  </p>
                </div>
              `)
            )
            .addTo(mapRef.current);

          // Navigate to project on marker click
          el.addEventListener('click', () => {
            router.push(`/projects/${project._id}`);
          });

          markersRef.current.push(marker);
        } catch (error) {
          console.warn('Error adding marker for project:', project._id, error);
        }
      });

      // Fit bounds to show all markers
      if (projects.length > 0 && markersRef.current.length > 0) {
        try {
          const bounds = new mapboxgl.LngLatBounds();
          projects.forEach(project => {
            if (project.address?.latitude && project.address?.longitude) {
              bounds.extend([project.address.longitude, project.address.latitude]);
            }
          });
          if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 12, duration: 0 });
          } else {
            console.warn('No valid coordinates found for any project');
          }
        } catch (error) {
          console.warn('Error fitting bounds:', error);
        }
      } else if (projects.length > 0 && markersRef.current.length === 0) {
        console.warn(`No markers created for ${projects.length} projects. Check coordinates.`);
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [projects, isMapReady, router]);

  const mapboxAvailable = typeof window !== 'undefined' && (window as any).mapboxgl;

  if (!mapboxAvailable) {
    return (
      <Center h="100%" bg="gray.1" style={{ borderRadius: 8 }}>
        <Stack align="center" gap="xs">
          <IconMap size={48} color="gray" />
          <Text size="sm" c="dimmed">Map view unavailable</Text>
        </Stack>
      </Center>
    );
  }

  if (mapError) {
    return (
      <Center h="100%" bg="gray.1" style={{ borderRadius: 8 }}>
        <Stack align="center" gap="xs">
          <IconMap size={48} color="red" />
          <Text size="sm" c="red">{mapError}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      ref={mapContainerRef}
      w="100%"
      h="100%"
      style={{ minHeight: 500, borderRadius: 8 }}
    />
  );
}
