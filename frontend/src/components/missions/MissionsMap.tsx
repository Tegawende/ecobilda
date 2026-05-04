'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MissionMapPoint } from '@/types';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MissionsMapProps {
  points: MissionMapPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  hoveredId?: string | null;
}

export interface MissionsMapRef {
  flyTo: (lat: number, lng: number) => void;
  resetView: () => void;
}

export const MissionsMap = forwardRef<MissionsMapRef, MissionsMapProps>(function MissionsMap(
  { points, selectedId, onSelect, onBoundsChange, hoveredId },
  ref
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [ready, setReady] = useState(false);
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number) => {
      map.current?.flyTo({ center: [lng, lat], zoom: 11, duration: 1000 });
    },
    resetView: () => {
      map.current?.flyTo({ center: [4.5, 47.5], zoom: 4, duration: 800 });
    },
  }));

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [4.5, 47.5],
      zoom: 4,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.current.on('load', () => setReady(true));

    map.current.on('moveend', () => {
      if (!map.current || !onBoundsChangeRef.current) return;
      const b = map.current.getBounds();
      if (!b) return;
      onBoundsChangeRef.current({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Render markers
  useEffect(() => {
    if (!map.current || !ready) return;

    // Remove markers no longer in points
    const ids = new Set(points.map((p) => p._id));
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!ids.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update
    for (const pt of points) {
      if (markersRef.current[pt._id]) continue;

      const el = document.createElement('div');
      el.className = 'mission-marker';
      const isFormation = pt.type === 'FORMATION';
      const color = isFormation ? '#cc6644' : '#70a771';
      el.innerHTML = `
        <div style="width:32px;height:32px;border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    background:${color};
                    border:2px solid white;
                    box-shadow:0 2px 6px rgba(0,0,0,0.3);
                    cursor:pointer;
                    transition:transform 0.2s;">
          <div style="transform:rotate(45deg);
                      color:white;
                      font-size:14px;
                      font-weight:700;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      width:100%;height:100%;">
            ${isFormation ? '€' : '✚'}
          </div>
        </div>
      `;

      el.addEventListener('click', () => onSelect(pt._id));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([pt.longitude, pt.latitude])
        .addTo(map.current);

      markersRef.current[pt._id] = marker;
    }
  }, [points, ready, onSelect]);

  // Highlight selected/hovered
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const isActive = id === selectedId || id === hoveredId;
      el.style.zIndex = isActive ? '10' : '1';
      el.style.transform = isActive ? 'scale(1.15)' : 'scale(1)';
    });
  }, [selectedId, hoveredId]);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '12px' }}
    />
  );
});
