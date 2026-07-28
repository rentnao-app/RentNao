import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearMapContainer,
  createMapOptions,
  destroyMapInstance,
  formatGoogleMapsError,
  GOOGLE_MAPS_AUTH_FAILURE,
  loadGoogleMaps,
  normalizeLatLng,
  subscribeToGoogleMapsAuthFailure,
  waitForMapContainer,
} from '../lib/googleMaps';
import { useTranslation } from '../lib/i18n';

const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 }; // Dhaka
const PIN_ZOOM = 18;

function geoErrorKey(error) {
  if (!error) return 'unknown';
  if (error.code === 1) return 'permissionDenied';
  if (error.code === 2) return 'unavailable';
  if (error.code === 3) return 'timeout';
  return 'unknown';
}

export default function MapPicker({ value = null, onChange, height = '300px' }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapsRef = useRef(null);
  const clickListenerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const skipNextValuePanRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [showPrompt, setShowPrompt] = useState(!normalizeLatLng(value));
  const [manualMode, setManualMode] = useState(false);
  const [hasPinned, setHasPinned] = useState(Boolean(normalizeLatLng(value)));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const applyLocation = useCallback((latLng, { fromGps = false } = {}) => {
    const normalized = normalizeLatLng(latLng);
    if (!normalized || !mapRef.current || !markerRef.current) return;

    skipNextValuePanRef.current = true;
    markerRef.current.setPosition(normalized);
    mapRef.current.setCenter(normalized);
    mapRef.current.setZoom(PIN_ZOOM);
    onChangeRef.current?.(normalized);
    setHasPinned(true);
    setShowPrompt(false);
    setGeoError('');
    if (fromGps) setManualMode(false);
  }, []);

  const requestDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(t('components.mapPicker.errors.unsupported'));
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoLoading(false);
        const browserLocation = normalizeLatLng({
          lat: coords.latitude,
          lng: coords.longitude,
        });
        if (!browserLocation) {
          setGeoError(t('components.mapPicker.errors.unavailable'));
          return;
        }
        applyLocation(browserLocation, { fromGps: true });
      },
      (error) => {
        setGeoLoading(false);
        setGeoError(t(`components.mapPicker.errors.${geoErrorKey(error)}`));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [applyLocation, t]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;
    let cancelled = false;

    const unsubscribeAuthFailure = subscribeToGoogleMapsAuthFailure(() => {
      if (!cancelled) setLoadError(formatGoogleMapsError(new Error(GOOGLE_MAPS_AUTH_FAILURE)));
    });

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

      const savedLocation = normalizeLatLng(initialValueRef.current);
      const initialLocation = savedLocation || DEFAULT_LOCATION;
      const map = new maps.Map(mapContainer, createMapOptions(initialLocation, savedLocation ? PIN_ZOOM : 12));
      const marker = new maps.Marker({
        position: initialLocation,
        map,
        visible: Boolean(savedLocation),
      });

      if (savedLocation) {
        onChangeRef.current?.(savedLocation);
      }

      clickListenerRef.current = map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        marker.setVisible(true);
        applyLocation({ lat, lng });
        setManualMode(true);
        setShowPrompt(false);
      });

      mapRef.current = map;
      markerRef.current = marker;
      window.requestAnimationFrame(() => maps.event.trigger(map, 'resize'));
      setReady(true);
    }

    return () => {
      cancelled = true;
      unsubscribeAuthFailure();
      destroyMapInstance(mapRef.current, mapsRef.current, clickListenerRef.current);
      clearMapContainer(containerRef.current);
      clickListenerRef.current = null;
      mapRef.current = null;
      markerRef.current = null;
      mapsRef.current = null;
      setReady(false);
    };
  }, [applyLocation]);

  useEffect(() => {
    const nextLocation = normalizeLatLng(value);
    if (!ready || !nextLocation || !mapRef.current || !markerRef.current) return;

    markerRef.current.setVisible(true);
    markerRef.current.setPosition(nextLocation);
    if (skipNextValuePanRef.current) {
      skipNextValuePanRef.current = false;
      return;
    }
    mapRef.current.setCenter(nextLocation);
    mapRef.current.setZoom(PIN_ZOOM);
  }, [value, ready]);

  const showLocationOverlay = ready && showPrompt && !loadError;
  const showManualHint = ready && manualMode && !hasPinned && !loadError;

  return (
    <div className="space-y-2">
      <div
        className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
        style={{ height }}
      >
        <div ref={containerRef} className="h-full w-full min-h-[200px]" />

        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 px-4 text-center text-sm text-gray-600">
            {loadError}
          </div>
        ) : null}

        {showLocationOverlay ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1e4732]/55 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white p-5 shadow-xl sm:p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-center text-base font-bold text-gray-900 sm:text-lg">
                {t('components.mapPicker.promptTitle')}
              </h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">
                {t('components.mapPicker.promptBody')}
              </p>

              {geoError ? (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-800">
                  {geoError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={requestDeviceLocation}
                disabled={geoLoading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
              >
                {geoLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('components.mapPicker.locating')}
                  </>
                ) : (
                  t('components.mapPicker.useMyLocation')
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPrompt(false);
                  setManualMode(true);
                  setGeoError('');
                }}
                disabled={geoLoading}
                className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60"
              >
                {t('components.mapPicker.pickManually')}
              </button>
            </div>
          </div>
        ) : null}

        {showManualHint ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
            <p className="rounded-full bg-white/95 px-4 py-2 text-center text-xs font-medium text-gray-700 shadow-md sm:text-sm">
              {t('components.mapPicker.manualHint')}
            </p>
          </div>
        ) : null}

        {ready && !loadError && !showLocationOverlay ? (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-center">
            <button
              type="button"
              onClick={requestDeviceLocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-md transition hover:bg-white disabled:opacity-70 sm:text-sm"
            >
              {geoLoading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                  {t('components.mapPicker.locating')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {t('components.mapPicker.useMyLocationShort')}
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {hasPinned ? (
        <p className="text-xs text-gray-500 sm:text-sm">{t('components.mapPicker.adjustHint')}</p>
      ) : null}
    </div>
  );
}
