/**
 * Image Proxy Service
 * Handles external images with CORS fallbacks
 */

/**
 * Get image URL that works in both development and production
 * Uses different strategies based on environment and URL type
 */
export const getProxiedImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') {
        return '';
    }

    const cleanedUrl = imageUrl.trim();

    // If it's already a relative path or same origin, return as is
    if (cleanedUrl.startsWith('/') || cleanedUrl.startsWith(window.location.origin)) {
        return cleanedUrl;
    }

    // In development, use Vite proxy for external images
    if (import.meta.env.DEV) {
        if (cleanedUrl.startsWith('https://optyshop-frontend.hmstech.org')) {
            try {
                const url = new URL(cleanedUrl);
                return `/external-images${url.pathname}`;
            } catch {
                const pathMatch = cleanedUrl.match(/\/\/[^\/]+(\/.*)/);
                if (pathMatch && pathMatch[1]) {
                    return `/external-images${pathMatch[1]}`;
                }
                return '';
            }
        }
        return cleanedUrl;
    }

    // In production, for now return the direct URL
    // The backend should handle CORS properly or the images should be served from the same domain
    return cleanedUrl;
};

/**
 * Convert an image URL to a data URL (base64)
 * This can be used as a fallback for CORS issues
 */
export const convertToDataUrl = async (imageUrl: string): Promise<string> => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to data URL:', error);
        return imageUrl; // Fallback to original URL
    }
};

/**
 * Check if an image URL is likely to have CORS issues
 */
export const hasCorsIssues = (imageUrl: string): boolean => {
    try {
        const url = new URL(imageUrl);
        return url.origin !== window.location.origin;
    } catch {
        return false;
    }
};
