// CCMC Ward & Zone mapping for Coimbatore
// Based on CCMC's 100 wards across 5 zones (North, South, East, West, Central)
// Each zone has 20 wards

export const CCMC_ZONES = {
    NORTH: { name: "North", color: "#EF5350", wards: [1, 2, 3, 4, 26, 27, 28, 29, 30, 31, 38, 39, 40, 41, 42, 43, 44, 46, 47, 55] },
    SOUTH: { name: "South", color: "#AB47BC", wards: [76, 77, 78, 79, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
    EAST: { name: "East", color: "#42A5F5", wards: [32, 33, 34, 35, 36, 37, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 69, 75] },
    WEST: { name: "West", color: "#26A69A", wards: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
    CENTRAL: { name: "Central", color: "#FF7043", wards: [25, 45, 48, 49, 50, 51, 52, 53, 54, 68, 70, 71, 72, 73, 74, 80, 81, 82, 83, 84] },
};

export const CCMC_ZONE_LIST = ["ALL", "NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"];

// Map known area names to approximate CCMC ward numbers
// Based on actual Coimbatore geography
const AREA_WARD_MAP = {
    // NORTH ZONE areas
    "Thudiyalur Road": 1,
    "Narasimhanaickenpalayam": 2,
    "Vilankurichi Road": 3,
    "Vilankurichi": 3,
    "Kavundampalayam Main Road": 4,
    "Mettupalayam Road, Kurumbapalayam": 26,
    "Koundampalayam, Mettupalayam Road": 27,
    "Chinnavedampatti Colony Lane": 28,
    "Kovilpalayam": 29,
    "Vellakinar": 30,
    "Sathy Road": 31,
    "Pappanaickenpalayam": 38,
    "Velandipalayam": 39,
    "Kurumbapalayam Road": 40,
    "Seeranaickenpalayam": 41,
    "Tatabad Main Road": 42,
    "Cheran Ma Nagar": 43,
    "Gandhipuram 1st Street": 44,
    "Gandhipuram Central Bus Stand": 46,
    "Ganapathy Main Road": 47,
    "Nehru Nagar": 55,
    "Neelikonampalayam": 4,
    "Perianaickenpalayam Main": 2,
    "Periyanaickenpalayam": 2,
    "Annur Road": 1,
    "Coimbatore North Railway Station": 44,

    // EAST ZONE areas
    "Peelamedu, Avinashi Road": 32,
    "Goldwins, Avinashi Road": 33,
    "Aerodrome Road": 34,
    "Civil Aerodrome Post": 35,
    "Kalapatti Road": 36,
    "Saravanampatti Main Road": 37,
    "Saravanampatty": 37,
    "Neelambur": 56,
    "Singanallur Lake Road": 57,
    "Kangeyam Road Junction": 58,
    "Irugur Road": 59,
    "Keeranatham": 60,
    "Sulur Main Road": 61,
    "Arasur Toll Plaza Road": 62,
    "Ondipudur Main Road": 63,
    "Ramanathapuram Colony": 64,
    "Sowripalayam Bus Stop": 65,
    "Sowripalayam Lake Area": 65,
    "Sowripalayam Road": 65,
    "KK Pudur": 66,
    "Puliakulam Road": 67,
    "Krishnarayapuram Road": 69,
    "Anna Nagar": 75,

    // WEST ZONE areas
    "RS Puram Main Road": 5,
    "DB Road, RS Puram": 6,
    "Saibaba Colony": 7,
    "Sivanandaa Colony": 8,
    "Nanjundapuram Road": 9,
    "Vadavalli Residential Street": 10,
    "Marudhamalai Road": 11,
    "Thondamuthur Road": 12,
    "Sundakkamuthur": 13,
    "Ettimadai": 14,
    "Idigarai Main Road": 15,
    "Idigarai": 15,
    "Perur Temple Road": 16,
    "Perur Chettipalayam": 17,
    "Selvapuram North": 18,
    "Selvapuram South": 19,
    "Nava India Road": 20,
    "Edayarpalayam": 21,
    "Telungupalayam": 22,
    "Alandurai": 23,
    "Kovaipudur Road": 24,
    "Kovaipudur Market Area": 24,
    "Nallampalayam": 11,
    "Mylampatti": 13,
    "Vellapatti": 14,

    // SOUTH ZONE areas
    "Podanur Railway Colony": 76,
    "Podanur Main Road": 77,
    "Pothanur": 78,
    "Kinathukadavu Main": 79,
    "Kinathukadavu Road Industrial Area": 85,
    "Kuniyamuthur Village Road": 86,
    "Kuniyamuthur Main Road": 87,
    "Madukkarai Road": 88,
    "Pollachi Bypass Road": 89,
    "Malumichampatti Cross Road": 90,
    "Vellalore Bypass Road": 91,
    "Chettipalayam Road": 92,
    "Thippampatti": 93,
    "Vadamadurai": 94,
    "Perichipalayam Road": 95,
    "Perichipalayam": 95,
    "Pallapalayam": 96,
    "Murasoli Nagar": 97,
    "Kallur Road": 98,

    // CENTRAL ZONE areas
    "Hopes College Road": 25,
    "Race Course Road": 45,
    "Uppilipalayam": 48,
    "Ukkadam Bus Terminus": 49,
    "Bharathi Park Road": 50,
};

// Assign ward based on area name (fuzzy match on the start)
export function assignWard(areaName) {
    if (!areaName) return null;
    // Try exact prefix match
    for (const [key, ward] of Object.entries(AREA_WARD_MAP)) {
        if (areaName.startsWith(key)) return ward;
    }
    return null;
}

// Get the zone for a given ward number
export function getZoneForWard(wardNum) {
    if (!wardNum) return "UNKNOWN";
    for (const [zoneKey, zone] of Object.entries(CCMC_ZONES)) {
        if (zone.wards.includes(wardNum)) return zoneKey;
    }
    return "UNKNOWN";
}

// Lookup table for assignWardByLocation.
// Each band: { minLat, lngBreaks } where lngBreaks is ordered high-to-low.
// The first lngBreak whose minLng <= lng wins; -Infinity acts as a catch-all.
const LAT_BANDS = [
    // lat >= 11.05
    { minLat: 11.05, lngBreaks: [
        { minLng: 77.03, ward: 37 }, // Saravanampatti/Kalapatti
        { minLng: -Infinity, ward: 1  }, // Thudiyalur/North
    ]},
    // lat >= 11.03
    { minLat: 11.03, lngBreaks: [
        { minLng: 77.03, ward: 34 }, // Aerodrome/East
        { minLng: 76.99, ward: 32 }, // Peelamedu
        { minLng: -Infinity, ward: 47 }, // Ganapathy
    ]},
    // lat >= 11.015
    { minLat: 11.015, lngBreaks: [
        { minLng: 77.02, ward: 57 }, // Singanallur
        { minLng: 76.97, ward: 46 }, // Gandhipuram
        { minLng: 76.95, ward: 42 }, // Tatabad
        { minLng: -Infinity, ward: 7  }, // Saibaba Colony
    ]},
    // lat >= 11
    { minLat: 11, lngBreaks: [
        { minLng: 77.02, ward: 65 }, // Sowripalayam
        { minLng: 76.98, ward: 64 }, // Ramanathapuram
        { minLng: 76.96, ward: 25 }, // Hopes/Central
        { minLng: 76.94, ward: 5  }, // RS Puram
        { minLng: -Infinity, ward: 10 }, // Vadavalli
    ]},
    // lat >= 10.98
    { minLat: 10.98, lngBreaks: [
        { minLng: 77.02, ward: 91 }, // Vellalore
        { minLng: 76.96, ward: 49 }, // Ukkadam
        { minLng: -Infinity, ward: 24 }, // Kovaipudur
    ]},
    // lat >= 10.96
    { minLat: 10.96, lngBreaks: [
        { minLng: 77, ward: 76 }, // Podanur
        { minLng: -Infinity, ward: 86 }, // Kuniyamuthur
    ]},
    // lat >= 10.94
    { minLat: 10.94, lngBreaks: [
        { minLng: 76.96, ward: 85 }, // Kinathukadavu Ind
        { minLng: -Infinity, ward: 89 }, // Pollachi Bypass
    ]},
    // fallback (south of 10.94)
    { minLat: -Infinity, lngBreaks: [
        { minLng: -Infinity, ward: 90 }, // Malumichampatti / far south
    ]},
];

// Assign ward using lat/lng as fallback when area name doesn't match
// Coimbatore bounds: lat 10.88–11.10, lng 76.90–77.15
export function assignWardByLocation(lat, lng) {
    const band = LAT_BANDS.find(({ minLat }) => lat >= minLat);
    const match = band.lngBreaks.find(({ minLng }) => lng >= minLng);
    return match.ward;
}

// Get all unique wards from data
export function getUniqueWards(data) {
    const wards = new Set(data.map(d => d.ward).filter(Boolean));
    return [...wards].sort((a, b) => a - b);
}

// Get ward display info
export function getWardInfo(wardNum) {
    const zone = getZoneForWard(wardNum);
    const zoneData = CCMC_ZONES[zone];
    return {
        ward: wardNum,
        zone,
        zoneName: zoneData?.name || "Unknown",
        color: zoneData?.color || "#94a3b8",
    };
}
