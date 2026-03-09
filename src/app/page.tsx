"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  Zap,
  MapPin,
  ShieldCheck,
  Brain,
  AlertCircle,
} from "lucide-react";
import FileUpload from "@/components/file-upload";
import GpsBadge from "@/components/gps-badge";
import ZoneBanner from "@/components/zone-banner";
import JsonViewer from "@/components/json-viewer";
import { getExifGps, getDeviceLocation } from "@/lib/exif";
import { checkSensitiveZones } from "@/lib/geo";
import type {
  GpsSource,
  ZoneCheckResult,
  SensitiveZonesData,
  WasteTicket,
  LocationResult,
} from "@/lib/types";

// Dynamically import the map component to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
    </div>
  ),
});

const SENSITIVE_ZONE_THRESHOLD_M = 50;
const NEAREST_ZONE_RADIUS_M = 100;
// Default location (Coimbatore center) when EXIF and device GPS are unavailable
const DEFAULT_COORDS = { lat: 11.0168, lng: 76.9558 };

type AnalysisStep =
  | "idle"
  | "extracting_gps"
  | "geocoding"
  | "checking_zones"
  | "analyzing_waste"
  | "done"
  | "error";

const STEP_LABELS: Record<AnalysisStep, string> = {
  idle: "",
  extracting_gps: "Extracting GPS coordinates…",
  geocoding: "Reverse geocoding via AWS Location…",
  checking_zones: "Checking sensitive zones…",
  analyzing_waste: "Amazon Nova Pro analysing waste…",
  done: "Analysis complete",
  error: "Error occurred",
};

export default function Home() {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Analysis state
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [gpsSource, setGpsSource] = useState<GpsSource | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoneCheck, setZoneCheck] = useState<ZoneCheckResult | null>(null);
  const [areaName, setAreaName] = useState<string | null>(null);
  const [ticket, setTicket] = useState<WasteTicket | null>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setStep("idle");
      setGpsSource(null);
      setCoords(null);
      setZoneCheck(null);
      setAreaName(null);
      setTicket(null);
      setErrorMsg(null);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset results
    setStep("idle");
    setGpsSource(null);
    setCoords(null);
    setZoneCheck(null);
    setAreaName(null);
    setTicket(null);
    setErrorMsg(null);
  }, []);

  const extractGpsCoordinates = async (file: File) => {
    let lat: number | null = null;
    let lng: number | null = null;
    let source: GpsSource = "exif";
    let accuracy: number | undefined;

    const exifGps = await getExifGps(file);
    if (exifGps) {
      lat = exifGps.lat;
      lng = exifGps.lng;
    } else {
      const deviceGps = await getDeviceLocation();
      if (deviceGps) {
        lat = deviceGps.lat;
        lng = deviceGps.lng;
        accuracy = deviceGps.accuracy;
        source = "device";
      }
    }

    if (lat === null || lng === null) {
      lat = DEFAULT_COORDS.lat;
      lng = DEFAULT_COORDS.lng;
      source = "default";
    }

    return { lat, lng, source, accuracy };
  };

  const performReverseGeocode = async (lat: number, lng: number) => {
    let location: LocationResult = { short_name: null, full_address: null, landmarks: [] };
    try {
      const res = await fetch("/api/reverse-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      location = await res.json();
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
    return location.short_name || location.full_address || "Unknown";
  };

  const performZoneCheck = async (lat: number, lng: number) => {
    let zonesData: SensitiveZonesData | null = null;
    try {
      const res = await fetch("/sensitive_zones.json");
      zonesData = await res.json();
    } catch (e) {
      console.warn("Failed to load sensitive zones:", e);
    }

    const zones = zonesData?.sensitive_zones || [];
    return checkSensitiveZones(lat, lng, zones, NEAREST_ZONE_RADIUS_M);
  };

  const runAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setStep("extracting_gps");
    setErrorMsg(null);

    try {
      setStep("extracting_gps");
      const { lat, lng, source, accuracy } = await extractGpsCoordinates(selectedFile);
      setGpsSource(source);
      setGpsAccuracy(accuracy);
      setCoords({ lat, lng });

      setStep("geocoding");
      const resolvedAreaName = await performReverseGeocode(lat, lng);
      setAreaName(resolvedAreaName);

      setStep("checking_zones");
      const zoneResult = await performZoneCheck(lat, lng);
      setZoneCheck(zoneResult);

      const nearSensitive =
        zoneResult.nearest_zone !== null &&
        zoneResult.nearest_zone.distance_m <= SENSITIVE_ZONE_THRESHOLD_M;

      setStep("analyzing_waste");

      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCodePoint(byte),
          ""
        )
      );

      const analyzeRes = await fetch("/api/analyze-waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          lat,
          lng,
          areaName: resolvedAreaName,
          nearSensitiveZone: nearSensitive,
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error(`Waste analysis failed: ${analyzeRes.statusText}`);
      }

      const wasteTicket = (await analyzeRes.json()) as WasteTicket;

      wasteTicket.gps_source = source;
      wasteTicket.gps_accuracy_m = accuracy ? Math.round(accuracy * 100) / 100 : null;
      wasteTicket.nearest_zone =
        zoneResult.nearest_zone &&
          zoneResult.nearest_zone.distance_m <= NEAREST_ZONE_RADIUS_M
          ? zoneResult.nearest_zone
          : null;

      setTicket(wasteTicket);
      setStep("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }, [selectedFile]);

  const isLoading = !["idle", "done", "error"].includes(step);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-red-600 to-orange-600 p-2.5 shadow-lg shadow-red-600/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Sutham — Waste Detection
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Amazon Nova Pro vision &nbsp;|&nbsp; AWS Location Service
                &nbsp;|&nbsp; Sensitive zone check
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Upload Section */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Upload Waste Image
          </h2>
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
          />
        </section>

        {/* Analyse Button */}
        {selectedFile && (
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className={`
              w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider
              transition-all duration-300 shadow-lg
              ${isLoading
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 hover:shadow-red-600/30 active:scale-[0.98]"
              }
            `}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {STEP_LABELS[step]}
              </span>
            ) : (
              "Analyse and Generate Ticket"
            )}
          </button>
        )}

        {/* Progress Steps */}
        {isLoading && (
          <div className="space-y-2">
            {(
              [
                { key: "extracting_gps", icon: MapPin, label: "GPS Extraction" },
                { key: "geocoding", icon: MapPin, label: "Reverse Geocoding" },
                { key: "checking_zones", icon: ShieldCheck, label: "Sensitive Zone Check" },
                { key: "analyzing_waste", icon: Brain, label: "AI Waste Analysis" },
              ] as const
            ).map(({ key, icon: Icon, label }) => {
              const stepOrder: AnalysisStep[] = [
                "extracting_gps",
                "geocoding",
                "checking_zones",
                "analyzing_waste",
              ];
              const currentIdx = stepOrder.indexOf(step);
              const thisIdx = stepOrder.indexOf(key);
              const isDone = thisIdx < currentIdx;
              const isCurrent = thisIdx === currentIdx;

              const getStepClassName = () => {
                if (isDone) return "text-green-600";
                if (isCurrent) return "bg-slate-200 text-slate-900";
                return "text-slate-600";
              };

              const getStepIcon = () => {
                if (isDone) return <ShieldCheck className="h-4 w-4 text-green-500" />;
                if (isCurrent) return <Loader2 className="h-4 w-4 animate-spin text-red-500" />;
                return <Icon className="h-4 w-4" />;
              };

              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-all ${getStepClassName()}`}
                >
                  {getStepIcon()}
                  {label}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {step === "error" && errorMsg && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">Error</p>
                <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {step === "done" && coords && (
          <div className="space-y-5">
            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* GPS Badge */}
            {gpsSource && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <GpsBadge source={gpsSource} accuracy={gpsAccuracy} />
                  <span className="text-xs text-slate-500 font-mono">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </span>
                </div>
                {gpsSource === "default" && (
                  <p className="text-xs text-amber-500/90">
                    No GPS in image or device. Enable location permission or use a photo taken with location on for accurate results.
                  </p>
                )}
              </div>
            )}

            {/* Area Name */}
            {areaName && (
              <p className="text-sm text-slate-600">
                📍 <span className="text-slate-800 font-medium">{areaName}</span>
              </p>
            )}

            {/* Zone Banner */}
            {zoneCheck && (
              <ZoneBanner
                zoneCheck={zoneCheck}
                thresholdM={SENSITIVE_ZONE_THRESHOLD_M}
              />
            )}

            {/* Generated Ticket */}
            {ticket && (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Generated Ticket
                </h2>
                <JsonViewer data={ticket as unknown as Record<string, unknown>} />
              </>
            )}

            {/* Map */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Location Map
              </h2>
              <LocationMap
                lat={coords.lat}
                lng={coords.lng}
                areaName={areaName || undefined}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-600">
          Sutham Waste Detection · Powered by Amazon Nova Pro & AWS Location
          Service
        </p>
      </footer>
    </div>
  );
}
