"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue in Next.js / Webpack
const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface LocationMapProps {
    readonly lat: number;
    readonly lng: number;
    readonly areaName?: string;
}

export default function LocationMap({ lat, lng, areaName }: LocationMapProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <MapContainer
                center={[lat, lng]}
                zoom={16}
                scrollWheelZoom={true}
                style={{ height: "350px", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lng]} icon={markerIcon}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{areaName || "Location"}</p>
                            <p className="text-xs text-gray-600">
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
