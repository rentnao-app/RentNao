import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildListingsQuery } from '../lib/listingSearchQuery';

const LISTING_AREA_OPTIONS = [
  { value: 'DHANMONDI', label: 'Dhanmondi' },
  { value: 'GULSHAN', label: 'Gulshan' },
  { value: 'BANANI', label: 'Banani' },
  { value: 'UTTARA', label: 'Uttara' },
  { value: 'MIRPUR', label: 'Mirpur' },
  { value: 'MOHAMMADPUR', label: 'Mohammadpur' },
  { value: 'BARIDHARA', label: 'Baridhara' },
  { value: 'BASHUNDHARA', label: 'Bashundhara' },
  { value: 'BADDA', label: 'Badda' },
];

const MAX_RENT_OPTIONS = [
  { value: '', label: 'Max. Rent' },
  { value: '20000', label: 'BDT 20K' },
  { value: '35000', label: 'BDT 35K' },
  { value: '50000', label: 'BDT 50K' },
  { value: '80000', label: 'BDT 80K' },
  { value: '100000', label: 'BDT 100K' },
  { value: '200000', label: 'BDT 200K' },
  { value: '200K_PLUS', label: 'BDT 200K+' },
];

const PROPERTY_CATEGORY_OPTIONS = [
  { value: '', label: 'Property Type' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

const ROOM_OPTIONS = [
  { value: '', label: 'Beds' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5+' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
};

function selectClassName(compact) {
  const pad = compact ? 'px-2.5 py-2.5 sm:px-3 sm:py-2.5' : 'px-4 py-3';
  const text = compact ? 'text-xs sm:text-sm' : 'text-sm';
  return `w-full border border-[#deeadf] rounded-xl ${pad} ${text} bg-[#fbfefb] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#66aa75] appearance-none bg-[length:1rem_1rem] bg-[right_0.5rem_center] sm:bg-[right_0.65rem_center] bg-no-repeat pr-8 sm:pr-9`;
}

function areaTriggerClassName(compact) {
  const pad = compact ? 'px-2.5 py-2.5 sm:px-3 sm:py-2.5' : 'px-4 py-3';
  const text = compact ? 'text-xs sm:text-sm' : 'text-sm';
  return `w-full cursor-pointer list-none border border-[#deeadf] rounded-xl ${pad} ${text} bg-[#fbfefb] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#66aa75] flex items-center justify-between gap-1.5 text-left min-w-0 [&::-webkit-details-marker]:hidden`;
}

function MultiSelectArea({ selectedValues, onChange, placeholder = 'Area', compact, detailsClassName }) {
  const detailsRef = useRef(null);
  const selectedLabels = LISTING_AREA_OPTIONS.filter((o) => selectedValues.includes(o.value)).map((o) => o.label);

  useEffect(() => {
    const onDocClick = (event) => {
      const el = detailsRef.current;
      if (!el?.open) return;
      if (!el.contains(event.target)) el.removeAttribute('open');
    };
    const onKey = (event) => {
      if (event.key === 'Escape') detailsRef.current?.removeAttribute('open');
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const toggle = (value) => {
    if (selectedValues.includes(value)) onChange(selectedValues.filter((v) => v !== value));
    else onChange([...selectedValues, value]);
  };

  const panelScrollClass = compact ? 'max-h-none overflow-visible' : 'max-h-56 overflow-y-auto';

  return (
    <details ref={detailsRef} className={`${detailsClassName} overflow-visible`}>
      <summary className={areaTriggerClassName(!!compact)}>
        <span className="truncate text-gray-700">
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div
        className={`absolute left-0 right-0 z-[100] mt-1 min-w-[12rem] rounded-xl border border-[#deeadf] bg-white py-1 shadow-lg ${panelScrollClass}`}
      >
        {LISTING_AREA_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[#f4faf4]"
          >
            <input type="checkbox" checked={selectedValues.includes(option.value)} onChange={() => toggle(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

/**
 * Shared listing search UI (home hero + /listings).
 * @param {{ showSort?: boolean, variant?: 'hero' | 'default', onSubmit?: (filters: object) => void, initialValues?: object, navigateOnSubmit?: boolean }} props
 */
export default function PropertySearchBar({
  showSort = false,
  variant = 'default',
  onSubmit,
  initialValues = {},
  navigateOnSubmit = false,
}) {
  const navigate = useNavigate();
  const [areas, setAreas] = useState(() => initialValues.areas || []);
  const [category, setCategory] = useState(() => initialValues.category || '');
  const [maxRentKey, setMaxRentKey] = useState(() => initialValues.maxRentKey || '');
  const [minRooms, setMinRooms] = useState(() => (initialValues.minRooms != null && initialValues.minRooms !== '' ? String(initialValues.minRooms) : ''));
  const [sortBy, setSortBy] = useState(() => initialValues.sort_by || 'newest');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      areas,
      category,
      maxRentKey,
      minRooms: minRooms === '' ? '' : Number(minRooms),
      sort_by: showSort ? sortBy : 'newest',
    };
    if (navigateOnSubmit) {
      const q = buildListingsQuery(payload);
      navigate(q ? `/listings?${q}` : '/listings');
      return;
    }
    onSubmit?.(payload);
  };

  const isHero = variant === 'hero';
  const formShell =
    isHero
      ? 'w-full max-w-2xl md:max-w-xl lg:max-w-[min(100%,42rem)] bg-white/95 border border-[#d9e9dd] shadow-md rounded-2xl p-2.5 sm:p-3 translate-y-[72%] sm:translate-y-[78%] md:translate-y-0 lg:translate-y-0 overflow-visible'
      : 'w-full bg-white/95 border border-[#d9e9dd] shadow-md rounded-2xl p-3.5 sm:p-4';

  const formRow = isHero
    ? 'grid grid-cols-2 items-stretch gap-1.5 sm:gap-2 md:flex md:flex-nowrap md:min-w-0'
    : 'flex flex-wrap items-stretch gap-2.5 sm:gap-3';

  const heroFieldCell = 'min-w-0 col-span-1 md:flex-1 md:basis-0';
  const selectCls = selectClassName(isHero);

  return (
    <form onSubmit={handleSubmit} className={`${formShell} ${formRow}`}>
      <MultiSelectArea
        selectedValues={areas}
        onChange={setAreas}
        placeholder="Area"
        compact={isHero}
        detailsClassName={
          isHero
            ? `group relative z-[70] ${heroFieldCell}`
            : 'group relative z-10 min-w-[min(100%,10rem)] flex-1 basis-[8.5rem]'
        }
      />

      <div className={isHero ? heroFieldCell : 'min-w-[min(100%,7.5rem)] flex-1 basis-[6.5rem]'}>
        <label htmlFor="psb-category" className="sr-only">
          Property type
        </label>
        <select
          id="psb-category"
          className={selectCls}
          style={selectChevronStyle}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {(isHero
            ? [
                { value: '', label: 'Type' },
                ...PROPERTY_CATEGORY_OPTIONS.slice(1),
              ]
            : PROPERTY_CATEGORY_OPTIONS
          ).map((o) => (
            <option key={o.value || 'any'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={isHero ? heroFieldCell : 'min-w-[min(100%,7.5rem)] flex-1 basis-[6.5rem]'}>
        <label htmlFor="psb-maxrent" className="sr-only">
          Max rent
        </label>
        <select
          id="psb-maxrent"
          className={selectCls}
          style={selectChevronStyle}
          value={maxRentKey}
          onChange={(e) => setMaxRentKey(e.target.value)}
        >
          {(isHero
            ? MAX_RENT_OPTIONS.map((o, i) => (i === 0 ? { ...o, label: 'Rent' } : o))
            : MAX_RENT_OPTIONS
          ).map((o) => (
            <option key={o.value || 'any'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={isHero ? heroFieldCell : 'min-w-[min(100%,6.5rem)] flex-1 basis-[5.5rem]'}>
        <label htmlFor="psb-rooms" className="sr-only">
          Beds
        </label>
        <select
          id="psb-rooms"
          className={selectCls}
          style={selectChevronStyle}
          value={minRooms}
          onChange={(e) => setMinRooms(e.target.value)}
        >
          {ROOM_OPTIONS.map((o) => (
            <option key={o.value || 'any'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {showSort && (
        <div className={isHero ? heroFieldCell : 'min-w-[min(100%,10rem)] flex-1 basis-[8rem]'}>
          <label htmlFor="psb-sort" className="sr-only">
            Sort
          </label>
          <select
            id="psb-sort"
            className={selectCls}
            style={selectChevronStyle}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className={
          isHero
            ? 'col-span-2 w-full rounded-xl bg-[#2f8444] px-3 py-2.5 text-xs font-semibold text-white shadow-sm ring-1 ring-[#256c38]/30 transition hover:bg-[#256c38] sm:px-4 sm:py-3 sm:text-sm md:col-span-1 md:w-auto md:shrink-0 md:self-stretch md:min-w-[5.5rem]'
            : 'min-w-[6.5rem] shrink-0 rounded-xl bg-[#2f8444] px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-[#256c38]/30 transition hover:bg-[#256c38] sm:min-w-[7.5rem]'
        }
      >
        Search
      </button>
    </form>
  );
}
