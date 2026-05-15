/** Map UI-only area codes to API `AreaName` values (PostgreSQL enum). */
export function normalizeAreaForApi(value) {
  if (value == null || value === '') return value;
  const u = String(value).trim().toUpperCase();
  return u === 'BARIDHARA' ? 'BASHUNDHARA' : u;
}

/** Dedupe after normalization (e.g. Baridhara + Bashundhara → one BASHUNDHARA query). */
export function expandAreasForQuery(areas) {
  return [...new Set((areas || []).map(normalizeAreaForApi).filter(Boolean))];
}

/** Build query string for `/listings` from PropertySearchBar / shared filter payload. */
export function buildListingsQuery(data) {
  const params = new URLSearchParams();
  if (data.areas?.length) params.set('areas', data.areas.join(','));
  if (data.category) params.set('category', data.category);
  if (data.maxRentKey === '200K_PLUS') params.set('minRent', '200000');
  else if (data.maxRentKey) params.set('maxRent', data.maxRentKey);
  if (data.minRooms) params.set('minRooms', String(data.minRooms));
  if (data.sort_by && data.sort_by !== 'newest') params.set('sort', data.sort_by);
  return params.toString();
}
