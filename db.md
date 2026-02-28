# Waste Tickets Database Schema

```mermaid
erDiagram

    WASTE_TICKETS {
        TEXT    ticket_id PK "Unique hotspot ID (UUID / CBxxx)"
        TEXT    created_at "IST timestamp (ISO-8601)"
        TEXT    area_name "Human-readable locality"

        REAL    lat "Latitude"
        REAL    lng "Longitude"

        TEXT    waste_type "ORGANIC | PLASTIC | E_WASTE | MIXED | OTHER"
        TEXT    volume_level "LOW | MEDIUM | HIGH"
        REAL    estimated_weight_kg "Estimated waste weight"

        TEXT    priority "P0 | P1 | P2 dispatch priority"

        INTEGER near_sensitive_zone "Boolean (0=false,1=true)"

        TEXT    action "DISPATCH_NOW | ADD_TO_ROUTE | MONITOR"
        TEXT    vehicle_type "E_RICKSHAW | PICKUP | COMPACTOR"

        INTEGER requires_after_photo "Verification flag"

        REAL    wall_time_seconds "AI processing runtime"
    }

%% INDEXES:
%% idx_priority(priority)
%% idx_created_at(created_at)
%% idx_location(lat,lng)