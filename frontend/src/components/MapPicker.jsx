import { useEffect, useRef, useState } from 'react';

const DEFAULT_CENTER = [23.8103, 90.4125]; // Dhaka

export default function MapPicker({ value = null, onChange, height = '300px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
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
      const center = initialValueRef.current ? [initialValueRef.current.lat, initialValueRef.current.lng] : DEFAULT_CENTER;
      const map = L.map(containerRef.current).setView(center, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = initialValueRef.current
        ? L.marker([initialValueRef.current.lat, initialValueRef.current.lng]).addTo(map)
        : null;
      markerRef.current = marker;

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(map);
        onChangeRef.current?.({ lat, lng });
      });

      mapRef.current = map;
      setReady(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !value || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
  }, [value, ready]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height }}
    />
  );
}
