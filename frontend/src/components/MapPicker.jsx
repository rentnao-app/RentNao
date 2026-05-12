import { useEffect, useRef, useState } from 'react';
import { loadLeaflet, normalizeLatLng } from '../lib/leaflet';

const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 }; // Dhaka

export default function MapPicker({ value = null, onChange, height = '300px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const hasUserSelectedRef = useRef(false);
  const skipNextValuePanRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (!L || cancelled || !containerRef.current || mapRef.current) return;
      initMap(L);
    });

    function initMap(L) {
      leafletRef.current = L;
      const initialLocation = normalizeLatLng(initialValueRef.current) || DEFAULT_LOCATION;
      const map = L.map(containerRef.current).setView([initialLocation.lat, initialLocation.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      markerRef.current = L.marker([initialLocation.lat, initialLocation.lng]).addTo(map);

      if (!normalizeLatLng(initialValueRef.current)) {
        onChangeRef.current?.(initialLocation);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              if (cancelled || hasUserSelectedRef.current) return;
              const browserLocation = normalizeLatLng({ lat: coords.latitude, lng: coords.longitude });
              if (!browserLocation) return;
              markerRef.current?.setLatLng([browserLocation.lat, browserLocation.lng]);
              map.setView([browserLocation.lat, browserLocation.lng], 15);
              onChangeRef.current?.(browserLocation);
            },
            () => { },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
          );
        }
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        hasUserSelectedRef.current = true;
        skipNextValuePanRef.current = true;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(map);
        onChangeRef.current?.({ lat, lng });
      });

      mapRef.current = map;
      window.requestAnimationFrame(() => map.invalidateSize());
      setReady(true);
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        leafletRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const nextLocation = normalizeLatLng(value);
    if (!ready || !nextLocation || !mapRef.current || !leafletRef.current) return;

    if (markerRef.current) markerRef.current.setLatLng([nextLocation.lat, nextLocation.lng]);
    else markerRef.current = leafletRef.current.marker([nextLocation.lat, nextLocation.lng]).addTo(mapRef.current);
    if (skipNextValuePanRef.current) {
      skipNextValuePanRef.current = false;
      return;
    }
    mapRef.current.setView([nextLocation.lat, nextLocation.lng], mapRef.current.getZoom());
  }, [value, ready]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height }}
    />
  );
}