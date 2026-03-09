import exifr from "exifr";

/**
 * Extract GPS coordinates from image EXIF data (browser-side).
 * Returns { lat, lng } or null if EXIF GPS is not available.
 */
export async function getExifGps(
    file: File
): Promise<{ lat: number; lng: number } | null> {
    try {
        const gps = await exifr.gps(file);
        if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
            return { lat: gps.latitude, lng: gps.longitude };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Get current position from browser's Geolocation API.
 * Returns { lat, lng, accuracy } or null if denied/unavailable.
 */
export function getDeviceLocation(): Promise<{
    lat: number;
    lng: number;
    accuracy: number;
} | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    });
}
