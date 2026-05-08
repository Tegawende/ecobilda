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

    const images = pt.images && pt.images.length > 0
      ? pt.images
      : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'];

    // Preload
    images.forEach((src) => {
      const i = new Image();
      i.src = src;
    });

    const isFormation = pt.type === 'FORMATION';
    const badgeColor = isFormation ? '#cc6644' : '#70a771';
    const badgeText = isFormation ? 'FORMATION' : 'CHANTIER';
    const iconSvg = isFormation
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 5 2 9l10 4 10-4Z"/><path d="m6 12 6 2.5L18 12"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"/></svg>`;

    const priceBadge =
      pt.pricingMode === 'PAID' && pt.priceEUR != null
        ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#1f2937;color:white;border-radius:9999px;font-size:11px;font-weight:700;box-shadow:0 2px 4px rgba(0,0,0,0.1);">${pt.priceEUR}€</span>`
        : '';

    const amenities: string[] = [];
    if (pt.internetProvided) {
      amenities.push(`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:#f3f4f6;border-radius:9999px;font-size:10px;color:#4b5563;">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 18h.01"/><path d="M9.172 15.172a4 4 0 0 1 5.656 0"/><path d="M6.343 12.343a8 8 0 0 1 11.314 0"/><path d="M3.515 9.515a12 12 0 0 1 16.97 0"/></svg>
        WiFi
      </span>`);
    }
    if (pt.familyFriendly) {
      amenities.push(`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:#f3f4f6;border-radius:9999px;font-size:10px;color:#4b5563;">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="20" rx="10" ry="3"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="6" r="2"/></svg>
        Familles
      </span>`);
    }
    if (pt.petsAllowed) {
      amenities.push(`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:#f3f4f6;border-radius:9999px;font-size:10px;color:#4b5563;">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 16c-3 0-5-2-5-5c0-4 5-9 5-9s5 5 5 9c0 3-2 5-5 5z"/></svg>
        Animaux
      </span>`);
    }

    const dots = images
      .map(
        (_, idx) =>
          `<span style="width:${idx === 0 ? '8px' : '6px'};height:6px;border-radius:9999px;background:${idx === 0 ? 'white' : 'rgba(255,255,255,0.5)'};transition:all 0.2s;" data-dot="${idx}"></span>`
      )
      .join('');

    const popupId = `mpopup-${pt._id}-${Date.now()}`;
    const dates = `${pt.startDate} → ${pt.endDate}`;
    const cityLine = [pt.city, pt.countryName].filter(Boolean).join(', ');

    const html = `
      <div id="${popupId}" style="padding: 0; font-family: system-ui, -apple-system, sans-serif; border-radius: 12px; overflow: hidden;">
        <div style="position: relative; width: 100%; height: 160px; overflow: hidden;">
          <div class="carousel-images" style="display: flex; width: ${images.length * 100}%; height: 100%; transition: transform 0.3s ease;">
            ${images
              .map(
                (img) =>
                  `<img src="${escapeHtml(img)}" alt="${escapeHtml(pt.title)}" style="width: ${100 / images.length}%; height: 100%; object-fit: cover; flex-shrink: 0;"/>`
              )
              .join('')}
          </div>

          <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 10;">
            <button class="close-btn" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </div>

          <div style="position: absolute; top: 10px; left: 10px; display:flex; gap:6px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: ${badgeColor}; color: white; border-radius: 9999px; font-size: 11px; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: 0.04em;">
              ${iconSvg}
              ${badgeText}
            </span>
            ${priceBadge}
          </div>

          ${
            images.length > 1
              ? `
            <button class="nav-prev" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: #1f2937;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="nav-next" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: #1f2937;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <div class="carousel-dots" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px;">
              ${dots}
            </div>`
              : ''
          }
        </div>

        <div style="padding: 14px;">
          <h3 style="margin: 0 0 6px; font-size: 15px; font-weight: 600; color: #111; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(pt.title)}</h3>

          ${
            cityLine
              ? `<p style="margin: 0 0 8px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHtml(cityLine)}
            </p>`
              : ''
          }

          <div style="display: flex; gap: 14px; font-size: 12px; color: #666; margin-bottom: 8px;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
              ${dates}
            </span>
          </div>

          ${
            pt.maxParticipants || pt.hoursPerDay
              ? `<div style="display: flex; gap: 14px; font-size: 12px; color: #666; margin-bottom: 10px;">
            ${
              pt.maxParticipants
                ? `<span style="display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ${pt.maxParticipants} max
            </span>`
                : ''
            }
            ${
              pt.hoursPerDay
                ? `<span style="display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${pt.hoursPerDay}h/jour
            </span>`
                : ''
            }
          </div>`
              : ''
          }

          ${
            amenities.length > 0
              ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">${amenities.join('')}</div>`
              : ''
          }

          <a
            href="/${locale}/missions/${pt._id}"
            style="display: block; padding: 10px 16px; background: #70a771; color: white; text-align: center; text-decoration: none; border-radius: 10px; font-size: 13px; font-weight: 600; transition: background 0.2s;"
            onmouseover="this.style.background='#5a8f61'"
            onmouseout="this.style.background='#70a771'"
          >
            Voir la mission
          </a>
        </div>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '280px',
      offset: 25,
      className: 'mission-popup',
    })
      .setLngLat([pt.longitude, pt.latitude])
      .setHTML(html)
      .addTo(map.current);

    popupRef.current = popup;
    popup.on('close', () => {
      if (popupRef.current === popup) popupRef.current = null;
    });

    // Wire up carousel + close after render
    setTimeout(() => {
      const popupEl = document.getElementById(popupId);
      if (!popupEl) return;

      let currentIndex = 0;
      const carousel = popupEl.querySelector('.carousel-images') as HTMLElement | null;
      const dotsContainer = popupEl.querySelector('.carousel-dots');
      const prevBtn = popupEl.querySelector('.nav-prev') as HTMLElement | null;
      const nextBtn = popupEl.querySelector('.nav-next') as HTMLElement | null;
      const closeBtn = popupEl.querySelector('.close-btn') as HTMLButtonElement | null;
      const imageContainer = popupEl.firstElementChild as HTMLElement | null;

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          popup.remove();
        });
      }

      if (images.length > 1 && imageContainer && prevBtn && nextBtn && carousel) {
        imageContainer.addEventListener('mouseenter', () => {
          prevBtn.style.opacity = '1';
          nextBtn.style.opacity = '1';
        });
        imageContainer.addEventListener('mouseleave', () => {
          prevBtn.style.opacity = '0';
          nextBtn.style.opacity = '0';
        });

        const update = () => {
          carousel.style.transform = `translateX(-${currentIndex * (100 / images.length)}%)`;
          if (dotsContainer) {
            dotsContainer.querySelectorAll('span').forEach((dot, idx) => {
              const el = dot as HTMLElement;
              el.style.background = idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)';
              el.style.width = idx === currentIndex ? '8px' : '6px';
            });
          }
        };

        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentIndex = (currentIndex - 1 + images.length) % images.length;
          update();
        });
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          currentIndex = (currentIndex + 1) % images.length;
          update();
        });
      }
    }, 0);
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
