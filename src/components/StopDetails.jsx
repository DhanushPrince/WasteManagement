import React from "react";
import { ZONE_COLORS, ZONE_EMOJI } from "../utils/zones";

const PRIORITY_COLOR = { P0: "bg-red-500", P1: "bg-amber-400", P2: "bg-green-500" };
const PRIORITY_TEXT = { P0: "text-red-600", P1: "text-amber-600", P2: "text-green-600" };
const PRIORITY_BG = { P0: "bg-red-50 border-red-200", P1: "bg-amber-50 border-amber-200", P2: "bg-green-50 border-green-200" };

function Metric({ label, value, color = "text-slate-800" }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// Extract just filename from full path, look in /images/
function resolveImageSrc(imagePath) {
  if (!imagePath) return null;
  // Extract filename only e.g. "01.jpg"
  const parts = imagePath.replace(/\\/g, "/").split("/");
  const filename = parts[parts.length - 1];
  return `/dump/${filename}`;
}

export default function StopDetails({ stop }) {
  if (!stop) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">📍</div>
      <p className="text-slate-500 text-sm">Click any marker on the map<br />to view stop details here.</p>
    </div>
  );

  const zoneColor = ZONE_COLORS[stop.zone];
  const hasHazard = stop.stagnant_water_detected || stop.smoke_detected || stop.animal_presence;
  const imageSrc = resolveImageSrc(stop.image_file);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className={`rounded-xl p-3 border ${PRIORITY_BG[stop.priority]}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-slate-800 leading-snug">{stop.area_name}</h3>
          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black text-white ${PRIORITY_COLOR[stop.priority]}`}>
            {stop.priority}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold border"
            style={{ background: zoneColor + "18", color: zoneColor, borderColor: zoneColor + "44" }}>
            {ZONE_EMOJI[stop.zone]} {stop.zone}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stop.action === "DISPATCH_NOW" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
            {stop.action}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{stop.vehicle_type}</span>
        </div>
      </div>

      {/* Site Image */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">📷 Site Image</p>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={stop.area_name}
            className="w-full rounded-xl object-cover border border-slate-200 shadow-sm"
            style={{ maxHeight: 180 }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 items-center justify-center text-slate-400 text-sm"
          style={{ display: imageSrc ? "none" : "flex" }}
        >
          🖼️ Image not available
        </div>
        <p className="text-xs text-slate-400 mt-1 truncate">{stop.image_file}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Waste Type" value={stop.waste_type} />
        <Metric label="Weight" value={`${stop.estimated_weight_kg} kg`} color="text-blue-600" />
        <Metric label="Volume" value={stop.volume_level} color={stop.volume_level === "CRITICAL" ? "text-red-500" : "text-slate-800"} />
        <Metric label="Area" value={`${stop.area_covered_sqm} m²`} />
      </div>

      {/* Hazards */}
      {hasHazard && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p className="text-xs font-bold text-orange-600 mb-2">⚠️ ACTIVE HAZARDS</p>
          {stop.stagnant_water_detected && <div className="text-sm text-purple-700 font-medium">💧 Stagnant Water — Dengue Risk</div>}
          {stop.smoke_detected && <div className="text-sm text-orange-700 font-medium">💨 Smoke — Air Quality Alert</div>}
          {stop.animal_presence && <div className="text-sm text-green-700 font-medium">🐕 Animals Present</div>}
        </div>
      )}

      {/* Sensitive zone */}
      {stop.near_sensitive_zone && stop.nearest_zone && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-bold text-red-500 mb-1">🏥 NEAR SENSITIVE ZONE</p>
          <p className="text-sm font-semibold text-red-700">{stop.nearest_zone.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stop.nearest_zone.zone_type} · {stop.nearest_zone.distance_m}m away</p>
        </div>
      )}

      {/* Recyclables */}
      {stop.high_value_recyclables_present && stop.recyclable_types?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-bold text-green-600 mb-1.5">♻️ RECYCLABLES PRESENT</p>
          <div className="flex flex-wrap gap-1">
            {stop.recyclable_types.map(r => (
              <span key={r} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{r}</span>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <p className="text-xs font-bold text-slate-400 mb-1">📋 AI REASONING</p>
        <p className="text-sm text-slate-600 italic">{stop.reasoning}</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div>Confidence: <span className="text-slate-700 font-medium">{(stop.confidence_score * 100).toFixed(0)}%</span></div>
        <div>Image: <span className="text-slate-700 font-medium">{stop.image_quality}</span></div>
        <div>GPS: <span className="text-slate-700 font-medium">±{stop.gps_accuracy_m}m</span></div>
        <div>After Photo: <span className={stop.requires_after_photo ? "text-green-600 font-medium" : "text-slate-400"}>{stop.requires_after_photo ? "Required" : "No"}</span></div>
      </div>
      <p className="text-xs text-slate-300 break-all">ID: {stop.ticket_id}</p>
    </div>
  );
}
