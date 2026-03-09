<div align="center">

<img src="https://img.shields.io/badge/AI%20for%20Bharat-Sustainability%20Hackathon%202026-00C896?style=for-the-badge&logoColor=white"/>

# 🌿 Sutham — Smart Waste Intelligence for Bharat

**सुथम · சுத்தம் · Clean**

> AI-powered waste detection, hazard intelligence, and route optimization platform  
> built for Coimbatore Municipal Corporation — and every Indian city after it.

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-sutham.aivar.app-00C896?style=flat-square)](https://sutham.aivar.app)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Nova%20Pro%20Vision-FF9900?style=flat-square&logo=amazonaws)](https://aws.amazon.com/bedrock/)
[![AWS Location](https://img.shields.io/badge/AWS-Location%20Service-FF9900?style=flat-square&logo=amazonaws)](https://aws.amazon.com/location/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

### 🏆 One photo. Ten seconds. A dispatch-ready cleanup ticket.

| 93 Active Sites | 3,194 kg Detected | 96% AI Confidence | < 10s Per Ticket |
|:-:|:-:|:-:|:-:|
| Live · Coimbatore | Total Load | Nova Pro Vision | End-to-End |

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Platform Overview](#-platform-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Zone Management](#-zone-management)
- [AI Analysis Pipeline](#-ai-analysis-pipeline)
- [Dataset Schema](#-dataset-schema)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Performance](#-performance)
- [Team](#-team)

---

## 🚨 The Problem

India generates **150,000 tonnes of municipal solid waste every single day**.  
The waste management market is worth **$8 billion and growing at 6% annually** — yet the system running it is WhatsApp messages, phone calls, and paper registers.

| Pain Point | Current Reality | Sutham's Fix |
|---|---|---|
| No real-time visibility | Supervisors fly blind | Live AI-mapped hotspots |
| Unstructured complaints | WhatsApp photos, calls | Structured JSON dispatch tickets |
| No priority intelligence | Every complaint equal | P0 / P1 / P2 AI triage |
| Sensitive zones ignored | Schools, hospitals at risk | Automatic proximity alerts |
| Manual routing | Driver decides the path | AI-optimized multi-stop routes |
| Hazards undetected | Dengue, fire, animals missed | Layered hazard overlays |

---

## 💡 Our Solution

**Sutham** is a two-layer AI waste intelligence platform:

```
 CITIZEN / FIELD WORKER                    MUNICIPAL SUPERVISOR
 ─────────────────────                    ────────────────────────
  📸 Snap a photo                          🗺️  EcoRoute Command Dashboard
       ↓                                        ↓
  🤖 Nova Pro Vision                        📊 93 live sites mapped
  analyzes waste type,                      🔴 40 P0 Critical flagged
  volume, weight,                           ⚠️  45 hazard sites overlaid
  recyclables, priority                     🏫 33 near sensitive zones
       ↓                                        ↓
  📍 GPS auto-extracted                     🚛 Optimized route generated
  AWS Location geocoding                    in <500ms for 100 stops
  Sensitive zone check                      764 kg load dispatched
       ↓
  🎫 Ticket ID generated
  Priority + Vehicle + Action
  → Ready for EcoRoute in seconds
```

---

## 🖥️ Platform Overview

### 1 · User Interface — Sutham Next (Mobile-First Reporting)

The citizen and field-worker facing app. Powered by **Next.js 16** with **AWS Bedrock Nova Pro**.

**Key Capabilities:**
- 📸 Single photo upload → full AI waste analysis in under 10 seconds
- 🛰️ Automatic GPS from EXIF data; device GPS fallback
- 🗺️ AWS Location Service reverse-geocoding to exact street address
- 🏥 Real-time sensitive zone proximity check (hospitals, schools, PHCs, water bodies)
- ♻️ Recyclable material detection (plastic, wood, metal, organic)
- 📋 Structured JSON ticket output: type · weight · volume · priority · vehicle · reasoning
- 🔒 Confidence score + image quality assessment per upload

**Sample AI Output:**
```json
{
  "waste_detected": true,
  "waste_type": "MIXED",
  "volume_level": "HIGH",
  "estimated_weight_kg": 50,
  "area_covered_sqm": 5,
  "priority": "P1",
  "action": "DISPATCH_NOW",
  "vehicle_type": "PICKUP",
  "high_value_recyclables_present": true,
  "recyclable_types": ["PLASTIC", "WOOD"],
  "confidence_score": 0.95,
  "near_sensitive_zone": false,
  "reasoning": "Significant mixed waste including plastic bottles and wooden crates spread over 5 sqm. High-value recyclables present. Pickup dispatch recommended."
}
```

---

### 2 · Admin Dashboard — EcoRoute (Command & Dispatch)

The municipal supervisor's command center. Built with **React 18 + Vite + React-Leaflet**.

**Key Capabilities:**
- 🗺️ Interactive live map with 1000+ stop support at smooth 60fps
- 🏙️ Zone-based operations: North · South · East · West · Central · Industrial
- 🔴 Priority queue: P0 Critical → P1 High → P2 Routine with visual differentiation
- 🛣️ AI route optimizer: Greedy Nearest Neighbor TSP, <500ms for 100 stops
- 📍 Custom GPS pin + 10 predefined depot landmarks + draggable map pins
- ⚠️ Hazard layer overlays: Dengue/Stagnant Water · Air Quality/Smoke · Animal Scavenging
- 🏥 Sensitive zone alerts with distance-to-school/hospital display
- 📊 Live shift summary: Dispatch Now count · Route stops · Total load (kg)
- ☁️ AWS S3 dataset integration with localStorage cache fallback

---

## 🏗️ Architecture

```
sutham/
├── admin-ui/                          # React + Vite Command Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx               # Leaflet map with all overlays
│   │   │   ├── SidePanel.jsx         # Zone filter + route controls
│   │   │   ├── StopDetails.jsx       # Right panel: site info + AI reasoning
│   │   │   └── ShiftSummary.jsx      # Live KPI bar
│   │   └── utils/
│   │       ├── haversine.js          # GPS distance (Haversine formula)
│   │       ├── routeOptimizer.js     # Nearest Neighbor TSP
│   │       ├── zones.js              # Zone assignment + colors
│   │       └── wards.js              # CCMC ward boundary lookup
│   ├── Dockerfile                    # Nginx production container
│   └── .env.example
│
└── user-ui/
    └── WasteManagement/
        └── User-interface/            # Next.js 16 Mobile App
            ├── src/
            │   ├── app/
            │   │   └── api/
            │   │       └── analyze/  # Nova Pro + Location Service route
            │   └── components/
            │       ├── UploadZone    # Drag & drop + camera capture
            │       ├── TicketCard    # AI result display
            │       └── MapPreview    # GPS location preview
            ├── docs/
            │   └── DEPLOYMENT_GUIDANCE.md
            └── .env.example
```

---

## 🔧 Tech Stack

### Admin Dashboard
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 7 |
| Mapping | React-Leaflet 4, Leaflet 1.9, CartoDB tiles |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Routing Algorithm | Greedy Nearest Neighbor TSP (Haversine) |
| Cloud | AWS S3, AWS SDK v3 |
| Containerization | Docker + Nginx |

### User Interface
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript (full type safety) |
| AI Vision | AWS Bedrock — Amazon Nova Pro v1 |
| Geocoding | AWS Location Service (Places API v2) |
| GPS | EXIF extraction → device fallback |
| Styling | Tailwind CSS 4 |
| Deployment | AWS App Runner / Amplify |

---

## 🗺️ Zone Management

Coimbatore divided into 6 operational zones with dedicated vehicle fleets:

| Zone | Color | Vehicle | Coverage Rule |
|---|---|---|---|
| 🔴 NORTH | Red | Compactor | lat ≥ 11.060 |
| 🟣 SOUTH | Purple | E-Rickshaw | lat ≤ 10.980 |
| 🔵 EAST | Blue | Tipper | lng ≥ 77.050 |
| 🩵 WEST | Teal | Mini Truck | lng ≤ 76.940 |
| 🟠 CENTRAL | Orange | Compactor x2 | Central business district |
| ⚫ INDUSTRIAL | Grey | Heavy Truck | Industrial corridors |

---

## 🤖 AI Analysis Pipeline

```
Image Upload (JPG/PNG/TIFF/HEIC up to 200MB)
        ↓
EXIF GPS Extraction (Pillow)
   → if no EXIF: Device GPS fallback
        ↓
Image → PNG conversion → AWS Bedrock (Nova Pro v1:0)
   Tool-driven agent: forces single waste_report() call
        ↓
Structured JSON output:
   waste_type · volume_level · estimated_weight_kg
   area_covered_sqm · priority · action · vehicle_type
   stagnant_water · smoke · animal · recyclable_types
   confidence_score · image_quality · reasoning
        ↓
AWS Location Service (reverse-geocode + search-nearby)
   → street address · suburb · city · state
   → nearby landmarks (hospitals, schools, stations)
        ↓
Sensitive Zone Check (Haversine · 47 verified zones)
   → hospitals · PHCs · schools · colleges · water bodies
   → if within 50m: auto-escalate to P0
        ↓
Final Ticket JSON → S3 storage → EcoRoute Dashboard
```

---

## 📦 Dataset Schema

Every waste collection point follows this normalized schema:

```json
{
  "ticket_id":                   "uuid-string",
  "created_at":                  "ISO-8601 timestamp",
  "area_name":                   "4th Street, Coimbatore, Tamil Nadu",
  "lat":                         11.041895,
  "lng":                         77.044629,
  "priority":                    "P0 | P1 | P2",
  "action":                      "DISPATCH_NOW | ADD_TO_ROUTE",
  "waste_type":                  "MIXED | ORGANIC | PLASTIC | METAL | ...",
  "volume_level":                "CRITICAL | HIGH | MEDIUM | LOW",
  "estimated_weight_kg":         50,
  "area_covered_sqm":            5,
  "vehicle_type":                "COMPACTOR | PICKUP | TIPPER | ...",
  "stagnant_water_detected":     false,
  "smoke_detected":              false,
  "animal_presence":             false,
  "near_sensitive_zone":         true,
  "nearest_zone": {
    "name":                      "St Michael's Academy",
    "zone_type":                 "SCHOOL",
    "distance_m":                26.5
  },
  "high_value_recyclables_present": true,
  "recyclable_types":            ["PLASTIC", "WOOD"],
  "image_file":                  "images/uuid.png",
  "confidence_score":            0.95,
  "image_quality":               "CLEAR",
  "gps_source":                  "exif | device",
  "gps_accuracy_m":              20,
  "wall_time_seconds":           6,
  "reasoning":                   "Natural language AI explanation"
}
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Admin) / 20+ (User Interface)
- AWS Account with: S3 · Bedrock (Nova Pro) · Location Service · IAM credentials

### Admin Dashboard
```bash
git clone https://github.com/your-org/sutham.git
cd sutham/admin-ui

npm install
cp .env.example .env
# Add your AWS credentials to .env

npm run dev
# → http://localhost:5173
```

### User Interface
```bash
cd sutham/user-ui/WasteManagement/User-interface

npm install
cp .env.example .env.local
# Add your AWS credentials to .env.local

npm run dev
# → http://localhost:3000
```

---

## 🔐 Environment Variables

### Admin Dashboard — `.env`
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your-sutham-bucket
S3_KEY=input/dataset_synthetic_100.json
```

### User Interface — `.env.local`
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_LOCATION_API_KEY=your_location_api_key
AWS_LOCATION_REGION=us-east-1
```

> ⚠️ Never commit credentials to source control. Use AWS IAM roles in production.

---

## 📦 Deployment

### Admin Dashboard
| Method | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Port 5173 |
| Production build | `npm run build` | Static output |
| Docker | `docker build -t sutham-admin .` | Nginx container |
| AWS ECS | See `Dockerfile` | Recommended for prod |

### User Interface
| Method | Notes |
|---|---|
| AWS Amplify | Recommended · managed Next.js · auto CI/CD |
| AWS App Runner | Containerized · currently live |
| AWS ECS Fargate | Full control · production scale |

See [`DEPLOYMENT_GUIDANCE.md`](user-ui/WasteManagement/User-interface/docs/DEPLOYMENT_GUIDANCE.md) for complete step-by-step instructions.

---

## 📈 Performance

| Metric | Target | Achieved |
|---|---|---|
| AI ticket generation | < 10s | ✅ ~6s avg |
| Route optimization (100 stops) | < 500ms | ✅ |
| Map rendering (500+ markers) | 60fps smooth | ✅ |
| Admin dashboard stop capacity | 1000+ | ✅ |
| GPS accuracy (EXIF) | ± 5m | ✅ |
| GPS accuracy (device fallback) | ± 20–35m | ✅ |

---

## 🎯 Use Cases

1. **Municipal Operations** — Real-time fleet dispatch and optimized multi-zone routing
2. **Citizen Reporting** — One-photo waste reporting with zero form-filling
3. **Health & Hazard Monitoring** — Dengue, smoke, and animal scavenging alerts
4. **Sensitive Zone Compliance** — Automatic escalation near hospitals, schools, PHCs
5. **Circular Economy** — Recyclable hotspot intelligence for buyback operators
6. **Shift Planning** — Data-driven vehicle allocation and workload balancing

---

## 🤝 Acknowledgments

- **Coimbatore Municipal Corporation** — for the operational context and zone data
- **Amazon Web Services** — Nova Pro vision, Location Service, S3, App Runner
- **OpenStreetMap contributors** — base map data
- **CartoDB** — map tile hosting

---

<div align="center">

**Built with ❤️ for AI for Bharat Sustainability Hackathon 2026**

*Sutham — सुथम — சுத்தம் — Clean*

[![Live](https://img.shields.io/badge/🌐%20Live%20Platform-sutham.aivar.app-00C896?style=for-the-badge)](https://sutham.aivar.app)

</div>
