import type { SensitiveZone, MatchedZone, ZoneCheckResult } from "./types";

/**
 * Haversine distance between two lat/lng points, in metres.
 */
export function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6_371_000; // Earth's radius in metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(dPhi / 2) ** 2 +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check proximity to sensitive zones.
 * @param radiusM — zones within this radius are included in `matched_zones`
 */
export function checkSensitiveZones(
    lat: number,
    lng: number,
    zones: SensitiveZone[],
    radiusM: number = 100
): ZoneCheckResult {
    const matched: MatchedZone[] = [];
    const allDistances: { distance: number; zone: SensitiveZone }[] = [];

    for (const zone of zones) {
        if (zone.active === false) continue;
        const distance = haversineDistance(lat, lng, zone.lat, zone.lng);
        allDistances.push({ distance, zone });

        if (distance <= radiusM) {
            matched.push({
                zone_id: zone.zone_id,
                name: zone.name,
                zone_type: zone.zone_type,
                address: zone.address,
                distance_m: Math.round(distance * 100) / 100,
            });
        }
    }

    matched.sort((a, b) => a.distance_m - b.distance_m);
    allDistances.sort((a, b) => a.distance - b.distance);

    let nearest: MatchedZone | null = null;
    if (allDistances.length > 0) {
        const { distance, zone } = allDistances[0];
        nearest = {
            zone_id: zone.zone_id,
            name: zone.name,
            zone_type: zone.zone_type,
            address: zone.address,
            distance_m: Math.round(distance * 100) / 100,
        };
    }

    return {
        is_sensitive: matched.length > 0,
        matched_zones: matched,
        nearest_zone: nearest,
    };
}
