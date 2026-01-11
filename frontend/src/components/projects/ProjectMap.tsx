import { useEffect, useRef } from 'react';
import { Box, Center, Stack, Text } from '@mantine/core';
import { IconMap } from '@tabler/icons-react';

interface ProjectMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function ProjectMap({ latitude, longitude, title }: ProjectMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Check if Mapbox GL is available
    if (typeof window === 'undefined' || !(window as any).mapboxgl) {
      console.warn('Mapbox GL JS not loaded');
      return;
    }

    const mapboxgl = (window as any).mapboxgl;

    // Check for access token
    if (!mapboxgl.accessToken) {
      console.warn('Mapbox access token not set');
      return;
    }

    // Initialize map only if not already initialized
    if (!mapRef.current && mapContainerRef.current) {
      try {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [longitude, latitude],
          zoom: 12,
          trackResize: true,
          preserveDrawingBuffer: false,
          collectResourceTiming: false,
          // Disable telemetry to prevent CORS errors
          transformRequest: (url: string) => {
            // Block telemetry and analytics requests
            if (url.includes('events.mapbox.com') || 
                url.includes('api.mapbox.com/events') ||
                url.includes('telemetry')) {
              return null;
            }
            return { url };
          },
          // Reduce WebGL warnings
          antialias: false,
          fadeDuration: 0,
        });

        // Add navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Handle WebGL context loss
        mapRef.current.on('webglcontextlost', (e: Event) => {
          e.preventDefault();
          console.warn('WebGL context lost on ProjectMap');
        });

        mapRef.current.on('error', (e: any) => {
          console.warn('Mapbox error on ProjectMap:', e.error);
        });

        // Add marker
        new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="font-size: 14px; font-weight: 500;">${title}</div>`
            )
          )
          .addTo(mapRef.current);
      } catch (error) {
        console.error('Failed to initialize Mapbox map:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, title]);

  // Fallback if Mapbox is not available
  const mapboxAvailable = typeof window !== 'undefined' && (window as any).mapboxgl;

  if (!mapboxAvailable) {
    return (
      <Center h={256} bg="gray.1" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-gray-3)' }}>
        <Stack align="center" gap="xs">
          <IconMap size={48} color="gray" />
          <Text size="sm" c="dimmed">Map view</Text>
          <Text size="xs" c="dimmed">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      ref={mapContainerRef}
      w="100%"
      h={256}
      style={{ borderRadius: 8, border: '1px solid var(--mantine-color-gray-3)' }}
    />
  );
}
