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
  const [dataSource, setDataSource] = useState(null); // "s3" | "cache" | "file" | null
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
  const [excludedStopIds, setExcludedStopIds] = useState(() => new Set());
  const [showRemovedPoints, setShowRemovedPoints] = useState(false);

  const STORAGE_KEY = "ecoroute_dataset";
  const EXCLUDED_STOPS_KEY = "ecoroute_excluded_stops";

  const normalize = (data) => {
    let list;
    if (Array.isArray(data)) {
      list = data;
    } else if (data?.data == null) {
      list = null;
    } else {
      list = data.data;
    }
    
    if (list == null && data != null && typeof data === "object" && !Array.isArray(data)) {
      list = [data];
    }
    if (!Array.isArray(list)) {
      list = [];
    }
    return list.map((d, i) => {
      const ward = assignWard(d.area_name) || assignWardByLocation(d.lat, d.lng);
      const ccmcZone = getZoneForWard(ward);
      return { ...d, id: i, zone: assignZone(d.lat, d.lng), ward, ccmcZone };
    });
  };

  const loadFromFile = React.useCallback(() => {
    return fetch("/dataset.json")
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(data => {
        const normalized = normalize(data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn("localStorage setItem failed:", e);
        }
        setRawData(normalized);
        setDataSource("file");
        setLoading(false);
      });
  }, []);

  const loadFromS3 = React.useCallback(() => {
    return fetch("/api/dataset")
      .then(r => {
        const bucket = r.headers.get("X-S3-Bucket");
        const key = r.headers.get("X-S3-Key");
        if (bucket && key) console.log("S3 dataset — bucket:", bucket, "file:", key);
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(data => {
        if (data?.error) throw new Error(data.error);
        const normalized = normalize(data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn("localStorage setItem failed:", e);
        }
        setRawData(normalized);
        setDataSource("s3");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Try S3 first (Vite middleware fetches from s3://internal-testing-1/input/)
    loadFromS3()
      .catch(() => {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const data = JSON.parse(cached);
            let list;
            if (Array.isArray(data)) {
              list = data;
            } else if (data?.data == null) {
              list = [];
            } else {
              list = data.data;
            }
            
            if (list.length > 0) {
              setRawData(normalize(data));
              setDataSource("cache");
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("localStorage read failed:", e);
        }
        loadFromFile().catch(err => {
          console.error("Dataset load failed:", err);
          setLoading(false);
        });
      });
  }, [loadFromS3, loadFromFile]);

  // Hydrate excluded stops from localStorage when dataset is loaded (only if same dataset length)
  useEffect(() => {
    if (rawData.length === 0) return;
    try {
      const saved = localStorage.getItem(EXCLUDED_STOPS_KEY);
      if (!saved) return;
      const { ids = [], datasetLength } = JSON.parse(saved);
      if (datasetLength !== rawData.length) {
        localStorage.removeItem(EXCLUDED_STOPS_KEY);
        setExcludedStopIds(new Set());
        return;
      }
      const validIds = (Array.isArray(ids) ? ids : []).filter((id) => Number.isInteger(id) && id >= 0 && id < rawData.length);
      if (validIds.length > 0) setExcludedStopIds(new Set(validIds));
    } catch (error) {
      console.warn("Failed to hydrate excluded stops:", error);
      localStorage.removeItem(EXCLUDED_STOPS_KEY);
    }
  }, [rawData.length]);

  // Persist excluded stops to localStorage when they or the dataset change
  useEffect(() => {
    if (rawData.length === 0) return;
    try {
      if (excludedStopIds.size === 0) {
        localStorage.removeItem(EXCLUDED_STOPS_KEY);
        return;
      }
      localStorage.setItem(
        EXCLUDED_STOPS_KEY,
        JSON.stringify({ ids: [...excludedStopIds], datasetLength: rawData.length })
      );
    } catch (e) {
      console.warn("localStorage excluded stops write failed:", e);
    }
  }, [excludedStopIds, rawData.length]);

  function handleRefreshData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
    setLoading(true);
    setDataSource(null);
    loadFromS3().catch(() => loadFromFile().catch(err => {
      console.error("Refresh failed:", err);
      setLoading(false);
    }));
  }

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

  function handleRemoveStart() {
    if (globalThis.confirm("Are you sure to remove?")) {
      setStartCoords(DEFAULT_START);
    }
  }

  function handleRemoveEnd() {
    if (globalThis.confirm("Are you sure to remove?")) {
      setEndCoords(DEFAULT_END);
    }
  }

  function handleRemoveFromRoute(stop) {
    if (globalThis.confirm("Are you sure to remove?")) {
      setExcludedStopIds((prev) => new Set([...prev, stop.id]));
    }
  }

  function handleAddBackToRoute(stopId) {
    setExcludedStopIds((prev) => {
      const next = new Set(prev);
      next.delete(stopId);
      return next;
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🚛</div>
        <p className="text-slate-600 text-lg font-semibold">Loading EcoRoute...</p>
        <p className="text-slate-400 text-sm mt-2">
          Loading from cache or dataset…
        </p>
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
        excludedStopIds={excludedStopIds}
        showRemovedPoints={showRemovedPoints}
        setShowRemovedPoints={setShowRemovedPoints}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MetricsBar data={filteredData} zone={selectedZone} startCoords={startCoords} endCoords={endCoords} showRoutes={showRoutes} dataSource={dataSource} totalStops={rawData.length} onRefreshData={handleRefreshData} />
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
              onRemoveStart={handleRemoveStart}
              onRemoveEnd={handleRemoveEnd}
              excludedStopIds={excludedStopIds}
              onRemoveFromRoute={handleRemoveFromRoute}
              showRemovedPoints={showRemovedPoints}
              onAddBackToRoute={handleAddBackToRoute}
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
