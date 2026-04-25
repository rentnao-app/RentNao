import { useEffect, useRef, useState } from 'react';

const AREA_OPTIONS = [
  { value: 'DHANMONDI', label: 'Dhanmondi' },
  { value: 'GULSHAN', label: 'Gulshan' },
  { value: 'BANANI', label: 'Banani' },
  { value: 'UTTARA', label: 'Uttara' },
  { value: 'MIRPUR', label: 'Mirpur' },
  { value: 'MOHAMMADPUR', label: 'Mohammadpur' },
  { value: 'BASHUNDHARA', label: 'Bashundhara' },
  { value: 'BADDA', label: 'Badda' },
];

const RENT_RANGE_OPTIONS = [
  { value: '15-40K', label: '15K - 40K' },
  { value: '40-60K', label: '40K - 60K' },
  { value: '60-100K', label: '60K - 100K' },
  { value: '100-200K', label: '100K - 200K' },
  { value: '200K+', label: '200K+' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function MultiSelectDropdown({ label, options, selectedValues, onChange, placeholder }) {
  const detailsRef = useRef(null);
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const detailsEl = detailsRef.current;
      if (!detailsEl) return;
      if (!detailsEl.contains(event.target)) {
        detailsEl.removeAttribute('open');
      }
    };

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      detailsRef.current?.removeAttribute('open');
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange([...selectedValues, value]);
  };

  return (
    <details ref={detailsRef} className="relative min-w-[220px]">
      <summary className="list-none cursor-pointer">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white flex items-center justify-between">
          <span className="truncate">
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
          </span>
          <span className="text-gray-400 ml-2">▼</span>
        </div>
      </summary>
      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-56 overflow-y-auto">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => toggleValue(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

export default function SearchFilterPanel({ initialValues = {}, onSubmit }) {
  const [areas, setAreas] = useState(initialValues.areas || []);
  const [minRent, setMinRent] = useState(initialValues.min_rent ?? '');
  const [maxRent, setMaxRent] = useState(initialValues.max_rent ?? '');
  const [roomCount, setRoomCount] = useState(initialValues.room_count ?? '');
  const [rentRanges, setRentRanges] = useState(initialValues.rent_ranges || []);
  const [sortBy, setSortBy] = useState(initialValues.sort_by || 'newest');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      areas: areas.length > 0 ? areas : undefined,
      min_rent: minRent ? Number(minRent) : undefined,
      max_rent: maxRent ? Number(maxRent) : undefined,
      room_count: roomCount ? Number(roomCount) : undefined,
      rent_ranges: rentRanges.length > 0 ? rentRanges : undefined,
      sort_by: sortBy,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-xl border border-gray-100 mb-6">
      <MultiSelectDropdown
        label="Area"
        options={AREA_OPTIONS}
        selectedValues={areas}
        onChange={setAreas}
        placeholder="Select one or more areas"
      />
      <MultiSelectDropdown
        label="Rent ranges"
        options={RENT_RANGE_OPTIONS}
        selectedValues={rentRanges}
        onChange={setRentRanges}
        placeholder="Select one or more ranges"
      />
      <div className="w-24">
        <label className="block text-xs font-medium text-gray-500 mb-1">Min rent</label>
        <input
          type="number"
          value={minRent}
          onChange={(e) => setMinRent(e.target.value)}
          placeholder="0"
          min="0"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div className="w-24">
        <label className="block text-xs font-medium text-gray-500 mb-1">Max rent</label>
        <input
          type="number"
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
          placeholder="Any"
          min="0"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div className="w-20">
        <label className="block text-xs font-medium text-gray-500 mb-1">Rooms</label>
        <select
          value={roomCount}
          onChange={(e) => setRoomCount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">Sort</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition"
      >
        Search
      </button>
    </form>
  );
}

