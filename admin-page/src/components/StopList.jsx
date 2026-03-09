import React, { useState } from "react";
import PropTypes from "prop-types";
import { ZONE_COLORS, ZONE_EMOJI } from "../utils/zones";

const P_COLOR = { P0: "#ef4444", P1: "#f59e0b", P2: "#10b981" };
const P_BORDER = { P0: "border-red-400", P1: "border-amber-400", P2: "border-green-400" };

export default function StopList({ data, onSelect }) {
  const [search, setSearch] = useState("");

  const sorted = [...data]
    .sort((a, b) => {
      const po = { P0:0, P1:1, P2:2 };
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      return b.estimated_weight_kg - a.estimated_weight_kg;
    })
    .filter(d => !search || d.area_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b border-slate-200">
        <input
          type="text"
          placeholder="🔍 Search area..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400"
        />
      </div>
      <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100 bg-slate-50">
        {sorted.length} stops · sorted by priority + weight
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {sorted.map((stop, idx) => {
          const zoneColor = ZONE_COLORS[stop.zone];
          const hasHazard = stop.stagnant_water_detected || stop.smoke_detected || stop.animal_presence;
          return (
            <button
              key={stop.id}
              onClick={() => onSelect(stop)}
              className={`w-full text-left px-3 py-3 hover:bg-slate-50 transition-colors border-l-4 ${P_BORDER[stop.priority]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-black text-white"
                      style={{ background: P_COLOR[stop.priority] }}>{stop.priority}</span>
                    <span className="text-xs font-semibold" style={{ color: zoneColor }}>
                      {ZONE_EMOJI[stop.zone]} {stop.zone}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate max-w-[190px]">{stop.area_name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{stop.waste_type}</span>
                    <span>·</span>
                    <span className="font-medium text-blue-600">{stop.estimated_weight_kg} kg</span>
                    {hasHazard && <span className="text-orange-500 text-sm">⚠️</span>}
                    {stop.near_sensitive_zone && <span className="text-red-500 text-sm">🏥</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-black ${stop.action === "DISPATCH_NOW" ? "text-red-500" : "text-blue-500"}`}>
                    {stop.action === "DISPATCH_NOW" ? "NOW" : "ROUTE"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{stop.vehicle_type}</p>
                </div>
              </div>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No stops match your filters.</div>
        )}
      </div>
    </div>
  );
}

StopList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    area_name: PropTypes.string,
    priority: PropTypes.string,
    zone: PropTypes.string,
    waste_type: PropTypes.string,
    estimated_weight_kg: PropTypes.number,
    action: PropTypes.string,
    vehicle_type: PropTypes.string,
    stagnant_water_detected: PropTypes.bool,
    smoke_detected: PropTypes.bool,
    animal_presence: PropTypes.bool,
    near_sensitive_zone: PropTypes.bool,
  })).isRequired,
  onSelect: PropTypes.func.isRequired,
};
