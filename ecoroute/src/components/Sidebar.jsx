import React, { useState } from "react";
import PropTypes from "prop-types";
import { ALL_ZONES, ZONE_COLORS, ZONE_VEHICLE } from "../utils/zones";

const KNOWN_LOCATIONS = {
  "Vellalore Depot": [10.9601, 77.0229],
  "Gandhipuram Bus Stand": [11.0168, 76.9558],
  "Coimbatore Junction": [11.0014, 76.9602],
  "Ukkadam Bus Terminus": [10.9909, 76.9675],
  "Peelamedu": [11.0347, 77.0206],
  "RS Puram Market": [11.004, 76.9535],
  "Singanallur": [11.003, 77.0321],
  "Coimbatore Airport": [11.03, 77.0435],
  "PSG College": [11.0232, 77.001],
  "Hopes College": [11.0131, 76.9636],
};

function Toggle({ label, checked, onChange, accent = "#3b82f6" }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-1.5 select-none">
      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-all shrink-0 focus:outline-none border"
        style={{
          background: checked ? accent : "#e2e8f0",
          borderColor: checked ? accent : "#cbd5e1"
        }}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function Section({ title }) {
  return <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-5 mb-2">{title}</p>;
}

function LocationPicker({ label, value, onChange }) {
  const [custom, setCustom] = useState(false);
  const [lat, setLat] = useState(value[0]);
  const [lng, setLng] = useState(value[1]);

  function handleSelect(e) {
    const key = e.target.value;
    if (key === "__custom__") { setCustom(true); return; }
    setCustom(false);
    const coords = KNOWN_LOCATIONS[key];
    onChange(coords);
  }

  function applyCustom() {
    onChange([Number.parseFloat(lat), Number.parseFloat(lng)]);
  }

  const currentName = Object.entries(KNOWN_LOCATIONS).find(
    ([, v]) => v[0] === value[0] && v[1] === value[1]
  )?.[0] || "__custom__";

  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <select
        value={currentName}
        onChange={handleSelect}
        className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
      >
        {Object.keys(KNOWN_LOCATIONS).map(k => (
          <option key={k} value={k}>{k}</option>
        ))}
        <option value="__custom__">📍 Custom Coordinates</option>
      </select>
      {custom && (
        <div className="mt-2 flex gap-2">
          <input type="number" step="0.0001" placeholder="Lat" value={lat}
            onChange={e => setLat(e.target.value)}
            className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500" />
          <input type="number" step="0.0001" placeholder="Lng" value={lng}
            onChange={e => setLng(e.target.value)}
            className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500" />
          <button onClick={applyCustom}
            className="bg-blue-600 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-blue-700">
            ✓
          </button>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-1">
        {value[0].toFixed(4)}, {value[1].toFixed(4)}
      </p>
    </div>
  );
}

export default function Sidebar({
  selectedZone, setSelectedZone,
  priorityMode, setPriorityMode,
  showRoutes, setShowRoutes,
  hazards, setHazards,
  filteredData, allData,
  startCoords, setStartCoords,
  endCoords, setEndCoords,
  pickingMode, setPickingMode,
  excludedStopIds,
  showRemovedPoints, setShowRemovedPoints,
}) {
  const dispatchNow = filteredData.filter(d => d.action === "DISPATCH_NOW").length;
  const addToRoute = filteredData.filter(d => d.action === "ADD_TO_ROUTE").length;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0 shadow-sm">
      <div className="p-4">

        {/* Zone selector */}
        <Section title="COLLECTION ZONE" />
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedZone("ALL")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedZone === "ALL"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            All Zones{" "}
            <span className="float-right text-xs opacity-60">{allData.length}</span>
          </button>
          {ALL_ZONES.filter(z => z !== "ALL").map(zone => {
            const color = ZONE_COLORS[zone];
            const cnt = allData.filter(d => d.zone === zone).length;
            const active = selectedZone === zone;
            return (
              <button key={zone} onClick={() => setSelectedZone(zone)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${active ? "text-white border-transparent shadow" : "text-slate-600 hover:bg-slate-100 border-transparent"
                  }`}
                style={active ? { background: color, boxShadow: `0 2px 10px ${color}55` } : {}}
              >
                <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: color }} /> {zone}</span>
                <span className="float-right text-xs opacity-60">{cnt}</span>
                {active && <div className="text-xs opacity-80 mt-0.5">{ZONE_VEHICLE[zone]}</div>}
              </button>
            );
          })}
        </div>

        {/* Priority */}
        <Section title="PRIORITY FILTER" />
        <div className="space-y-1">
          {[
            { key: "P0", label: "Critical Only (P0)", style: "bg-red-100 text-red-700 border-red-300" },
            { key: "P0+P1", label: "High + Critical", style: "bg-amber-100 text-amber-700 border-amber-300" },
            { key: "ALL", label: "All Stops", style: "bg-green-100 text-green-700 border-green-300" },
          ].map(({ key, label, style }) => (
            <button key={key} onClick={() => setPriorityMode(key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all ${priorityMode === key ? style : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Route */}
        <Section title="ROUTE" />
        <Toggle label="Show Optimized Route" checked={showRoutes} onChange={setShowRoutes} accent="#2563eb" />
        {excludedStopIds && excludedStopIds.size > 0 && (
          <Toggle
            label={`Show removed points (${excludedStopIds.size})`}
            checked={showRemovedPoints}
            onChange={setShowRemovedPoints}
            accent="#64748b"
          />
        )}

        {/* Start / End locations */}
        {showRoutes && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Start pin row */}
              <div className="relative flex items-start gap-3 px-3 pt-3 pb-2">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-[3px] border-green-200 shadow-sm shadow-green-300/50" />
                  <div className="w-0.5 flex-1 min-h-[28px] mt-1" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #86efac 0px, #86efac 3px, transparent 3px, transparent 6px)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Pickup</p>
                    <button
                      onClick={() => setPickingMode(pickingMode === "start" ? null : "start")}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${pickingMode === "start"
                        ? "bg-green-500 text-white shadow-sm animate-pulse"
                        : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
                        }`}
                    >
                      {pickingMode === "start" ? "Picking..." : "Pick on Map"}
                    </button>
                  </div>
                  <LocationPicker label="" value={startCoords} onChange={(c) => { setStartCoords(c); setPickingMode(null); }} />
                </div>
              </div>
              {/* End pin row */}
              <div className="relative flex items-start gap-3 px-3 pb-3 pt-0">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className="w-4 h-4 rounded-sm bg-red-500 border-[3px] border-red-200 shadow-sm shadow-red-300/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Drop</p>
                    <button
                      onClick={() => setPickingMode(pickingMode === "end" ? null : "end")}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${pickingMode === "end"
                        ? "bg-red-500 text-white shadow-sm animate-pulse"
                        : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        }`}
                    >
                      {pickingMode === "end" ? "Picking..." : "Pick on Map"}
                    </button>
                  </div>
                  <LocationPicker label="" value={endCoords} onChange={(c) => { setEndCoords(c); setPickingMode(null); }} />
                </div>
              </div>
              {/* Round trip toggle */}
              <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={endCoords[0] === startCoords[0] && endCoords[1] === startCoords[1]}
                    onChange={e => { if (e.target.checked) setEndCoords([...startCoords]); }}
                    className="accent-blue-600 w-3.5 h-3.5" />
                  <span className="text-xs text-slate-500 font-medium">Round trip (return to start)</span>
                </label>
              </div>
              {/* Drag hint */}
              <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 text-center">
                <p className="text-[10px] text-blue-500 font-medium">You can also drag pins on the map</p>
              </div>
            </div>
        )}

        {/* Hazards */}
        <Section title="HAZARD LAYERS" />
        <Toggle label="Dengue / Stagnant Water" checked={hazards.dengue} onChange={v => setHazards(h => ({ ...h, dengue: v }))} accent="#7c3aed" />
        <Toggle label="Air Quality / Smoke" checked={hazards.smoke} onChange={v => setHazards(h => ({ ...h, smoke: v }))} accent="#d97706" />
        <Toggle label="Animal Scavenging" checked={hazards.animals} onChange={v => setHazards(h => ({ ...h, animals: v }))} accent="#16a34a" />

        {/* Shift summary */}
        <Section title="SHIFT SUMMARY" />
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
          {[
            { label: "DISPATCH NOW", value: dispatchNow, color: "text-red-500" },
            { label: "ADD TO ROUTE", value: addToRoute, color: "text-blue-500" },
            { label: "TOTAL STOPS", value: filteredData.length, color: "text-slate-800" },
            { label: "TOTAL LOAD", value: filteredData.reduce((s, d) => s + (d.estimated_weight_kg || 0), 0) + " kg", color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">{label}</span>
              <span className={`font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <Section title="LEGEND" />
        <div className="space-y-1.5">
          {[
            { color: "#ef4444", label: "P0 Critical (large)" },
            { color: "#f59e0b", label: "P1 High (medium)" },
            { color: "#10b981", label: "P2 Routine (small)" },
            { color: "#7c3aed", label: "Stagnant Water" },
            { color: "#d97706", label: "Smoke Detected" },
            { color: "#16a34a", label: "Animal Presence" },
            { color: "#e11d48", label: "Near Sensitive Zone" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-sm" style={{ background: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

Toggle.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  accent: PropTypes.string,
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
};

LocationPicker.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.number).isRequired,
  onChange: PropTypes.func.isRequired,
};

Sidebar.propTypes = {
  selectedZone: PropTypes.string.isRequired,
  setSelectedZone: PropTypes.func.isRequired,
  priorityMode: PropTypes.string.isRequired,
  setPriorityMode: PropTypes.func.isRequired,
  showRoutes: PropTypes.bool.isRequired,
  setShowRoutes: PropTypes.func.isRequired,
  hazards: PropTypes.shape({
    dengue: PropTypes.bool,
    smoke: PropTypes.bool,
    animals: PropTypes.bool,
  }).isRequired,
  setHazards: PropTypes.func.isRequired,
  filteredData: PropTypes.arrayOf(PropTypes.shape({
    action: PropTypes.string,
    estimated_weight_kg: PropTypes.number,
  })).isRequired,
  allData: PropTypes.arrayOf(PropTypes.shape({
    zone: PropTypes.string,
  })).isRequired,
  startCoords: PropTypes.arrayOf(PropTypes.number).isRequired,
  setStartCoords: PropTypes.func.isRequired,
  endCoords: PropTypes.arrayOf(PropTypes.number).isRequired,
  setEndCoords: PropTypes.func.isRequired,
  pickingMode: PropTypes.string,
  setPickingMode: PropTypes.func.isRequired,
  excludedStopIds: PropTypes.instanceOf(Set).isRequired,
  showRemovedPoints: PropTypes.bool.isRequired,
  setShowRemovedPoints: PropTypes.func.isRequired,
};
