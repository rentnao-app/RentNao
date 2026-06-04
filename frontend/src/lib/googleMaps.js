let loadPromise = null;

export function normalizeLatLng(value) {
  if (!value) return null;
  if (value.lat === null || value.lat === undefined || value.lng === null || value.lng === undefined) return null;
  if (value.lat === '' || value.lng === '') return null;

  const lat = Number(value.lat);
  const lng = Number(value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';
}

function waitForGoogleMaps(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    function check() {
      if (window.google?.maps?.Map) {
        resolve(window.google.maps);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('Google Maps API loaded but Map constructor is unavailable.'));
        return;
      }
      window.setTimeout(check, 50);
    }

    check();
  });
}

export async function loadGoogleMaps() {
  if (typeof window === 'undefined') return null;

  if (window.google?.maps?.Map) return window.google.maps;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY in frontend/.env');
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const callbackName = '__rentnaoGoogleMapsInit';
      const existingScript = document.querySelector('script[data-rentnao-google-maps="true"]');

      window[callbackName] = () => {
        delete window[callbackName];
        waitForGoogleMaps()
          .then(resolve)
          .catch(reject);
      };

      if (existingScript) {
        if (window.google?.maps?.Map) {
          delete window[callbackName];
          resolve(window.google.maps);
          return;
        }
        existingScript.addEventListener('load', () => {
          waitForGoogleMaps().then(resolve).catch(reject);
        }, { once: true });
        existingScript.addEventListener('error', () => {
          delete window[callbackName];
          reject(new Error('Failed to load Google Maps JavaScript API script.'));
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.dataset.rentnaoGoogleMaps = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        delete window[callbackName];
        reject(new Error('Failed to load Google Maps JavaScript API script.'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      loadPromise = null;
      throw error;
    });
  }

  return loadPromise;
}

export function createMapOptions(center, zoom) {
  return {
    center,
    zoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };
}

export function formatGoogleMapsError(error) {
  const message = error?.message || String(error || 'Unknown error');

  if (message.includes('Missing VITE_GOOGLE_MAPS_API_KEY')) {
    return 'Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env and restart the dev server.';
  }
  if (message.includes('RefererNotAllowed') || message.includes('referer')) {
    return 'Google Maps blocked localhost. In Google Cloud → Keys & Credentials → your API key → add http://localhost:5173/* under Website restrictions, save, wait 2 minutes, then refresh.';
  }
  if (message.includes('InvalidKey') || message.includes('InvalidKeyMapError')) {
    return 'Google Maps API key is invalid. Copy the key again from Google Cloud Console.';
  }
  if (message.includes('ApiNotActivated') || message.includes('ApiNotActivatedMapError')) {
    return 'Enable Maps JavaScript API for this key in Google Cloud Console.';
  }
  if (message.includes('IntersectionObserver')) {
    return 'Google Maps failed to attach to the map container. Refresh the page and try again.';
  }

  return 'Could not load Google Maps. Check the browser console and API key restrictions.';
}

export function waitForMapContainer(element, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    function check() {
      if (!element?.isConnected) {
        reject(new Error('Map container is not attached to the page.'));
        return;
      }

      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        resolve(element);
        return;
      }

      if (Date.now() - started >= timeoutMs) {
        reject(new Error('Map container has no visible size.'));
        return;
      }

      window.requestAnimationFrame(check);
    }

    check();
  });
}

export function destroyMapInstance(map, maps, clickListener) {
  if (clickListener && maps?.event) {
    maps.event.removeListener(clickListener);
  }
  if (map && maps?.event) {
    maps.event.clearInstanceListeners(map);
  }
}

export function clearMapContainer(element) {
  if (!element) return;
  element.replaceChildren();
}
