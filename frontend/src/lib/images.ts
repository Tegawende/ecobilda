export const IMAGE_SIZES = {
  avatar: {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 64, height: 64 },
    xl: { width: 80, height: 80 },
    xxl: { width: 128, height: 128 },
  },
  projectCard: {
    thumbnail: { width: 400, height: 300 },
    cover: { width: 800, height: 450 },
    gallery: { width: 600, height: 400 },
  },
  hero: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 768, height: 1024 },
  },
  mapPopup: {
    image: { width: 280, height: 180 },
  },
  lightbox: {
    thumbnail: { width: 80, height: 80 },
  },
} as const;

export function getOptimizedImageUrl(
  url: string,
  width: number,
  height: number,
  fit: 'crop' | 'contain' | 'cover' = 'crop'
): string {
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=${width}&h=${height}&fit=${fit}&auto=format`;
  }
  return url;
}

export function getImageSrcSet(
  url: string,
  widths: number[] = [400, 800, 1200]
): string {
  if (!url.includes('unsplash.com')) {
    return '';
  }
  const baseUrl = url.split('?')[0];
  return widths
    .map((w) => `${baseUrl}?w=${w}&auto=format ${w}w`)
    .join(', ');
}
