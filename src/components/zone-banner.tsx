"use client";

import { AlertTriangle, Shield } from "lucide-react";
import type { ZoneCheckResult } from "@/lib/types";

interface ZoneBannerProps {
    readonly zoneCheck: ZoneCheckResult;
    readonly thresholdM?: number;
}

export default function ZoneBanner({
    zoneCheck,
    thresholdM = 50,
}: ZoneBannerProps) {
    const nearest = zoneCheck.nearest_zone;
    const isSensitive =
        nearest !== null && nearest.distance_m <= thresholdM;

    if (isSensitive && nearest) {
        return (
            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <div>
                        <p className="text-sm font-bold text-red-800">
                            Alert: Sensitive Zone Proximity
                        </p>
                        <p className="mt-1 text-sm text-red-700">
                            <span className="font-semibold">{nearest.name}</span>{" "}
                            <span className="text-red-600">({nearest.zone_type})</span> —{" "}
                            <span className="font-mono font-semibold">{nearest.distance_m} m</span>{" "}
                            away
                        </p>
                        {nearest.address && (
                            <p className="mt-0.5 text-xs text-red-600">{nearest.address}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
            <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                    <p className="text-sm font-semibold text-green-800">
                        No sensitive zone within {thresholdM} m
                    </p>
                    {nearest && (
                        <p className="mt-0.5 text-xs text-green-700">
                            Nearest:{" "}
                            <span className="font-semibold text-green-800">{nearest.name}</span> @{" "}
                            <span className="font-mono">{nearest.distance_m} m</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
