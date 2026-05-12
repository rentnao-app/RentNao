import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

let iconsConfigured = false;

function configureLeafletIcons(L) {
  if (!L || iconsConfigured) return;

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2xUrl,
    iconUrl: markerIconUrl,
    shadowUrl: markerShadowUrl,
  });

  iconsConfigured = true;
}

export async function loadLeaflet() {
  if (typeof window === 'undefined') return null;

  if (window.L) {
    configureLeafletIcons(window.L);
    return window.L;
  }

  const mod = await import('leaflet');
  const L = mod.default;
  window.L = L;
  configureLeafletIcons(L);
  return L;
}

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