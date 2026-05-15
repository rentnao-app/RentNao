import { useEffect, useRef } from 'react';
import { loadLeaflet, normalizeLatLng } from '../lib/leaflet';

export default function MapView({ lat, lng, height = '200px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const position = normalizeLatLng({ lat, lng });
    if (!containerRef.current || !position) return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (!L || cancelled || !containerRef.current) return;
      if (mapRef.current) {
        markerRef.current?.setLatLng([position.lat, position.lng]);
        mapRef.current.setView([position.lat, position.lng], mapRef.current.getZoom());
        return;
      }
      initMap(L, position);
    });

    function initMap(L, position) {
      const map = L.map(containerRef.current).setView([position.lat, position.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      markerRef.current = L.marker([position.lat, position.lng]).addTo(map);
      mapRef.current = map;
      window.requestAnimationFrame(() => map.invalidateSize());
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng]);

  if (!normalizeLatLng({ lat, lng })) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height }}
    />
  );
}