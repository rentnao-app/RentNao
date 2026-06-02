import { useEffect, useRef, useState } from 'react';
import {
  clearMapContainer,
  createMapOptions,
  destroyMapInstance,
  formatGoogleMapsError,
  loadGoogleMaps,
  normalizeLatLng,
  waitForMapContainer,
} from '../lib/googleMaps';

export default function MapView({ lat, lng, height = '200px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapsRef = useRef(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const position = normalizeLatLng({ lat, lng });
    const container = containerRef.current;
    if (!container || !position) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(async (maps) => {
        if (!maps || cancelled || !containerRef.current) return;

        try {
          await waitForMapContainer(containerRef.current);
          if (cancelled || !containerRef.current) return;

          if (mapRef.current) {
            markerRef.current?.setPosition(position);
            mapRef.current.setCenter(position);
            return;
          }

          clearMapContainer(containerRef.current);
          const map = new maps.Map(containerRef.current, createMapOptions(position, 15));
          markerRef.current = new maps.Marker({
            position,
            map,
          });
          mapRef.current = map;
          mapsRef.current = maps;
          window.requestAnimationFrame(() => maps.event.trigger(map, 'resize'));
        } catch (error) {
          if (!cancelled) setLoadError(formatGoogleMapsError(error));
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(formatGoogleMapsError(error));
      });

    return () => {
      cancelled = true;
      destroyMapInstance(mapRef.current, mapsRef.current);
      clearMapContainer(containerRef.current);
      mapRef.current = null;
      markerRef.current = null;
      mapsRef.current = null;
    };
  }, [lat, lng]);

  if (!normalizeLatLng({ lat, lng })) return null;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full min-h-[160px]" />
      {loadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-600">
          {loadError}
        </div>
      ) : null}
    </div>
  );
}
