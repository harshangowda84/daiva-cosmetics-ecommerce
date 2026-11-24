const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/api\/?$/, '');

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80';

export function getFullImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return DEFAULT_FALLBACK_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_FALLBACK_IMAGE;

  // Already an absolute URL, data URI, or blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Relative path such as /uploads/products/...
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (BACKEND_BASE) {
    return `${BACKEND_BASE}${cleanPath}`;
  }
  return cleanPath;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_FALLBACK_IMAGE) {
    target.src = DEFAULT_FALLBACK_IMAGE;
  }
}

export function parseGalleryImages(galleryImages?: string, defaultImg?: string): string[] {
  if (!galleryImages || !galleryImages.trim()) {
    return defaultImg && defaultImg.trim() ? [defaultImg.trim()] : [DEFAULT_FALLBACK_IMAGE];
  }
  // Split on delimiters followed by protocol/relative path without breaking commas inside query/CDN parameters
  const regex = /[,;\n|](?=https?:\/\/|data:|\/)/;
  const rawList = galleryImages
    .split(regex)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawList.length === 0 && defaultImg && defaultImg.trim()) {
    return [defaultImg.trim()];
  }
  return rawList.length > 0 ? rawList : [DEFAULT_FALLBACK_IMAGE];
}
