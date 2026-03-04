import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ZONE_COLORS } from "../utils/zones";
import { optimizeRoute, totalRouteKm } from "../utils/routeOptimizer";

// Bigger radii for visibility
const PRIORITY_RADIUS = { P0: 16, P1: 12, P2: 8 };
const PRIORITY_COLOR = { P0: "#ef4444", P1: "#f59e0b", P2: "#10b981" };

function depotIcon(type) {
  const isStart = type === "start";
  const pinClass = isStart ? "pin-start" : "pin-end";
  const label = isStart ? "START" : "END";
  const icon = isStart
    ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="white"><polygon points="8,5 19,12 8,19"/></svg>`
    : `<svg viewBox="0 0 24 24" width="12" height="12" fill="white"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;

  return L.divIcon({
    className: "",
    html: `<div class="pin-marker ${pinClass}">
        <div class="pin-label">${label}</div>
        <div class="pin-body">
          <div class="pin-icon">${icon}</div>
        </div>
        <div class="pin-pulse-ring"></div>
        <div class="pin-shadow"></div>
      </div>`,
    iconSize: [36, 56],
    iconAnchor: [18, 50],
    popupAnchor: [0, -45],
  });
}

function routeNumIcon(n) {
  return L.divIcon({
    className: "",
    html: `<div class="route-badge">${n}</div>`,
    iconAnchor: [15, 15],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 14 });
    }
  }, [points.map(p => p.join(",")).join("|")]);
  return null;
}

// Component to handle map click events for picking mode
function MapClickHandler({ pickingMode, onMapPick }) {
  const map = useMap();

  React.useEffect(() => {
    if (pickingMode) {
      map.getContainer().style.cursor = "crosshair";
    } else {
      map.getContainer().style.cursor = "";
    }
    return () => { map.getContainer().style.cursor = ""; };
  }, [pickingMode, map]);

  useMapEvents({
    click(e) {
      if (pickingMode && onMapPick) {
        onMapPick(e.latlng);
      }
    },
  });
  return null;
}

export default function MapView({
  data, showRoutes, hazards, startCoords, endCoords,
  selectedStop, onMarkerClick, selectedZone,
  pickingMode, onMapPick, setStartCoords, setEndCoords,
}) {
  const center = [11.016844, 76.955832];

  const optimizedRoute = useMemo(() => {
    if (!showRoutes || data.length === 0) return [];
    return optimizeRoute(data, startCoords);
  }, [showRoutes, data, startCoords]);

  const routePolyline = useMemo(() => {
    if (!showRoutes || optimizedRoute.length === 0) return [];
    return [startCoords, ...optimizedRoute.map(s => [s.lat, s.lng]), endCoords];
  }, [showRoutes, optimizedRoute, startCoords, endCoords]);

  const totalKm = useMemo(() => {
    if (!showRoutes || optimizedRoute.length === 0) return 0;
    return totalRouteKm(startCoords, optimizedRoute, endCoords);
  }, [showRoutes, optimizedRoute, startCoords, endCoords]);

  const boundsPoints = data.map(d => [d.lat, d.lng]);

  function getMarkerColor(stop) {
    if (hazards.dengue && stop.stagnant_water_detected) return "#7c3aed";
    if (hazards.smoke && stop.smoke_detected) return "#d97706";
    if (hazards.animals && stop.animal_presence) return "#16a34a";
    if (stop.near_sensitive_zone) return "#e11d48";
    return selectedZone !== "ALL" ? ZONE_COLORS[stop.zone] : PRIORITY_COLOR[stop.priority];
  }

  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {/* Map click handler for picking mode */}
      <MapClickHandler pickingMode={pickingMode} onMapPick={onMapPick} />

      {boundsPoints.length > 0 && <FitBounds points={boundsPoints} />}

      {/* Route polyline */}
      {showRoutes && routePolyline.length > 1 && (
        <Polyline
          positions={routePolyline}
          color={selectedZone !== "ALL" ? ZONE_COLORS[selectedZone] : "#2563eb"}
          weight={4}
          opacity={0.9}
        />
      )}

      {/* Depot markers — draggable! */}
      {showRoutes && (
        <>
          <Marker
            position={startCoords}
            icon={depotIcon("start")}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                setStartCoords([lat, lng]);
              },
            }}
          >
            <Popup>
              <b>Start Location</b><br />
              {startCoords[0].toFixed(4)}, {startCoords[1].toFixed(4)}<br />
              <span style={{ fontSize: 11, color: "#888" }}>Drag to reposition</span>
            </Popup>
          </Marker>
          <Marker
            position={endCoords}
            icon={depotIcon("end")}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng();
                setEndCoords([lat, lng]);
              },
            }}
          >
            <Popup>
              <b>End Location</b><br />
              {endCoords[0].toFixed(4)}, {endCoords[1].toFixed(4)}<br />
              <b>Total Route: {totalKm} km</b><br />
              <span style={{ fontSize: 11, color: "#888" }}>Drag to reposition</span>
            </Popup>
          </Marker>
        </>
      )}

      {/* Route numbered badges */}
      {showRoutes && optimizedRoute.map((stop, idx) => (
        <Marker key={`rn-${stop.id}`} position={[stop.lat, stop.lng]} icon={routeNumIcon(idx + 1)} />
      ))}

      {/* Stop markers */}
      {data.map((stop) => {
        const color = getMarkerColor(stop);
        const isSelected = selectedStop && selectedStop.id === stop.id;
        const r = PRIORITY_RADIUS[stop.priority] || 10;
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={isSelected ? r + 5 : r}
            color={isSelected ? "#1e40af" : "white"}
            fillColor={color}
            fillOpacity={0.9}
            weight={isSelected ? 4 : 2}
            eventHandlers={{ click: () => onMarkerClick(stop) }}
          >
            <Popup maxWidth={280}>
              <div style={{ fontFamily: "system-ui", fontSize: 13, lineHeight: 1.5 }}>
                <b style={{ fontSize: 14 }}>{stop.area_name}</b><br />
                <span style={{ background: PRIORITY_COLOR[stop.priority], color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{stop.priority}</span>
                &nbsp;
                <span style={{ fontSize: 11, color: "#555" }}>{stop.action}</span><br />
                <span style={{ color: "#333" }}>Type: {stop.waste_type} · {stop.estimated_weight_kg} kg</span><br />
                {stop.near_sensitive_zone && <span style={{ color: "#e11d48" }}>⚠️ Near {stop.nearest_zone?.name}<br /></span>}
                {stop.stagnant_water_detected && <span style={{ color: "#7c3aed" }}>💧 Stagnant Water<br /></span>}
                {stop.smoke_detected && <span style={{ color: "#d97706" }}>💨 Smoke<br /></span>}
                {stop.animal_presence && <span style={{ color: "#16a34a" }}>🐕 Animals<br /></span>}
                {stop.image_file && (
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "1px solid #eee" }}>
                    <img
                      src={`/dump/${stop.image_file.split('/').pop()}`}
                      alt="Site Image"
                      style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                    />
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
