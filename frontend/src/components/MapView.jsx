import { useEffect, useRef } from 'react';

export default function MapView({ lat, lng, height = '200px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || lat == null || lng == null) return;
    let L = window.L;
    if (!L) {
      import('leaflet').then((mod) => {
        L = mod.default;
        window.L = L;
        initMap(L);
      });
    } else {
      initMap(L);
    }

    function initMap(L) {
      const map = L.map(containerRef.current).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  if (lat == null || lng == null) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height }}
    />
  );
}
