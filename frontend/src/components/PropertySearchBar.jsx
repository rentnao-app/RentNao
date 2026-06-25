import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildListingsQuery } from '../lib/listingSearchQuery';
import { useTranslation } from '../lib/i18n';

const LISTING_AREA_VALUES = [
  'DHANMONDI',
  'GULSHAN',
  'BANANI',
  'UTTARA',
  'MIRPUR',
  'MOHAMMADPUR',
  'BARIDHARA',
  'BASHUNDHARA',
  'BADDA',
];

const MAX_RENT_VALUES = [
  { value: '', labelKey: 'search.maxRent' },
  { value: '20000', labelKey: 'search.rentOptions.20k' },
  { value: '35000', labelKey: 'search.rentOptions.35k' },
  { value: '50000', labelKey: 'search.rentOptions.50k' },
  { value: '80000', labelKey: 'search.rentOptions.80k' },
  { value: '100000', labelKey: 'search.rentOptions.100k' },
  { value: '200000', labelKey: 'search.rentOptions.200k' },
  { value: '200K_PLUS', labelKey: 'search.rentOptions.200kPlus' },
];

const PROPERTY_CATEGORY_VALUES = [
  { value: '', labelKey: 'search.propertyType' },
  { value: 'RESIDENTIAL', labelKey: 'search.categories.residential' },
  { value: 'COMMERCIAL', labelKey: 'search.categories.commercial' },
];

const ROOM_VALUES = ['', '1', '2', '3', '4', '5'];

const SORT_VALUES = [
  { value: 'newest', labelKey: 'search.sort.newest' },
  { value: 'price_asc', labelKey: 'search.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'search.sort.priceDesc' },
];

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
};

function selectClassName(compact) {
  const pad = compact ? 'px-2.5 py-2.5 sm:px-3 sm:py-2.5' : 'px-4 py-3';
  const text = compact ? 'text-xs sm:text-sm' : 'text-sm';
  return `w-full min-w-0 border border-[#deeadf] rounded-xl ${pad} ${text} bg-[#fbfefb] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#66aa75] appearance-none bg-[length:1rem_1rem] bg-[right_0.5rem_center] sm:bg-[right_0.65rem_center] bg-no-repeat pr-8 sm:pr-9 truncate`;
}

function areaTriggerClassName(compact) {
  const pad = compact ? 'px-2.5 py-2.5 sm:px-3 sm:py-2.5' : 'px-4 py-3';
  const text = compact ? 'text-xs sm:text-sm' : 'text-sm';
  return `w-full cursor-pointer list-none border border-[#deeadf] rounded-xl ${pad} ${text} bg-[#fbfefb] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#66aa75] flex items-center justify-between gap-1.5 text-left min-w-0 [&::-webkit-details-marker]:hidden`;
}

function MultiSelectArea({ areaOptions, selectedValues, onChange, placeholder, compact, detailsClassName }) {
  const detailsRef = useRef(null);
  const selectedLabels = areaOptions.filter((o) => selectedValues.includes(o.value)).map((o) => o.label);

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
        {areaOptions.map((option) => (
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [areas, setAreas] = useState(() => initialValues.areas || []);
  const [category, setCategory] = useState(() => initialValues.category || '');
  const [maxRentKey, setMaxRentKey] = useState(() => initialValues.maxRentKey || '');
  const [minRooms, setMinRooms] = useState(() => (initialValues.minRooms != null && initialValues.minRooms !== '' ? String(initialValues.minRooms) : ''));
  const [sortBy, setSortBy] = useState(() => initialValues.sort_by || 'newest');

  const areaOptions = useMemo(
    () =>
      LISTING_AREA_VALUES.map((value) => ({
        value,
        label: t(`common.areas.${value}`),
      })),
    [t]
  );

  const maxRentOptions = useMemo(
    () =>
      MAX_RENT_VALUES.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
    [t]
  );

  const heroMaxRentOptions = useMemo(
    () =>
      maxRentOptions.map((o, i) =>
        i === 0 ? { ...o, label: t('search.rentPlaceholder') } : o
      ),
    [maxRentOptions, t]
  );

  const propertyCategoryOptions = useMemo(
    () =>
      PROPERTY_CATEGORY_VALUES.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
    [t]
  );

  const heroPropertyCategoryOptions = useMemo(
    () =>
      propertyCategoryOptions.map((o, i) =>
        i === 0 ? { ...o, label: t('search.typePlaceholder') } : o
      ),
    [propertyCategoryOptions, t]
  );

  const roomOptions = useMemo(
    () =>
      ROOM_VALUES.map((value) => ({
        value,
        label: value === '' ? t('search.beds') : value === '5' ? t('search.beds5Plus') : value,
      })),
    [t]
  );

  const sortOptions = useMemo(
    () =>
      SORT_VALUES.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
    [t]
  );

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
      ? 'w-full max-w-2xl md:max-w-xl lg:max-w-[min(100%,42rem)] bg-white/95 border border-[#d9e9dd] shadow-md rounded-2xl p-2.5 sm:p-3 max-lg:translate-y-0 overflow-visible'
      : 'w-full bg-white/95 border border-[#d9e9dd] shadow-md rounded-2xl p-3.5 sm:p-4';

  const formRow = isHero
    ? 'grid grid-cols-2 items-stretch gap-1.5 sm:gap-2 md:flex md:flex-nowrap md:min-w-0'
    : 'flex flex-wrap items-stretch gap-2.5 sm:gap-3';

  const heroFieldCell = 'min-w-0 col-span-1 md:flex-1 md:basis-0';
  const selectCls = selectClassName(isHero);

  return (
    <form onSubmit={handleSubmit} className={`${formShell} ${formRow}`}>
      <MultiSelectArea
        areaOptions={areaOptions}
        selectedValues={areas}
        onChange={setAreas}
        placeholder={t('search.area')}
        compact={isHero}
        detailsClassName={
          isHero
            ? `group relative z-[70] ${heroFieldCell}`
            : 'group relative z-10 min-w-[min(100%,10rem)] flex-1 basis-[8.5rem]'
        }
      />

      <div className={isHero ? heroFieldCell : 'min-w-[min(100%,7.5rem)] flex-1 basis-[6.5rem]'}>
        <label htmlFor="psb-category" className="sr-only">
          {t('search.propertyTypeSrOnly')}
        </label>
        <select
          id="psb-category"
          className={selectCls}
          style={selectChevronStyle}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {(isHero ? heroPropertyCategoryOptions : propertyCategoryOptions).map((o) => (
            <option key={o.value || 'any'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={isHero ? heroFieldCell : 'min-w-[min(100%,7.5rem)] flex-1 basis-[6.5rem]'}>
        <label htmlFor="psb-maxrent" className="sr-only">
          {t('search.maxRentSrOnly')}
        </label>
        <select
          id="psb-maxrent"
          className={selectCls}
          style={selectChevronStyle}
          value={maxRentKey}
          onChange={(e) => setMaxRentKey(e.target.value)}
        >
          {(isHero ? heroMaxRentOptions : maxRentOptions).map((o) => (
            <option key={o.value || 'any'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={isHero ? heroFieldCell : 'min-w-[min(100%,6.5rem)] flex-1 basis-[5.5rem]'}>
        <label htmlFor="psb-rooms" className="sr-only">
          {t('search.bedsSrOnly')}
        </label>
        <select
          id="psb-rooms"
          className={selectCls}
          style={selectChevronStyle}
          value={minRooms}
          onChange={(e) => setMinRooms(e.target.value)}
        >
          {roomOptions.map((o) => (
            <option key={o.value || 'any'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {showSort && (
        <div className={isHero ? heroFieldCell : 'min-w-[min(100%,10rem)] flex-1 basis-[8rem]'}>
          <label htmlFor="psb-sort" className="sr-only">
            {t('search.sortSrOnly')}
          </label>
          <select
            id="psb-sort"
            className={selectCls}
            style={selectChevronStyle}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map((o) => (
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
        {t('search.search')}
      </button>
    </form>
  );
}
