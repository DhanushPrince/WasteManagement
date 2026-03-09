"use client";

import { Satellite, Smartphone, MapPin } from "lucide-react";
import type { GpsSource } from "@/lib/types";

interface GpsBadgeProps {
    readonly source: GpsSource;
    readonly accuracy?: number;
}

export default function GpsBadge({ source, accuracy }: GpsBadgeProps) {
    if (source === "exif") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-blue-600/20">
                <Satellite className="h-3.5 w-3.5" />
                EXIF GPS
            </span>
        );
    }

    if (source === "default") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-amber-600/20" title="No GPS in image or device. Using default (Coimbatore). Enable location or use a photo with GPS for accurate results.">
                <MapPin className="h-3.5 w-3.5" />
                Default location
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-green-600/20">
            <Smartphone className="h-3.5 w-3.5" />
            Device GPS (fallback)
            {accuracy !== undefined && (
                <span className="ml-1 opacity-75">±{Math.round(accuracy)}m</span>
            )}
        </span>
    );
}
