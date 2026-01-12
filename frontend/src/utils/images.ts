/**
 * Image size constants for consistent sizing across the app
 * Using explicit width/height prevents layout shift (CLS) and improves performance
 */

export const IMAGE_SIZES = {
    // Avatar sizes
    avatar: {
        xs: { width: 24, height: 24 },
        sm: { width: 32, height: 32 },
        md: { width: 40, height: 40 },
        lg: { width: 64, height: 64 },
        xl: { width: 80, height: 80 },
        xxl: { width: 128, height: 128 },
    },

    // Project card images
    projectCard: {
        thumbnail: { width: 400, height: 300 },
        cover: { width: 800, height: 450 },
        gallery: { width: 600, height: 400 },
    },

    // Hero images
    hero: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 768, height: 1024 },
    },

    // Map popup
    mapPopup: {
        image: { width: 280, height: 180 },
    },

    // Lightbox
    lightbox: {
        thumbnail: { width: 80, height: 80 },
    },
} as const;

/**
 * Helper to get image URL with size parameters for Unsplash images
 */
export function getOptimizedImageUrl(
    url: string,
    width: number,
    height: number,
    fit: 'crop' | 'contain' | 'cover' = 'crop'
): string {
    // Handle Unsplash URLs
    if (url.includes('unsplash.com')) {
        const baseUrl = url.split('?')[0];
        return `${baseUrl}?w=${width}&h=${height}&fit=${fit}&auto=format`;
    }

    // For local images, return as-is
    return url;
}

/**
 * Get srcset for responsive images
 */
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
