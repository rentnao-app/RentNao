import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch, isLoggedIn } from '../lib/api';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';

const AREA_OPTIONS = [
  'DHANMONDI',
  'GULSHAN',
  'BANANI',
  'UTTARA',
  'MIRPUR',
  'MOHAMMADPUR',
  'BASHUNDHARA',
  'BADDA',
];

const FACING_OPTIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
const TENANT_TYPE_OPTIONS = ['BOTH', 'FAMILY', 'BACHELOR'];

function toInputValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

function toNumberOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function OwnerPropertyEditPage() {
  const { propertyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState('');
  const [deletingImageId, setDeletingImageId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    areaName: '',
    propertySizeSqft: '',
    roomCount: '',
    bathroomCount: '',
    balconyCount: '',
    buildingFloors: '',
    buildingFacing: 'NORTH',
    intendedTenantType: 'BOTH',
    hasLift: false,
    hasGenerator: false,
    hasSecurityGuard: false,
  });
  const [images, setImages] = useState([]);

  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [images]);

  const loadProperty = useCallback(async () => {
    const res = await apiFetch(`/properties/${propertyId}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || body?.message || 'Failed to fetch property details');
    }
    const data = body?.data || {};
    setForm({
      title: data.title || '',
      description: data.description || '',
      address: data.address || '',
      areaName: data.areaName || '',
      propertySizeSqft: toInputValue(data.propertySizeSqft),
      roomCount: toInputValue(data.roomCount),
      bathroomCount: toInputValue(data.bathroomCount),
      balconyCount: toInputValue(data.balconyCount),
      buildingFloors: toInputValue(data.buildingFloors),
      buildingFacing: data.buildingFacing || 'NORTH',
      intendedTenantType: data.intendedTenantType || 'BOTH',
      hasLift: Boolean(data.hasLift),
      hasGenerator: Boolean(data.hasGenerator),
      hasSecurityGuard: Boolean(data.hasSecurityGuard),
    });
  }, [propertyId]);

  const loadImages = useCallback(async () => {
    const res = await apiFetch(`/properties/${propertyId}/images`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || body?.message || 'Failed to fetch property images');
    }
    setImages(body?.data?.items || []);
  }, [propertyId]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!isLoggedIn()) {
          window.location.href = '/login';
          return;
        }
        setError('');
        await Promise.all([loadProperty(), loadImages()]);
      } catch (err) {
        setError(err.message || 'Unable to load property');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadImages, loadProperty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.checked }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const payload = {
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        areaName: form.areaName || undefined,
        propertySizeSqft: toNumberOrUndefined(form.propertySizeSqft),
        roomCount: toNumberOrUndefined(form.roomCount),
        bathroomCount: toNumberOrUndefined(form.bathroomCount),
        balconyCount: toNumberOrUndefined(form.balconyCount),
        buildingFloors: toNumberOrUndefined(form.buildingFloors),
        buildingFacing: form.buildingFacing || undefined,
        intendedTenantType: form.intendedTenantType || undefined,
        hasLift: Boolean(form.hasLift),
        hasGenerator: Boolean(form.hasGenerator),
        hasSecurityGuard: Boolean(form.hasSecurityGuard),
      };

      const res = await apiFetch(`/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || body?.message || 'Failed to update property');
      }

      setSuccessMessage('Property updated successfully.');
      toast.success('Property saved');
      await loadProperty();
    } catch (err) {
      setError(err.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!imageId || !window.confirm('Remove this image permanently?')) return;
    setDeletingImageId(imageId);
    setError('');
    setSuccessMessage('');
    try {
      const res = await apiFetch(`/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || 'Failed to delete image');
      await loadImages();
      toast.success('Image removed');
    } catch (err) {
      setError(err.message || 'Failed to delete image');
      toast.error(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageId('');
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!imageId) return;
    setSettingPrimaryId(imageId);
    setError('');
    setSuccessMessage('');
    try {
      const res = await apiFetch(`/properties/${propertyId}/images/${imageId}/primary`, {
        method: 'PATCH',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || body?.message || 'Failed to set primary image');
      }

      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.imageId === imageId,
        }))
      );
      setSuccessMessage('Primary image updated.');
    } catch (err) {
      setError(err.message || 'Failed to set primary image');
    } finally {
      setSettingPrimaryId('');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/owner-dashboard" className="text-2xl font-bold text-teal-800 tracking-tight">
            RentNao
          </Link>
          <Link
            to="/owner-dashboard/my-properties"
            className="text-sm font-medium text-gray-600 hover:text-teal-700 transition"
          >
            &larr; My Properties
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit property</h1>
          <p className="text-sm text-gray-500">Update details anytime. Add or remove photos; choose which image is shown first.</p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div>
              <label className={labelClass}>Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={`${inputClass} min-h-24`}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Area</label>
                <select name="areaName" value={form.areaName} onChange={handleChange} className={inputClass} required>
                  <option value="">Select area</option>
                  {AREA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Size (sqft)</label>
                <input
                  type="number"
                  min="1"
                  name="propertySizeSqft"
                  value={form.propertySizeSqft}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Rooms</label>
                <input
                  type="number"
                  min="0"
                  name="roomCount"
                  value={form.roomCount}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  name="bathroomCount"
                  value={form.bathroomCount}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Balconies</label>
                <input
                  type="number"
                  min="0"
                  name="balconyCount"
                  value={form.balconyCount}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Building Floors</label>
                <input
                  type="number"
                  min="1"
                  name="buildingFloors"
                  value={form.buildingFloors}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Building Facing</label>
                <select
                  name="buildingFacing"
                  value={form.buildingFacing}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {FACING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Intended Tenant Type</label>
                <select
                  name="intendedTenantType"
                  value={form.intendedTenantType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {TENANT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasLift} onChange={handleToggle('hasLift')} />
                Lift
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasGenerator} onChange={handleToggle('hasGenerator')} />
                Generator
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasSecurityGuard} onChange={handleToggle('hasSecurityGuard')} />
                Security Guard
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Media</h2>
              <p className="text-sm text-gray-500 mt-0.5">JPEG, PNG, Webp, MP4, WebM, MOV or M4V - up to 100MB each</p>
            </div>
            <span className="text-sm text-gray-500">{sortedImages.length} total</span>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-100">
            <ImageUploader
              propertyId={propertyId}
              initialImages={sortedImages}
              onUpdate={() => loadImages()}
              showPreview={false}
            />
          </div>

          {sortedImages.length === 0 ? (
            <p className="text-sm text-gray-500">No media yet. Use &ldquo;Add photos/videos&rdquo; above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedImages.map((image) => {
                const src = image.url || image.storagePath || '';
                const imgId = image.imageId || image.image_id;
                const mimeType = String(image.mimeType || image.mime_type || '');
                const isVideo = mimeType.startsWith('video/');
                return (
                  <div key={imgId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-100">
                      {src ? isVideo ? (
                        <video src={src} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={src} alt={image.altText || image.fileName || 'Property image'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm text-gray-400">No preview</div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-700 truncate">{image.fileName || 'Unnamed image'}</p>
                        {image.isPrimary && (
                          <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-1 rounded-full shrink-0">Primary</span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isVideo || image.isPrimary || settingPrimaryId === imgId}
                        onClick={() => handleSetPrimary(imgId)}
                        className="w-full text-sm border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {settingPrimaryId === imgId ? 'Updating...' : image.isPrimary ? 'Primary image' : isVideo ? 'Videos cannot be primary' : 'Set as primary'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingImageId === imgId}
                        onClick={() => handleDeleteImage(imgId)}
                        className="w-full text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-2 transition disabled:opacity-50"
                      >
                        {deletingImageId === imgId ? 'Removing...' : 'Remove image'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


