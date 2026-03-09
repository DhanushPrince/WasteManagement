import { NextRequest, NextResponse } from "next/server";

interface ReverseGeocodeRequest {
    lat: number;
    lng: number;
}

interface GeocodeResult {
    short_name: string;
    full_address: string;
}

interface Landmark {
    name: string;
    type: string;
}

function extractStr(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, unknown>;
        const strValue = (obj.Name as string) || (obj.Code as string);
        if (strValue) return strValue;
        return JSON.stringify(value);
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return null;
}

function buildShortAddress(addr: Record<string, unknown>): string {
    const house = extractStr(addr.AddressNumber);
    const street = extractStr(addr.Street);
    const suburb = extractStr(addr.SubDistrict) || extractStr(addr.District);
    const city = extractStr(addr.Locality) || extractStr(addr.SubRegion);
    const state = extractStr(addr.Region);

    const parts: string[] = [];
    if (house && street) parts.push(`${house}, ${street}`);
    else if (street) parts.push(street);
    if (suburb) parts.push(suburb);
    if (city) parts.push(city);
    if (state) parts.push(state);
    
    return parts.join(", ");
}

async function performReverseGeocode(
    lat: number,
    lng: number,
    apiKey: string,
    region: string
): Promise<GeocodeResult> {
    const geocodeUrl = `https://places.geo.${region}.amazonaws.com/v2/reverse-geocode?key=${encodeURIComponent(apiKey)}`;
    const geocodeRes = await fetch(geocodeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ QueryPosition: [lng, lat], Language: "en", MaxResults: 1 }),
    });
    const geocodeData = await geocodeRes.json();
    const items = geocodeData.ResultItems || [];

    if (items.length > 0) {
        const addr = items[0].Address || {};
        return {
            full_address: extractStr(addr.Label) || "",
            short_name: buildShortAddress(addr),
        };
    }

    return { short_name: "", full_address: "" };
}

async function performNearbySearch(
    lat: number,
    lng: number,
    apiKey: string,
    region: string
): Promise<Landmark[]> {
    const nearbyUrl = `https://places.geo.${region}.amazonaws.com/v2/search-nearby?key=${encodeURIComponent(apiKey)}`;
    const nearbyRes = await fetch(nearbyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            QueryPosition: [lng, lat],
            Language: "en",
            MaxResults: 5,
            Filter: {
                IncludeCategories: [
                    "hospital", "school", "college", "bank", "pharmacy",
                    "police", "bus_station", "train_station", "park", "place_of_worship",
                ],
            },
        }),
    });
    const nearbyData = await nearbyRes.json();
    const seen = new Set<string>();
    const landmarks: Landmark[] = [];

    for (const item of nearbyData.ResultItems || []) {
        const name = item.Title || extractStr(item.Address?.Label);
        const cats = item.Categories || [];
        const kind = cats.length > 0 ? cats[0].Name : "place";
        if (name && !seen.has(name)) {
            seen.add(name);
            landmarks.push({ name, type: kind });
        }
    }

    return landmarks;
}

export async function POST(request: NextRequest) {
    try {
        const { lat, lng } = (await request.json()) as ReverseGeocodeRequest;

        const apiKey = process.env.AWS_LOCATION_API_KEY || "";
        const region = process.env.AWS_LOCATION_REGION || "us-east-1";

        if (!apiKey) {
            return NextResponse.json(
                { short_name: null, full_address: null, landmarks: [], error: "AWS_LOCATION_API_KEY not set" },
                { status: 500 }
            );
        }

        const result: {
            short_name: string | null;
            full_address: string | null;
            landmarks: Landmark[];
            error?: string;
        } = { short_name: null, full_address: null, landmarks: [] };

        try {
            const geocodeResult = await performReverseGeocode(lat, lng, apiKey, region);
            result.short_name = geocodeResult.short_name;
            result.full_address = geocodeResult.full_address;
        } catch (e) {
            result.error = String(e);
        }

        try {
            result.landmarks = await performNearbySearch(lat, lng, apiKey, region);
        } catch {
            // Ignore nearby search errors
        }

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            { short_name: null, full_address: null, landmarks: [], error: String(e) },
            { status: 500 }
        );
    }
}
