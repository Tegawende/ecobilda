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
  allPoints?: MissionMapPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMarkerClick?: (point: MissionMapPoint) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  hoveredId?: string | null;
  locale?: string;
}

export interface MissionsMapRef {
  flyTo: (lat: number, lng: number) => void;
  resetView: () => void;
}

export const MissionsMap = forwardRef<MissionsMapRef, MissionsMapProps>(function MissionsMap(
  { points, allPoints, selectedId, onSelect, onMarkerClick, onBoundsChange, hoveredId, locale = 'fr' },
  ref
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: { marker: mapboxgl.Marker; element: HTMLDivElement } }>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [ready, setReady] = useState(false);

  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  const pointsRef = useRef(points);
  const allPointsRef = useRef(allPoints);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);
  useEffect(() => {
    allPointsRef.current = allPoints;
  }, [allPoints]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number) => {
      map.current?.flyTo({ center: [lng, lat], zoom: 10, duration: 1500 });
    },
    resetView: () => {
      if (!map.current) return;
      const all = allPointsRef.current ?? pointsRef.current;
      if (!all || all.length === 0) {
        map.current.flyTo({ center: [4.5, 47.5], zoom: 4, duration: 800 });
        return;
      }
      const bounds = new mapboxgl.LngLatBounds();
      let any = false;
      for (const p of all) {
        if (p.latitude && p.longitude) {
          bounds.extend([p.longitude, p.latitude]);
          any = true;
        }
      }
      if (any) map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
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

    const ids = new Set(points.map((p) => p._id));
    Object.entries(markersRef.current).forEach(([id, { marker }]) => {
      if (!ids.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    for (const pt of points) {
      if (markersRef.current[pt._id]) continue;
      if (!pt.latitude || !pt.longitude) continue;

      const isFormation = pt.type === 'FORMATION';
      const bgColor = isFormation ? '#cc6644' : '#70a771';
      const iconSvg = isFormation
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 5 2 9l10 4 10-4Z"/><path d="m6 12 6 2.5L18 12"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"/></svg>`;

      const el = document.createElement('div');
      el.className = 'mission-marker';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div class="marker-inner" style="
          width: 36px; height: 36px;
          background-color: ${bgColor};
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s;
        ">${iconSvg}</div>
      `;

      const inner = el.querySelector('.marker-inner') as HTMLElement;
      el.addEventListener('mouseenter', () => {
        inner.style.transform = 'scale(1.15)';
        inner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
      });
      el.addEventListener('mouseleave', () => {
        if (selectedId !== pt._id) {
          inner.style.transform = 'scale(1)';
          inner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
        }
      });
      el.addEventListener('click', () => {
        onSelect(pt._id);
        showPopup(pt);
        onMarkerClick?.(pt);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pt.longitude, pt.latitude])
        .addTo(map.current!);

      markersRef.current[pt._id] = { marker, element: el };
    }
  }, [points, ready, onSelect, onMarkerClick]);

  // Fit bounds on full set change
  useEffect(() => {
    if (!map.current || !ready) return;
    const source = allPoints ?? points;
    if (!source || source.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    let any = false;
    for (const p of source) {
      if (p.latitude && p.longitude) {
        bounds.extend([p.longitude, p.latitude]);
        any = true;
      }
    }
    if (any) map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
  }, [allPoints, ready]);

  // Highlight
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { element }]) => {
      const inner = element.querySelector('.marker-inner') as HTMLElement | null;
      if (!inner) return;
      const isActive = id === selectedId || id === hoveredId;
      inner.style.transform = isActive ? 'scale(1.15)' : 'scale(1)';
      inner.style.boxShadow = isActive
        ? '0 4px 12px rgba(0,0,0,0.35)'
        : '0 2px 8px rgba(0,0,0,0.25)';
      element.style.zIndex = isActive ? '10' : '1';
    });
  }, [selectedId, hoveredId]);

  const showPopup = (pt: MissionMapPoint) => {
    if (!map.current || !pt.latitude || !pt.longitude) return;
    if (popupRef.current) popupRef.current.remove();

    const isFormation = pt.type === 'FORMATION';
    const typeLabel = isFormation ? 'FORMATION' : 'CHANTIER';
    const typeColor = isFormation ? '#cc6644' : '#70a771';
    const dates = `${pt.startDate} → ${pt.endDate}`;
    const priceBadge =
      pt.pricingMode === 'PAID' && pt.priceEUR != null
        ? `<span style="background:#222;color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;margin-left:6px;">${pt.priceEUR}€</span>`
        : '';

    const html = `
      <div style="padding: 0; font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
        <div style="padding: 10px 12px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="background:${typeColor};color:white;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.05em;">${typeLabel}</span>
            ${priceBadge}
          </div>
          <h3 style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111;line-height:1.3;">${escapeHtml(pt.title)}</h3>
          <p style="margin:0 0 4px;font-size:12px;color:#666;">${pt.city ?? ''}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#888;">${dates}</p>
          <a href="/${locale}/missions/${pt._id}" style="display:inline-block;background:#70a771;color:white;text-decoration:none;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;">Voir la mission</a>
        </div>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px',
    })
      .setLngLat([pt.longitude, pt.latitude])
      .setHTML(html)
      .addTo(map.current);

    popupRef.current = popup;
    popup.on('close', () => {
      if (popupRef.current === popup) popupRef.current = null;
    });
  };

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '12px' }}
    />
  );
});

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
