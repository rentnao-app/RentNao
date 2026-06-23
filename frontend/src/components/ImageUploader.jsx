import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { getAcceptValue, isAllowedFileByMimeAndExtension, PROPERTY_MEDIA_MIMES } from '../lib/fileValidation';
import { useTranslation } from '../lib/i18n';

/**
 * @param {object} props
 * @param {string} props.propertyId
 * @param {object[]} [props.initialImages]
 * @param {() => void} [props.onUpdate] — parent should refetch images
 * @param {boolean} [props.showPreview=true] — when false, only the add-photos control is shown (for pages with their own gallery)
 */
export default function ImageUploader({ propertyId, initialImages = [], onUpdate, showPreview = true }) {
  const { t } = useTranslation();
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    if (!propertyId) {
      setError(t('components.imageUploader.savePropertyFirst'));
      return;
    }
    setUploading(true);
    setError('');
    const startImageCount = images.filter((img) => String(img?.mimeType || img?.mime_type || '').startsWith('image/')).length;
    let uploadedImageCount = 0;

    for (const file of files) {
      try {
        if (!isAllowedFileByMimeAndExtension(file, PROPERTY_MEDIA_MIMES)) {
          setError(t('components.imageUploader.unsupportedFileType', { type: file.type }));
          continue;
        }

        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        if (file.size > MAX_FILE_SIZE) {
          setError(t('components.imageUploader.fileTooLarge', { name: file.name }));
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const uploadUrlRes = await apiFetch(`/properties/${propertyId}/images/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });
        const uploadUrlBody = await uploadUrlRes.json().catch(() => ({}));
        if (!uploadUrlRes.ok) throw new Error(uploadUrlBody?.error || uploadUrlBody?.message || t('components.imageUploader.uploadUrlFailed'));
        const { uploadUrl, fileKey } = uploadUrlBody?.data || {};
        if (!uploadUrl || !fileKey) throw new Error(t('components.imageUploader.invalidUploadUrl'));

        const storageUploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!storageUploadRes.ok) throw new Error(t('components.imageUploader.storageUploadFailed'));

        const createImageRes = await apiFetch(`/properties/${propertyId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: fileKey,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            isPrimary: isImage && startImageCount + uploadedImageCount === 0,
          }),
        });
        const createImageBody = await createImageRes.json().catch(() => ({}));
        if (!createImageRes.ok) throw new Error(createImageBody?.error || createImageBody?.message || t('components.imageUploader.registrationFailed'));

        const createdImage = createImageBody?.data;
        if (isImage) uploadedImageCount += 1;
        if (createdImage && showPreview) {
          setImages((prev) => [...prev, createdImage]);
        }
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        setError(t('components.imageUploader.uploadFailed', { name: file.name, message: err.message }));
        // Continue to the next file even if this one failed
      }
    }
    setUploading(false);
    onUpdate?.();
  };

  const handleRemove = async (imageId) => {
    if (!propertyId || !imageId) return;
    setError('');
    try {
      const res = await apiFetch(`/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || t('components.imageUploader.deleteFailed'));
      setImages((prev) => prev.filter((img) => (img.imageId || img.image_id) !== imageId));
      onUpdate?.();
    } catch (err) {
      setError(err.message || t('components.imageUploader.deleteFailedGeneric'));
    }
  };

  return (
    <div>
      {showPreview && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img) => {
            const id = img.imageId || img.image_id;
            const src = img.url || img.file_path || img.storagePath || '';
            const mimeType = String(img.mimeType || img.mime_type || '');
            const isVideo = mimeType.startsWith('video/');
            return (
              <div key={id} className="relative group">
                {isVideo ? (
                  <video src={src} className="w-24 h-24 rounded-lg border border-gray-200 object-cover" muted />
                ) : (
                  <img src={src} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition"
                  aria-label={t('components.imageUploader.removeImage')}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg cursor-pointer hover:bg-teal-100 transition text-sm font-medium text-teal-800">
        <input type="file" accept={getAcceptValue(PROPERTY_MEDIA_MIMES)} multiple className="hidden" onChange={handleFileSelect} disabled={!propertyId || uploading} />
        {uploading ? t('components.imageUploader.uploading') : t('components.imageUploader.addPhotosVideos')}
      </label>
    </div>
  );
}
