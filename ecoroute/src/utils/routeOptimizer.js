import { haversine } from "./haversine";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/**
 * Fetch car-drivable route geometry from OSRM. Positions are [lat, lng].
 * Returns array of [lat, lng] for Leaflet Polyline, or null on error.
 */
export async function fetchDrivingRoute(positions) {
  if (!positions || positions.length < 2) return null;
  const coords = positions.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coordsList = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coordsList)) return null;
    return coordsList.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
}

export function optimizeRoute(stops, startCoords) {
  if (!stops || stops.length === 0) return [];
  const remaining = [...stops].sort((a, b) => a.priority.localeCompare(b.priority));
  const route = [];
  let [curLat, curLng] = startCoords;
  while (remaining.length > 0) {
    let nearestIdx = 0, minDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversine(curLat, curLng, s.lat, s.lng);
      if (d < minDist) { minDist = d; nearestIdx = i; }
    });
    const chosen = remaining.splice(nearestIdx, 1)[0];
    route.push({ ...chosen, legDistKm: Number.parseFloat(minDist.toFixed(2)) });
    curLat = chosen.lat; curLng = chosen.lng;
  }
  return route;
}

export function totalRouteKm(startCoords, stops, endCoords) {
  let total = 0, prev = startCoords;
  stops.forEach(s => { total += haversine(prev[0], prev[1], s.lat, s.lng); prev = [s.lat, s.lng]; });
  total += haversine(prev[0], prev[1], endCoords[0], endCoords[1]);
  return Number.parseFloat(total.toFixed(1));
}
