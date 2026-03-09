import React from "react";
import PropTypes from "prop-types";
import { ZONE_COLORS, ZONE_VEHICLE } from "../utils/zones";

function Kpi({ label, value, color = "text-slate-800", bg = "bg-white" }) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-2 border-r border-slate-200 last:border-0 ${bg}`}>
      <span className={`text-xl font-black leading-tight ${color}`}>{value}</span>
      <span className="text-xs text-slate-400 leading-tight whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function MetricsBar({ data, zone, startCoords, endCoords, showRoutes, dataSource, totalStops, onRefreshData }) {
  const p0 = data.filter(d => d.priority === "P0").length;
  const totalKg = data.reduce((s, d) => s + (d.estimated_weight_kg || 0), 0);
  const hazardCount = data.filter(d => d.stagnant_water_detected || d.smoke_detected || d.animal_presence).length;
  const sensitiveCount = data.filter(d => d.near_sensitive_zone).length;
  const dispatchNow = data.filter(d => d.action === "DISPATCH_NOW").length;
  const zoneColor = zone === "ALL" ? "#3b82f6" : ZONE_COLORS[zone];

  return (
    <div className="flex items-center bg-white border-b border-slate-200 h-14 shrink-0 px-4 gap-0 overflow-x-auto shadow-sm">
      {/* Data source indicator + Refresh */}
      {dataSource && (() => {
        let badgeClass, badgeTitle, badgeLabel;
        if (dataSource === "s3") {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          badgeTitle = "Data from S3";
          badgeLabel = "S3";
        } else if (dataSource === "cache") {
          badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
          badgeTitle = "Data from cache";
          badgeLabel = "Cached";
        } else {
          badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
          badgeTitle = "Data from public/dataset.json";
          badgeLabel = "From file";
        }
        
        return (
          <div className="flex items-center gap-2 mr-2 shrink-0">
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`} 
              title={badgeTitle}
            >
              {badgeLabel} ({totalStops})
            </div>
          {typeof onRefreshData === "function" && (
            <button type="button" onClick={onRefreshData} className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200" title="Clear cache and reload dataset.json">Refresh data</button>
          )}
          </div>
        );
      })()}
      {/* Brand */}
      <div className="flex items-center gap-2.5 pr-4 border-r border-slate-200 mr-2 shrink-0">
        <span className="text-2xl">🚛</span>
        <div>
          <p className="text-sm font-black text-slate-800 leading-tight tracking-tight">EcoRoute</p>
          <p className="text-xs text-slate-400 leading-tight">Coimbatore Waste Mgmt</p>
        </div>
      </div>
      {/* Zone badge */}
      {zone !== "ALL" && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mr-3 shrink-0"
          style={{ background: zoneColor + "18", color: zoneColor, border: `1.5px solid ${zoneColor}55` }}>
          {zone} · {ZONE_VEHICLE[zone]}
        </div>
      )}
      <Kpi label="Stops in View" value={data.length} />
      <Kpi label="🔴 P0 Critical" value={p0} color={p0 > 0 ? "text-red-500" : "text-slate-400"} />
      <Kpi label="📦 Total Load" value={`${totalKg} kg`} color="text-blue-600" />
      <Kpi label="⚡ Dispatch Now" value={dispatchNow} color="text-orange-500" />
      <Kpi label="⚠️ Hazard Sites" value={hazardCount} color={hazardCount > 0 ? "text-amber-500" : "text-slate-400"} />
      <Kpi label="🏥 Near Sensitive" value={sensitiveCount} color={sensitiveCount > 0 ? "text-pink-500" : "text-slate-400"} />
      {showRoutes && (
        <div className="ml-auto flex items-center gap-3 pl-4 border-l border-slate-200 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-200 shadow-sm" />
            <span className="font-semibold text-slate-600">{startCoords[0].toFixed(4)}, {startCoords[1].toFixed(4)}</span>
          </div>
          <svg width="16" height="8" viewBox="0 0 16 8" fill="none"><path d="M0 4h12M10 1l3 3-3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 border-2 border-red-200 shadow-sm" />
            <span className="font-semibold text-slate-600">{endCoords[0].toFixed(4)}, {endCoords[1].toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

Kpi.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  bg: PropTypes.string,
};

MetricsBar.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    priority: PropTypes.string,
    estimated_weight_kg: PropTypes.number,
    action: PropTypes.string,
    stagnant_water_detected: PropTypes.bool,
    smoke_detected: PropTypes.bool,
    animal_presence: PropTypes.bool,
    near_sensitive_zone: PropTypes.bool,
  })).isRequired,
  zone: PropTypes.string.isRequired,
  startCoords: PropTypes.arrayOf(PropTypes.number).isRequired,
  endCoords: PropTypes.arrayOf(PropTypes.number).isRequired,
  showRoutes: PropTypes.bool.isRequired,
  dataSource: PropTypes.string,
  totalStops: PropTypes.number.isRequired,
  onRefreshData: PropTypes.func.isRequired,
};
