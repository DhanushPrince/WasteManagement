import React, { useState, useEffect, useMemo } from "react";
import { assignZone } from "./utils/zones";
import { assignWard, assignWardByLocation, getZoneForWard } from "./utils/wards";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import StopDetails from "./components/StopDetails";
import StopList from "./components/StopList";
import MetricsBar from "./components/MetricsBar";

const DEFAULT_START = [10.9601, 77.0229]; // Vellalore Depot
const DEFAULT_END = [10.9601, 77.0229];

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [activeTab, setActiveTab] = useState("queue");

  const [selectedZone, setSelectedZone] = useState("ALL");
  const [priorityMode, setPriorityMode] = useState("P0+P1");
  const [showRoutes, setShowRoutes] = useState(false);
  const [hazards, setHazards] = useState({ dengue: false, smoke: false, animals: false });
  const [startCoords, setStartCoords] = useState(DEFAULT_START);
  const [endCoords, setEndCoords] = useState(DEFAULT_END);
  // "start" | "end" | null — when set, clicking on the map places the pin
  const [pickingMode, setPickingMode] = useState(null);
  const [selectedWard, setSelectedWard] = useState("ALL");

  useEffect(() => {
    fetch("/dataset.json")
      .then(r => r.json())
      .then(data => {
        setRawData(data.map((d, i) => {
          const ward = assignWard(d.area_name) || assignWardByLocation(d.lat, d.lng);
          const ccmcZone = getZoneForWard(ward);
          return { ...d, id: i, zone: assignZone(d.lat, d.lng), ward, ccmcZone };
        }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    let df = rawData;
    if (selectedZone !== "ALL") df = df.filter(d => d.zone === selectedZone);
    if (selectedWard !== "ALL") df = df.filter(d => d.ward === Number(selectedWard));
    if (priorityMode === "P0") df = df.filter(d => d.priority === "P0");
    else if (priorityMode === "P0+P1") df = df.filter(d => ["P0", "P1"].includes(d.priority));
    if (hazards.dengue || hazards.smoke || hazards.animals) {
      df = df.filter(d =>
        (hazards.dengue && d.stagnant_water_detected) ||
        (hazards.smoke && d.smoke_detected) ||
        (hazards.animals && d.animal_presence)
      );
    }
    return df;
  }, [rawData, selectedZone, selectedWard, priorityMode, hazards]);

  // Handle map click when in picking mode
  function handleMapPick(latlng) {
    if (pickingMode === "start") {
      setStartCoords([latlng.lat, latlng.lng]);
      setPickingMode(null);
    } else if (pickingMode === "end") {
      setEndCoords([latlng.lat, latlng.lng]);
      setPickingMode(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🚛</div>
        <p className="text-slate-600 text-lg font-semibold">Loading EcoRoute...</p>
        <p className="text-slate-400 text-sm mt-2">Place dataset.json in /public folder</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900">
      <Sidebar
        selectedZone={selectedZone} setSelectedZone={setSelectedZone}
        selectedWard={selectedWard} setSelectedWard={setSelectedWard}
        priorityMode={priorityMode} setPriorityMode={setPriorityMode}
        showRoutes={showRoutes} setShowRoutes={setShowRoutes}
        hazards={hazards} setHazards={setHazards}
        filteredData={filteredData} allData={rawData}
        startCoords={startCoords} setStartCoords={setStartCoords}
        endCoords={endCoords} setEndCoords={setEndCoords}
        pickingMode={pickingMode} setPickingMode={setPickingMode}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MetricsBar data={filteredData} zone={selectedZone} startCoords={startCoords} endCoords={endCoords} showRoutes={showRoutes} />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <MapView
              data={filteredData}
              showRoutes={showRoutes}
              hazards={hazards}
              startCoords={startCoords}
              endCoords={endCoords}
              selectedStop={selectedStop}
              onMarkerClick={(stop) => { setSelectedStop(stop); setActiveTab("details"); }}
              selectedZone={selectedZone}
              pickingMode={pickingMode}
              onMapPick={handleMapPick}
              setStartCoords={setStartCoords}
              setEndCoords={setEndCoords}
            />
            {/* Picking mode overlay banner */}
            {pickingMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border-2 text-sm font-bold pointer-events-auto ${pickingMode === "start"
                  ? "bg-green-50 border-green-400 text-green-700"
                  : "bg-red-50 border-red-400 text-red-700"
                  }`}>
                  <div className={`w-3 h-3 rounded-full animate-pulse ${pickingMode === "start" ? "bg-green-500" : "bg-red-500"
                    }`} />
                  Click on the map to set {pickingMode === "start" ? "PICKUP" : "DROP"} location
                  <button
                    onClick={() => setPickingMode(null)}
                    className="ml-2 px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-500 text-xs font-semibold hover:bg-slate-100 pointer-events-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="w-96 flex flex-col bg-white border-l border-slate-200 overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-200 shrink-0 bg-white">
              {[
                { key: "queue", label: "Priority Queue" },
                { key: "details", label: "Stop Details" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === key
                    ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {activeTab === "queue"
                ? <StopList data={filteredData} onSelect={s => { setSelectedStop(s); setActiveTab("details"); }} />
                : <StopDetails stop={selectedStop} />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
