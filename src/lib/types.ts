// ── Sensitive Zone Types ─────────────────────────────────────────────────────

export interface SensitiveZone {
  zone_id: string;
  name: string;
  zone_type: string;
  lat: number;
  lng: number;
  address: string;
  ward?: string;
  phone?: string | null;
  priority_override?: string;
  active?: boolean;
  board?: string;
  type_of_institution?: string;
  dengue_risk?: boolean;
}

export interface SensitiveZonesData {
  meta: {
    city: string;
    state: string;
    country: string;
    radius_m: number;
    total_zones: number;
    last_updated: string;
    source: string;
    zone_types: string[];
  };
  sensitive_zones: SensitiveZone[];
}

export interface MatchedZone {
  zone_id: string;
  name: string;
  zone_type: string;
  address: string;
  distance_m: number;
}

export interface ZoneCheckResult {
  is_sensitive: boolean;
  matched_zones: MatchedZone[];
  nearest_zone: MatchedZone | null;
}

// ── Location Types ───────────────────────────────────────────────────────────

export interface LocationResult {
  short_name: string | null;
  full_address: string | null;
  landmarks: { name: string; type: string }[];
  error?: string;
}

// ── GPS Types ────────────────────────────────────────────────────────────────

export type GpsSource = "exif" | "device" | "default";

export interface GpsCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  source: GpsSource;
}

// ── Waste Ticket Types ───────────────────────────────────────────────────────

export interface WasteTicket {
  ticket_id: string;
  created_at: string;
  waste_detected: boolean;
  image_quality: "CLEAR" | "BLURRY" | "OBSTRUCTED" | "INSUFFICIENT_LIGHT";
  confidence_score: number;
  waste_type: "ORGANIC" | "PLASTIC" | "E_WASTE" | "C_D_WASTE" | "MIXED" | "OTHER";
  volume_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimated_weight_kg: number;
  area_covered_sqm: number;
  stagnant_water_detected: boolean;
  smoke_detected: boolean;
  medical_waste_detected: boolean;
  animal_presence: boolean;
  high_value_recyclables_present: boolean;
  recyclable_types: string[];
  area_name: string;
  lat: number;
  lng: number;
  priority: "P0" | "P1" | "P2";
  near_sensitive_zone: boolean;
  action: "DISPATCH_NOW" | "ADD_TO_ROUTE" | "MONITOR";
  vehicle_type: "E_RICKSHAW" | "PICKUP" | "COMPACTOR" | "OTHER";
  requires_after_photo: boolean;
  reasoning: string;
  wall_time_seconds?: number;
  gps_accuracy_m?: number | null;
  gps_source?: GpsSource;
  nearest_zone?: MatchedZone | null;
  image_file?: string;
}

// ── Analysis Result ──────────────────────────────────────────────────────────

export interface AnalysisResult {
  gps: GpsCoords;
  location: LocationResult;
  zoneCheck: ZoneCheckResult;
  ticket: WasteTicket;
}
