import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiFetch, isLoggedIn } from '../lib/api';
import MapPicker from '../components/MapPicker';
import ImageUploader from '../components/ImageUploader';
import { addLocalNotification } from '../lib/notifications';

/** Matches MapPicker default center so API always receives coordinates before the user clicks. */
const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 };

function formatApiError(body) {
  if (!body) return '';
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
  }
  return body.error || body.message || '';
}

export default function CreateListingPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    property_size: '',
    room_count: '',
    bathroom_count: '',
    balcony_count: '0',
    area_name: '',
    address: '',
    building_floors: '',
    building_facing: 'NORTH',
    has_lift: false,
    has_generator: false,
    has_security_guard: false,
    intended_tenant_type: 'BOTH',
    rent: '',
  });
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPropertyId, setCreatedPropertyId] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isLoggedIn()) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const body = {
        title: form.title,
        description: form.description,
        propertySizeSqft: form.property_size ? parseFloat(form.property_size) : undefined,
        roomCount: form.room_count ? parseFloat(form.room_count) : undefined,
        bathroomCount: form.bathroom_count ? parseFloat(form.bathroom_count) : undefined,
        balconyCount: form.balcony_count ? parseInt(form.balcony_count, 10) : 0,
        areaName: form.area_name || undefined,
        // Backend requires a string; omitting empty address breaks Zod validation.
        address: (form.address ?? '').trim(),
        exactLat: location?.lat ?? DEFAULT_LOCATION.lat,
        exactLng: location?.lng ?? DEFAULT_LOCATION.lng,
        buildingFloors: form.building_floors ? parseInt(form.building_floors, 10) : undefined,
        buildingFacing: form.building_facing,
        hasLift: !!form.has_lift,
        hasGenerator: !!form.has_generator,
        hasSecurityGuard: !!form.has_security_guard,
        intendedTenantType: form.intended_tenant_type,
      };

      const createPropertyRes = await apiFetch('/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const createPropertyBody = await createPropertyRes.json().catch(() => ({}));
      if (!createPropertyRes.ok) {
        throw new Error(
          formatApiError(createPropertyBody) || createPropertyBody?.message || 'Failed to create property'
        );
      }
      const propertyId = createPropertyBody?.data?.propertyId;
      if (!propertyId) throw new Error('Property created but property ID missing.');
      setCreatedPropertyId(propertyId);

      const now = new Date();
      const listingStartDate = new Date(now.getTime() + 60 * 1000).toISOString();
      const createListingRes = await apiFetch(`/properties/${propertyId}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rent: parseFloat(form.rent),
          listingStartDate,
        }),
      });
      const createListingBody = await createListingRes.json().catch(() => ({}));
      if (!createListingRes.ok) {
        throw new Error(
          formatApiError(createListingBody) ||
            createListingBody?.message ||
            'Property created but listing creation failed'
        );
      }
      addLocalNotification({
        title: 'Listing Created',
        message: 'Your property listing was created successfully.',
        url: '/owner-dashboard/my-properties',
        type: 'LISTING',
      });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link
          to="/owner-dashboard/my-properties"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-3"
        >
          <span aria-hidden>&larr;</span> My Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Listing</h1>
        <p className="text-gray-500 mb-8">Create a property first, then publish its listing.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Title</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="3 Bedroom Apartment in Dhanmondi" required />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className={`${inputClass} min-h-24`} placeholder="Describe the property..." required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Size (sqft)</label>
              <input type="number" name="property_size" value={form.property_size} onChange={handleChange} className={inputClass} placeholder="e.g. 1450" min="0" required />
            </div>
            <div>
              <label className={labelClass}>Area / Location</label>
              <select name="area_name" value={form.area_name} onChange={handleChange} className={inputClass} required>
                <option value="">Select area</option>
                <option value="DHANMONDI">Dhanmondi</option>
                <option value="GULSHAN">Gulshan</option>
                <option value="BANANI">Banani</option>
                <option value="UTTARA">Uttara</option>
                <option value="MIRPUR">Mirpur</option>
                <option value="MOHAMMADPUR">Mohammadpur</option>
                <option value="BASHUNDHARA">Bashundhara</option>
                <option value="BADDA">Badda</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street, building, area" />
          </div>

          <div>
            <label className={labelClass}>Map location (click to adjust pin; defaults to Dhaka center)</label>
            <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '280px' }}>
              <MapPicker value={location} onChange={setLocation} height="280px" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rooms / Beds</label>
              <input type="number" name="room_count" value={form.room_count} onChange={handleChange} className={inputClass} placeholder="e.g. 3" min="0" required />
            </div>
            <div>
              <label className={labelClass}>Bathrooms</label>
              <input type="number" name="bathroom_count" value={form.bathroom_count} onChange={handleChange} className={inputClass} placeholder="e.g. 2" min="0" required />
            </div>
            <div>
              <label className={labelClass}>Balconies</label>
              <input type="number" name="balcony_count" value={form.balcony_count} onChange={handleChange} className={inputClass} min="0" required />
            </div>
            <div>
              <label className={labelClass}>Building Floors</label>
              <input type="number" name="building_floors" value={form.building_floors} onChange={handleChange} className={inputClass} min="1" required />
            </div>
            <div>
              <label className={labelClass}>Building Facing</label>
              <select name="building_facing" value={form.building_facing} onChange={handleChange} className={inputClass}>
                <option value="NORTH">North</option>
                <option value="SOUTH">South</option>
                <option value="EAST">East</option>
                <option value="WEST">West</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Intended Tenant Type</label>
              <select name="intended_tenant_type" value={form.intended_tenant_type} onChange={handleChange} className={inputClass}>
                <option value="BOTH">Both</option>
                <option value="FAMILY">Family</option>
                <option value="BACHELOR">Bachelor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="has_lift" checked={form.has_lift} onChange={(e) => setForm((prev) => ({ ...prev, has_lift: e.target.checked }))} />
              Lift
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="has_generator" checked={form.has_generator} onChange={(e) => setForm((prev) => ({ ...prev, has_generator: e.target.checked }))} />
              Generator
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="has_security_guard" checked={form.has_security_guard} onChange={(e) => setForm((prev) => ({ ...prev, has_security_guard: e.target.checked }))} />
              Security Guard
            </label>
          </div>

          <hr className="border-gray-200" />

          <div>
            <label className={labelClass}>Monthly Rent ($)</label>
            <input type="number" name="rent" value={form.rent} onChange={handleChange} className={inputClass} placeholder="e.g. 15000" min="0" required />
          </div>

          {!createdPropertyId && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Property & Listing'}
            </button>
          )}
        </form>

        {createdPropertyId && (
          <div className="mt-10 p-6 bg-white rounded-xl border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Listing created</h2>
            <p className="text-sm text-gray-500 mb-4">You can add more photos/videos below, then go to My Properties.</p>
            <ImageUploader
              propertyId={createdPropertyId}
              initialImages={[]}
              onUpdate={() => {}}
            />
            <Link
              to="/owner-dashboard/my-properties"
              className="inline-block mt-4 text-teal-700 font-semibold text-sm hover:text-teal-800"
            >
              Done - My Properties &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}


<<<<<<< HEAD
=======
          {!createdPropertyId && (
            <div className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {FORM_STEPS.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;
                  return (
                    <div
                      key={step.title}
                      className={`rounded-xl border p-3 ${isActive
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : isComplete
                          ? 'border-teal-100 bg-white text-teal-700'
                          : 'border-gray-100 bg-white text-gray-400'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isActive || isComplete ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold">{step.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {!createdPropertyId && (
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-5" noValidate>
              <section className={sectionClass}>
                <div>
                  <p className="text-sm font-semibold text-teal-700">Section {currentStep + 1}</p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{currentStepConfig.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{currentStepConfig.description}</p>
                </div>

                {currentStep === 0 && (
                  <>
                    <div>
                      <label className={labelClass}>Title</label>
                      <input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="3 Bedroom Apartment in Dhanmondi" required />
                    </div>

                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea name="description" value={form.description} onChange={handleChange} className={`${inputClass} min-h-24`} placeholder="Describe the property..." required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Size (sqft)</label>
                        <input type="number" name="property_size" value={form.property_size} onChange={handleChange} className={inputClass} placeholder="e.g. 1450" min="0" required />
                      </div>
                      <div>
                        <label className={labelClass}>Rooms / Beds</label>
                        <input type="number" name="room_count" value={form.room_count} onChange={handleChange} className={inputClass} placeholder="e.g. 3" min="0" required />
                      </div>
                      <div>
                        <label className={labelClass}>Bathrooms</label>
                        <input type="number" name="bathroom_count" value={form.bathroom_count} onChange={handleChange} className={inputClass} placeholder="e.g. 2" min="0" required />
                      </div>
                      <div>
                        <label className={labelClass}>Balconies</label>
                        <input type="number" name="balcony_count" value={form.balcony_count} onChange={handleChange} className={inputClass} min="0" required />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    <div>
                      <label className={labelClass}>Area / Location</label>
                      <select name="area_name" value={form.area_name} onChange={handleChange} className={inputClass} required>
                        <option value="">Select area</option>
                        <option value="DHANMONDI">Dhanmondi</option>
                        <option value="GULSHAN">Gulshan</option>
                        <option value="BANANI">Banani</option>
                        <option value="UTTARA">Uttara</option>
                        <option value="MIRPUR">Mirpur</option>
                        <option value="MOHAMMADPUR">Mohammadpur</option>
                        <option value="BASHUNDHARA">Bashundhara</option>
                        <option value="BADDA">Badda</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Address</label>
                      <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street, building, area" />
                    </div>

                    <div>
                      <label className={labelClass}>Map location (click to adjust pin; defaults to Dhaka center)</label>
                      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '280px' }}>
                        <MapPicker value={location} onChange={setLocation} height="280px" />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Building Floors</label>
                        <input type="number" name="building_floors" value={form.building_floors} onChange={handleChange} className={inputClass} min="1" required />
                      </div>
                      <div>
                        <label className={labelClass}>Building Facing</label>
                        <select name="building_facing" value={form.building_facing} onChange={handleChange} className={inputClass}>
                          <option value="NORTH">North</option>
                          <option value="SOUTH">South</option>
                          <option value="EAST">East</option>
                          <option value="WEST">West</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        <input type="checkbox" name="has_lift" checked={form.has_lift} onChange={(e) => setForm((prev) => ({ ...prev, has_lift: e.target.checked }))} />
                        Lift
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        <input type="checkbox" name="has_generator" checked={form.has_generator} onChange={(e) => setForm((prev) => ({ ...prev, has_generator: e.target.checked }))} />
                        Generator
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        <input type="checkbox" name="has_security_guard" checked={form.has_security_guard} onChange={(e) => setForm((prev) => ({ ...prev, has_security_guard: e.target.checked }))} />
                        Security Guard
                      </label>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div>
                      <label className={labelClass}>Intended Tenant Type</label>
                      <select name="intended_tenant_type" value={form.intended_tenant_type} onChange={handleChange} className={inputClass}>
                        <option value="BOTH">Both</option>
                        <option value="FAMILY">Family</option>
                        <option value="BACHELOR">Bachelor</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Monthly Rent ($)</label>
                      <input type="number" name="rent" value={form.rent} onChange={handleChange} className={inputClass} placeholder="e.g. 15000" min="0" required />
                    </div>
                  </>
                )}
              </section>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0 || loading}
                  className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>

                {isLastStep ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Property & Listing'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                )}
              </div>
            </form>
          )}

          {createdPropertyId && (
            <div className="mt-10 p-6 bg-white rounded-xl border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Add photos and videos</h2>
              <p className="text-sm text-gray-500 mb-4">Upload media now, or go back to My Properties when you are done.</p>
              <ImageUploader
                propertyId={createdPropertyId}
                initialImages={[]}
                onUpdate={() => { }}
              />
              <Link
                to="/owner-dashboard/my-properties"
                className="inline-block mt-4 text-teal-700 font-semibold text-sm hover:text-teal-800"
              >
                Done — My Properties &rarr;
              </Link>
            </div>
          )}
        </main>
      </div>
    );
  }
}
>>>>>>> parent of 056d84d (UI updated)
