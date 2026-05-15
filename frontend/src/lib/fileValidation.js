const EXTENSIONS_BY_MIME = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov', 'qt'],
  'video/x-m4v': ['m4v'],
};

export const KYC_UPLOAD_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
export const PROFILE_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const PROPERTY_MEDIA_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
];

export function isAllowedFileByMimeAndExtension(file, allowedMimes) {
  if (!file) return false;

  const mimeType = String(file.type || '').toLowerCase();
  const extension = String(file.name || '').toLowerCase().split('.').pop() || '';

  if (!allowedMimes.includes(mimeType)) {
    return false;
  }

  return (EXTENSIONS_BY_MIME[mimeType] || []).includes(extension);
}

export function getAcceptValue(allowedMimes) {
  const extensions = allowedMimes.flatMap((mime) => EXTENSIONS_BY_MIME[mime] || []);
  return [...allowedMimes, ...extensions.map((ext) => `.${ext}`)].join(',');
}