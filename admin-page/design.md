# EcoRoute — Complete Design & Directory Structure Reference
> Coimbatore Municipal Waste Management · Route Optimisation Dashboard  
> Written for Claude as a full-context reference document.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **App name** | EcoRoute |
| **Tagline** | Coimbatore Waste Mgmt |
| **Version** | 1.0.0 |
| **Runtime** | React 18 + Vite 7 |
| **CSS framework** | Tailwind CSS v3 (utility-first, no custom design tokens file) |
| **Map library** | React Leaflet v4 + Leaflet v1.9 |
| **Icon library** | Lucide React v0.263 |
| **UI language** | JSX (`.jsx`) |
| **Module type** | ESM (`"type": "module"`) |
| **Dev port** | 5173 (strict) |

---

## 2. Directory Structure

```
ecoroute_2/                          ← project root
│
├── index.html                       ← Vite HTML entrypoint (mounts #root)
├── vite.config.js                   ← Vite config: React plugin + custom S3 plugin
├── vite-plugin-s3-dataset.js        ← Custom Vite middleware: serves /api/dataset and /api/s3-image from AWS S3
├── package.json                     ← Dependencies & npm scripts
├── postcss.config.js                ← PostCSS: autoprefixer
├── tailwind.config.js               ← Tailwind: content paths only (no theme extension)
├── .env                             ← AWS credentials & S3 config (gitignored)
├── .env.example                     ← Example env vars for onboarding
├── .gitignore
├── README.md
│
├── src/                             ← All React source code
│   ├── main.jsx                     ← ReactDOM.createRoot → <App />
│   ├── App.jsx                      ← Root component (state, data loading, layout)
│   ├── index.css                    ← Global styles: Tailwind directives + Leaflet fixes + custom pin animations
│   │
│   ├── components/                  ← Presentational / smart UI components
│   │   ├── Sidebar.jsx              ← Left control panel (zone, priority, route, hazards, legend)
│   │   ├── MapView.jsx              ← Full Leaflet map with markers, route polyline, depot pins
│   │   ├── MetricsBar.jsx           ← Top KPI bar (load, P0 count, hazards, data source badge)
│   │   ├── StopList.jsx             ← Right panel — Priority Queue tab (scrollable, sortable list)
│   │   └── StopDetails.jsx          ← Right panel — Stop Details tab (card with image, hazards, AI reasoning)
│   │
│   └── utils/                       ← Pure JavaScript utilities (no React)
│       ├── zones.js                 ← Zone assignment by lat/lng + zone colour/emoji/vehicle maps
│       ├── wards.js                 ← Ward lookup by area name or coordinates (CCMC ward boundaries)
│       ├── haversine.js             ← Haversine distance formula (km)
│       └── routeOptimizer.js        ← Nearest-neighbour greedy TSP route optimiser
│
├── public/                          ← Vite static assets (served as-is)
│   └── dataset.json                 ← Fallback dataset (used when S3 and cache are unavailable)
│
├── dataset/                         ← Raw/synthetic dataset files (not served directly)
│   ├── dataset_synthetic_100.json   ← 100-stop synthetic dataset
│   └── video/                       ← Demo video assets
│
├── assert/                          ← Miscellaneous static assets
│   └── truck.jpg                    ← Truck image (24 KB)
│
├── scripts/                         ← Developer tooling
│   └── fetch_dataset_from_s3.py     ← Python script: downloads dataset from S3 to local file
│
├── server/                          ← Server-side (Python, minimal)
│   └── requirements.txt             ← boto3, python-dotenv
│
├── archeive/                        ← Archived/legacy files (not in active use)
│
└── node_modules/                    ← npm packages (gitignored)
```

---

## 3. Data Flow

```
App startup
    │
    ├─ 1. Try  GET /api/dataset       ← Vite S3 middleware (vite-plugin-s3-dataset.js)
    │         reads from AWS S3 bucket defined in .env
    │         returns JSON + headers X-S3-Bucket, X-S3-Key
    │
    ├─ 2. If S3 fails → read localStorage["ecoroute_dataset"]
    │
    └─ 3. If cache empty → GET /dataset.json  (public/ fallback file)

Each record is normalised in App.normalize():
    { ...raw, id, zone, ward, ccmcZone }
    ↓ stored in rawData state

Filters applied with useMemo → filteredData
    (selectedZone, selectedWard, priorityMode, hazards bitmask)

filteredData → passed as props to all child components
```

---

## 4. Layout Architecture

```
<App>  — flex h-screen w-screen
│
├── <Sidebar>              w-64  shrink-0  overflow-y-auto
│     Left control panel
│
└── flex-col flex-1
      │
      ├── <MetricsBar>     h-14  shrink-0  border-b
      │     Top KPI strip
      │
      └── flex-1  (map + right panel)
            │
            ├── <MapView>            flex-1  relative
            │     Full-height Leaflet map
            │     + picking-mode overlay banner (absolute, z-1000)
            │
            └── w-96  flex-col  border-l  bg-white
                  │
                  ├── Tab bar: "Priority Queue" | "Stop Details"
                  │
                  └── <StopList> or <StopDetails>  (overflow-y-auto)
```

---

## 5. Component Reference

### 5.1 `App.jsx` — Root Component

**State managed here:**

| State | Type | Description |
|---|---|---|
| `rawData` | `Array` | All normalised stops from dataset |
| `loading` | `boolean` | Shows truck loading screen |
| `dataSource` | `"s3" \| "cache" \| "file" \| null` | Origin of loaded data |
| `selectedStop` | `Object \| null` | Currently highlighted stop |
| `activeTab` | `"queue" \| "details"` | Right panel tab |
| `selectedZone` | `"ALL" \| "NORTH" \| ...` | Zone filter |
| `priorityMode` | `"P0" \| "P0+P1" \| "ALL"` | Priority filter |
| `showRoutes` | `boolean` | Toggle optimised route overlay |
| `hazards` | `{dengue, smoke, animals}` | Hazard layer toggles |
| `startCoords` | `[lat, lng]` | Route start (default: Vellalore Depot) |
| `endCoords` | `[lat, lng]` | Route end (default: same as start) |
| `pickingMode` | `"start" \| "end" \| null` | Map-click picking mode |
| `selectedWard` | `"ALL" \| number` | Ward number filter |

**Default start/end:** `[10.9601, 77.0229]` — Vellalore Depot

---

### 5.2 `Sidebar.jsx` — Left Control Panel

Width: `w-64`. Always visible. Scrollable.

**Sections (top to bottom):**

1. **COLLECTION ZONE** — buttons for ALL, NORTH, SOUTH, EAST, WEST, CENTRAL, INDUSTRIAL  
   Active zone shows coloured background + vehicle type label  
2. **PRIORITY FILTER** — P0 (Critical Only), P0+P1 (High + Critical), ALL  
3. **ROUTE** — Toggle "Show Optimised Route"  
   When toggled ON: expands a card with Pickup / Drop location pickers  
   - Dropdown of 10 known Coimbatore landmarks  
   - "Custom Coordinates" option → lat/lng number inputs  
   - "Pick on Map" button → activates `pickingMode`  
   - Round-trip checkbox (sets endCoords = startCoords)  
   - Drag pin hint banner  
4. **HAZARD LAYERS** — three Toggle switches: Dengue/Water, Smoke, Animals  
5. **SHIFT SUMMARY** — DISPATCH NOW count, ADD TO ROUTE count, TOTAL STOPS, TOTAL LOAD (kg)  
6. **LEGEND** — colour-coded dots for all 7 marker types  

**Sub-components:**
- `Toggle({ label, checked, onChange, accent })` — custom animated toggle switch
- `Section({ title })` — uppercase section label
- `LocationPicker({ label, value, onChange })` — dropdown + optional lat/lng fields

**Known locations (hardcoded):**
Vellalore Depot, Gandhipuram Bus Stand, Coimbatore Junction, Ukkadam Bus Terminus, Peelamedu, RS Puram Market, Singanallur, Coimbatore Airport, PSG College, Hopes College

---

### 5.3 `MapView.jsx` — Interactive Leaflet Map

Map center: `[11.016844, 76.955832]` (Coimbatore city centre). Default zoom: 12.

**Tile layer:** CartoDB Voyager (`basemaps.cartocdn.com/rastertiles/voyager`)

**Rendered layers (in order):**

| Layer | Condition | Details |
|---|---|---|
| Route polyline | `showRoutes && routePolyline.length > 1` | Weight 4, opacity 0.9, colour = zone colour or blue |
| START depot pin | `showRoutes` | Draggable. Green teardrop pin with "START" label |
| END depot pin | `showRoutes` | Draggable. Red teardrop pin with "END" label + total km |
| Route number badges | `showRoutes` | White circle with blue border, showing stop order number |
| Stop CircleMarkers | always | Colour and radius by priority/hazard. Clickable → opens popup |

**Marker colour logic (`getMarkerColor`):**
1. Dengue hazard active + stagnant water → `#7c3aed` (purple)
2. Smoke hazard active + smoke detected → `#d97706` (amber)
3. Animals hazard active + animal presence → `#16a34a` (green)
4. Near sensitive zone → `#e11d48` (rose)
5. Zone filter active → zone colour
6. Default → priority colour (P0=red, P1=amber, P2=green)

**Priority radii:** P0=16, P1=12, P2=8 (px)

**Sub-components:**
- `FitBounds({ points })` — auto-fits map bounds when data changes
- `MapClickHandler({ pickingMode, onMapPick })` — cursor crosshair + click handler for picking mode
- `depotIcon(type)` — returns `L.divIcon` for start/end pins (teardrop SVG shape)
- `routeNumIcon(n)` — returns `L.divIcon` with numbered badge

**Route optimisation:**
- `optimizeRoute(data, startCoords)` is called via `useMemo`
- Greedy nearest-neighbour algorithm, priority-sorted first
- `totalRouteKm` aggregates Haversine leg distances

---

### 5.4 `MetricsBar.jsx` — Top KPI Strip

Height: `h-14`. Light background. Horizontal scroll on overflow.

**Left section:** Data source badge (`S3` / `Cached` / `From file`) with stop count + "Refresh data" button

**Brand:** 🚛 EcoRoute / Coimbatore Waste Mgmt

**Zone badge:** shown when a specific zone is selected (coloured pill with vehicle type)

**KPI columns:**

| KPI | Colour rule |
|---|---|
| Stops in View | neutral |
| 🔴 P0 Critical | red if > 0 |
| 📦 Total Load (kg) | blue |
| ⚡ Dispatch Now | orange |
| ⚠️ Hazard Sites | amber if > 0 |
| 🏥 Near Sensitive | pink if > 0 |

**Route breadcrumb:** when `showRoutes`, shows start → end coordinates (green dot → red square)

---

### 5.5 `StopList.jsx` — Priority Queue Panel

Displayed when `activeTab === "queue"`.

- Search input filters by `area_name`
- Sorted: priority (`P0 < P1 < P2`), then by `estimated_weight_kg` descending
- Each row: left border coloured by priority, shows rank number, priority badge, zone emoji+name, area name, waste type, weight, hazard/sensitive icons, action (NOW / ROUTE), vehicle type
- Empty state: "No stops match your filters."

---

### 5.6 `StopDetails.jsx` — Stop Detail Card

Displayed when `activeTab === "details"`.

Empty state: 📍 + prompt to click a map marker.

**Sections (top to bottom):**

1. **Header card** — area name, priority badge, zone pill, action badge, vehicle type
2. **Site Image** — loads from S3 (`/api/s3-image?key=...`) or local (`/dump/filename`). Falls back to placeholder.
3. **Metrics grid (2×2)** — Waste Type, Weight, Volume Level, Area (m²)
4. **Active Hazards** — shown if any hazard flag is true (💧 Stagnant Water, 💨 Smoke, 🐕 Animals)
5. **Near Sensitive Zone** — zone name, type, distance in metres
6. **Recyclables** — shown if `high_value_recyclables_present` and `recyclable_types` exist
7. **AI Reasoning** — `reasoning` field, italic
8. **Meta** — Confidence %, Image quality, GPS accuracy ±m, After Photo required
9. **Ticket ID** — small grey text at bottom

---

## 6. Utilities Reference

### `utils/zones.js`

```js
ZONE_COLORS  // { NORTH, SOUTH, EAST, WEST, CENTRAL, INDUSTRIAL } → hex colours
ZONE_VEHICLE // zone → vehicle type string
ZONE_EMOJI   // zone → emoji
ALL_ZONES    // ["ALL","NORTH","SOUTH","EAST","WEST","CENTRAL","INDUSTRIAL"]
assignZone(lat, lng) // returns zone string based on coordinate thresholds
```

Zone threshold logic:
- `lat >= 11.060` → NORTH
- `lng >= 77.050` → EAST
- `lng <= 76.940` → WEST
- `lat <= 10.980` → SOUTH
- `lat <= 11.020 && lng >= 76.94` → CENTRAL
- else → INDUSTRIAL

---

### `utils/wards.js`

- `assignWard(area_name)` — keyword lookup against ~100 Coimbatore areas
- `assignWardByLocation(lat, lng)` — falls back to closest ward centroid (Haversine)
- `getZoneForWard(ward)` — returns CCMC zone for a given ward number
- `getUniqueWards(data)` — returns sorted list of unique ward numbers in dataset

---

### `utils/haversine.js`

```js
haversine(lat1, lng1, lat2, lng2) → distance in km (as float)
```

---

### `utils/routeOptimizer.js`

```js
optimizeRoute(stops, startCoords) → ordered stop array with legDistKm added
totalRouteKm(startCoords, stops, endCoords) → total km (float, 1 decimal)
```

Algorithm: priority-sorted greedy nearest-neighbour (not true TSP).

---

## 7. Dataset Schema (per stop record)

Each JSON record in `dataset.json` / `dataset_synthetic_100.json`:

| Field | Type | Description |
|---|---|---|
| `ticket_id` | string | Unique ticket identifier |
| `area_name` | string | Human-readable location name |
| `lat` | number | GPS latitude |
| `lng` | number | GPS longitude |
| `gps_accuracy_m` | number | GPS accuracy in metres |
| `priority` | `"P0" \| "P1" \| "P2"` | Urgency level |
| `action` | `"DISPATCH_NOW" \| "ADD_TO_ROUTE"` | Recommended action |
| `waste_type` | string | e.g. "Mixed", "Organic", "Construction" |
| `estimated_weight_kg` | number | Estimated weight |
| `volume_level` | `"CRITICAL" \| "HIGH" \| "MEDIUM" \| "LOW"` | Fill level |
| `area_covered_sqm` | number | Waste spread area |
| `vehicle_type` | string | e.g. "COMPACTOR", "E-RICKSHAW" |
| `stagnant_water_detected` | boolean | Dengue/water hazard |
| `smoke_detected` | boolean | Air quality hazard |
| `animal_presence` | boolean | Animal scavenging hazard |
| `near_sensitive_zone` | boolean | Near hospital/school/etc. |
| `nearest_zone` | `{name, zone_type, distance_m}` | Sensitive zone details |
| `high_value_recyclables_present` | boolean | Recyclable materials present |
| `recyclable_types` | `string[]` | e.g. ["Plastic", "Metal"] |
| `image_file` | string | Path or S3 URI `s3://bucket/key` |
| `image_quality` | string | e.g. "HIGH", "MEDIUM" |
| `confidence_score` | number | AI confidence 0–1 |
| `reasoning` | string | AI-generated reasoning text |
| `requires_after_photo` | boolean | Post-collection photo needed |

**Derived fields added by `normalize()`:**
- `id` — sequential index (integer)
- `zone` — assigned by `assignZone(lat, lng)`
- `ward` — assigned by `assignWard(area_name)` or `assignWardByLocation(lat, lng)`
- `ccmcZone` — CCMC administrative zone from `getZoneForWard(ward)`

---

## 8. Vite Plugin — `vite-plugin-s3-dataset.js`

Custom Vite dev-server middleware that:

- `GET /api/dataset` — Fetches JSON dataset from `s3://{S3_BUCKET}/{S3_KEY}` using `@aws-sdk/client-s3`. Returns JSON with headers `X-S3-Bucket` and `X-S3-Key`.
- `GET /api/s3-image?key=<key>` — Proxies image from S3 with correct Content-Type.

AWS env vars (from `.env`):
```
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=internal-testing-1
S3_KEY=input/dataset_synthetic_100.json
```

---

## 9. Styling System

### Typography
- Font: **Inter** (Google Fonts, weights 400–900)
- Fallback: `system-ui, sans-serif`

### Colour Palette (Tailwind utility classes used throughout)

| Purpose | Class / Hex |
|---|---|
| Background | `bg-slate-100` / `bg-slate-50` / `bg-white` |
| Border | `border-slate-200` |
| Text primary | `text-slate-900` / `text-slate-800` |
| Text muted | `text-slate-400` / `text-slate-500` |
| P0 Critical | `#ef4444` / `text-red-500` |
| P1 High | `#f59e0b` / `text-amber-400` |
| P2 Routine | `#10b981` / `text-green-500` |
| Route / Primary | `#2563eb` / `text-blue-600` |
| Stagnant Water | `#7c3aed` (purple) |
| Smoke | `#d97706` (amber) |
| Animals | `#16a34a` (green) |
| Sensitive Zone | `#e11d48` (rose) |

### Zone Colours

| Zone | Hex |
|---|---|
| NORTH | `#EF5350` |
| SOUTH | `#AB47BC` |
| EAST | `#42A5F5` |
| WEST | `#26A69A` |
| CENTRAL | `#FF7043` |
| INDUSTRIAL | `#607D8B` |

### Custom CSS Classes (in `index.css`)

| Class | Description |
|---|---|
| `.route-badge` | Numbered white circle with blue border for route order |
| `.pin-marker` | Base class for depot pin with drop animation |
| `.pin-start` | Green gradient teardrop pin (START) |
| `.pin-end` | Red gradient teardrop pin (END) |
| `.pin-label` | Floating "START" / "END" label above pin |
| `.pin-body` | Teardrop body (rotated square + circle trick) |
| `.pin-icon` | Inner SVG icon (counter-rotate to stay upright) |
| `.pin-pulse-ring` | Animated pulsing dot at pin tip |
| `.pin-shadow` | Blurred shadow dot below pin |

**Animations:**
- `pin-drop` — pins drop from above with spring overshoot (0.5s cubic-bezier)
- `pin-pulse` — pulsing ring scales 1→2.2→1 with fade (2s infinite)

---

## 10. npm Scripts

| Script | Command |
|---|---|
| `npm run dev` | `vite` — starts dev server on port 5173 |
| `npm run build` | `vite build` — production bundle |
| `npm run preview` | `vite preview` — serves production build |
| `npm run fetch-s3` | `python3 scripts/fetch_dataset_from_s3.py` — downloads dataset to disk |

---

## 11. Key Design Decisions

1. **S3 → Cache → File fallback chain** — dataset loading is resilient; works fully offline using `localStorage` or `public/dataset.json`.
2. **No backend server** — all data served via Vite middleware plugin; no separate Express or FastAPI server running in production.
3. **Greedy route optimiser** — not a true TSP solver; priority-sorts stops first, then applies nearest-neighbour. Deliberately simple for real-time use.
4. **Picking mode banner** — when the user clicks "Pick on Map", a sticky overlay banner appears at the top-center of the map to guide interaction.
5. **Draggable depot pins** — both START and END pins can be dragged on the map directly, updating `startCoords`/`endCoords` in App state.
6. **Hazard filtering is OR-based** — a stop appears if ANY of the enabled hazards matches, not ALL.
7. **Zone assignment is coordinate-only** — uses simple lat/lng threshold boxes, not actual polygon boundaries.
8. **Image resolution** — S3 paths (`s3://bucket/key`) are rewritten to `/api/s3-image?key=...`; local paths use `/dump/filename` from the binary dump folder.

---

## 12. Files NOT to Modify Without Caution

| File | Reason |
|---|---|
| `vite-plugin-s3-dataset.js` | Handles all S3 API; changing API routes breaks data loading |
| `src/utils/wards.js` | Large lookup file with CCMC ward data; hand-curated |
| `public/dataset.json` | Fallback dataset; replacing changes offline behaviour |
| `.env` | AWS credentials; never commit to version control |
