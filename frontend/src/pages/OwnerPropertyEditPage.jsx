import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiFetch, isLoggedIn } from '../lib/api';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import { useTranslation } from '../lib/i18n';

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
  const { t } = useTranslation();
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
    floorNo: '',
    flatNo: '',
  });
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [images, setImages] = useState([]);

  const areaOptions = useMemo(
    () =>
      AREA_OPTIONS.map((opt) => ({
        value: opt,
        label: t(`common.areas.${opt}`, opt),
      })),
    [t]
  );

  const facingOptions = useMemo(
    () =>
      FACING_OPTIONS.map((opt) => ({
        value: opt,
        label: t(`common.enums.facing.${opt}`, opt),
      })),
    [t]
  );

  const tenantTypeOptions = useMemo(
    () =>
      TENANT_TYPE_OPTIONS.map((opt) => ({
        value: opt,
        label: t(`common.enums.tenantType.${opt}`, opt),
      })),
    [t]
  );

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
      throw new Error(body?.error || body?.message || t('propertyEdit.errors.fetchFailed'));
    }
    const data = body?.data || {};
    setPropertyType(data.propertyType || 'APARTMENT');
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
      floorNo: toInputValue(data.floorNo),
      flatNo: data.flatNo || '',
    });
  }, [propertyId, t]);

  const loadImages = useCallback(async () => {
    const res = await apiFetch(`/properties/${propertyId}/images`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || body?.message || t('propertyEdit.errors.fetchFailed'));
    }
    setImages(body?.data?.items || []);
  }, [propertyId, t]);

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
        setError(err.message || t('propertyEdit.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadImages, loadProperty, t]);

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
        floorNo: toNumberOrUndefined(form.floorNo),
        flatNo: (form.flatNo ?? '').trim() || undefined,
      };

      const res = await apiFetch(`/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || body?.message || t('propertyEdit.errors.updateFailed'));
      }

      setSuccessMessage(t('propertyEdit.toast.updated'));
      toast.success(t('propertyEdit.toast.saved'));
      await loadProperty();
    } catch (err) {
      setError(err.message || t('propertyEdit.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!imageId || !window.confirm(t('propertyEdit.confirm.removeImage'))) return;
    setDeletingImageId(imageId);
    setError('');
    setSuccessMessage('');
    try {
      const res = await apiFetch(`/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || t('propertyEdit.errors.deleteImageFailed'));
      await loadImages();
      toast.success(t('propertyEdit.toast.imageRemoved'));
    } catch (err) {
      setError(err.message || t('propertyEdit.errors.deleteImageFailed'));
      toast.error(err.message || t('propertyEdit.errors.deleteImageFailed'));
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
        throw new Error(body?.error || body?.message || t('propertyEdit.errors.updateFailed'));
      }

      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.imageId === imageId,
        }))
      );
      setSuccessMessage(t('propertyEdit.toast.updated'));
    } catch (err) {
      setError(err.message || t('propertyEdit.errors.updateFailed'));
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
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          to="/owner-dashboard/my-properties"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-3"
        >
          <span aria-hidden>&larr;</span> {t('propertyEdit.backToMyProperties')}
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('propertyEdit.title')}</h1>
          <p className="text-sm text-gray-500">{t('propertyEdit.subtitle')}</p>

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
              <label className={labelClass}>{t('propertyEdit.fields.title')}</label>
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
              <label className={labelClass}>{t('propertyEdit.fields.description')}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={`${inputClass} min-h-24`}
                required
              />
            </div>

            <div>
              <label className={labelClass}>{t('propertyEdit.fields.address')}</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.area')}</label>
                <select name="areaName" value={form.areaName} onChange={handleChange} className={inputClass} required>
                  <option value="">{t('common.selectArea')}</option>
                  {areaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.size')}</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  inputMode="decimal"
                  name="propertySizeSqft"
                  value={form.propertySizeSqft}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.rooms')}</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  name="roomCount"
                  value={form.roomCount}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.bathrooms')}</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  name="bathroomCount"
                  value={form.bathroomCount}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.balconies')}</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  name="balconyCount"
                  value={form.balconyCount}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.buildingFloors')}</label>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  name="buildingFloors"
                  value={form.buildingFloors}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.buildingFacing')}</label>
                <select
                  name="buildingFacing"
                  value={form.buildingFacing}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {facingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.floorNumber')}</label>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  name="floorNo"
                  value={form.floorNo}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>
                  {propertyType === 'COMMERCIAL_SPACE'
                    ? t('createListing.fields.flatUnitOptional')
                    : t('propertyEdit.fields.flatUnit')}
                </label>
                <input
                  type="text"
                  name="flatNo"
                  value={form.flatNo}
                  onChange={handleChange}
                  className={inputClass}
                  required={propertyType !== 'COMMERCIAL_SPACE'}
                />
              </div>
              <div>
                <label className={labelClass}>{t('propertyEdit.fields.intendedTenantType')}</label>
                <select
                  name="intendedTenantType"
                  value={form.intendedTenantType}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {tenantTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasLift} onChange={handleToggle('hasLift')} />
                {t('propertyEdit.amenities.lift')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasGenerator} onChange={handleToggle('hasGenerator')} />
                {t('propertyEdit.amenities.generator')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasSecurityGuard} onChange={handleToggle('hasSecurityGuard')} />
                {t('propertyEdit.amenities.securityGuard')}
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('propertyEdit.saving') : t('propertyEdit.saveChanges')}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('propertyEdit.media.title')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('propertyEdit.media.formats')}</p>
            </div>
            <span className="text-sm text-gray-500">{t('propertyEdit.media.total', { n: sortedImages.length })}</span>
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
            <p className="text-sm text-gray-500">{t('propertyEdit.media.empty')}</p>
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
                        <div className="h-full flex items-center justify-center text-sm text-gray-400">{t('propertyEdit.media.noPreview')}</div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-700 truncate">{image.fileName || t('propertyEdit.media.unnamedImage')}</p>
                        {image.isPrimary && (
                          <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-1 rounded-full shrink-0">{t('propertyEdit.media.primary')}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isVideo || image.isPrimary || settingPrimaryId === imgId}
                        onClick={() => handleSetPrimary(imgId)}
                        className="w-full text-sm border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {settingPrimaryId === imgId
                          ? t('propertyEdit.media.updating')
                          : image.isPrimary
                            ? t('propertyEdit.media.primaryImage')
                            : isVideo
                              ? t('propertyEdit.media.videosNotPrimary')
                              : t('propertyEdit.media.setPrimary')}
                      </button>
                      <button
                        type="button"
                        disabled={deletingImageId === imgId}
                        onClick={() => handleDeleteImage(imgId)}
                        className="w-full text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-2 transition disabled:opacity-50"
                      >
                        {deletingImageId === imgId ? t('propertyEdit.media.removing') : t('propertyEdit.media.removeImage')}
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
