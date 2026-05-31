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

const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 }; // Dhaka

export default function MapPicker({ value = null, onChange, height = '300px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapsRef = useRef(null);
  const clickListenerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const hasUserSelectedRef = useRef(false);
  const skipNextValuePanRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;
    let cancelled = false;

    loadGoogleMaps()
      .then(async (maps) => {
        if (!maps || cancelled || !containerRef.current || mapRef.current) return;

        try {
          await waitForMapContainer(containerRef.current);
          if (cancelled || !containerRef.current || mapRef.current) return;
          initMap(maps);
        } catch (error) {
          if (!cancelled) setLoadError(formatGoogleMapsError(error));
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(formatGoogleMapsError(error));
      });

    function initMap(maps) {
      const mapContainer = containerRef.current;
      if (!mapContainer) return;

      clearMapContainer(mapContainer);
      mapsRef.current = maps;
      const initialLocation = normalizeLatLng(initialValueRef.current) || DEFAULT_LOCATION;
      const map = new maps.Map(mapContainer, createMapOptions(initialLocation, 13));
      const marker = new maps.Marker({
        position: initialLocation,
        map,
      });

      if (!normalizeLatLng(initialValueRef.current)) {
        onChangeRef.current?.(initialLocation);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              if (cancelled || hasUserSelectedRef.current) return;
              const browserLocation = normalizeLatLng({ lat: coords.latitude, lng: coords.longitude });
              if (!browserLocation) return;
              marker.setPosition(browserLocation);
              map.setCenter(browserLocation);
              map.setZoom(15);
              onChangeRef.current?.(browserLocation);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
          );
        }
      }

      clickListenerRef.current = map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        hasUserSelectedRef.current = true;
        skipNextValuePanRef.current = true;
        marker.setPosition({ lat, lng });
        onChangeRef.current?.({ lat, lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
      window.requestAnimationFrame(() => maps.event.trigger(map, 'resize'));
      setReady(true);
    }

    return () => {
      cancelled = true;
      destroyMapInstance(mapRef.current, mapsRef.current, clickListenerRef.current);
      clearMapContainer(containerRef.current);
      clickListenerRef.current = null;
      mapRef.current = null;
      markerRef.current = null;
      mapsRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const nextLocation = normalizeLatLng(value);
    if (!ready || !nextLocation || !mapRef.current || !markerRef.current) return;

    markerRef.current.setPosition(nextLocation);
    if (skipNextValuePanRef.current) {
      skipNextValuePanRef.current = false;
      return;
    }
    mapRef.current.setCenter(nextLocation);
  }, [value, ready]);

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full min-h-[200px]" />
      {loadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-600">
          {loadError}
        </div>
      ) : null}
    </div>
  );
}
