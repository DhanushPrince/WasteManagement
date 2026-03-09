# 🚛 EcoRoute — React Waste Management Dashboard

## Tech Stack
- **React 18** + Vite
- **React-Leaflet 4** (interactive map, dark tile)
- **Tailwind CSS 3** (dark professional UI)
- **Lucide React** (icons)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy your dataset
cp /path/to/dataset_synthetic_100.json public/dataset.json

# 3. Run dev server
npm run dev
# → opens at http://localhost:5173

# 4. Build for production
npm run build
```

## Folder Structure
```
ecoroute/
├── public/
│   └── dataset.json           ← your data goes here
├── src/
│   ├── App.jsx                ← root layout
│   ├── index.css              ← Tailwind + custom styles
│   ├── main.jsx               ← React entry point
│   ├── utils/
│   │   ├── zones.js           ← zone assignment + colors
│   │   ├── haversine.js       ← GPS distance calc
│   │   └── routeOptimizer.js  ← Nearest Neighbor TSP
│   └── components/
│       ├── Sidebar.jsx        ← all filters + legend
│       ├── MapView.jsx        ← Leaflet map + markers + route
│       ├── MetricsBar.jsx     ← top KPI strip
│       ├── StopList.jsx       ← priority queue list
│       └── StopDetails.jsx    ← click-to-detail panel
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Features
| Feature | Description |
|---|---|
| Zone Selector | NORTH/SOUTH/EAST/WEST/CENTRAL/INDUSTRIAL tabs |
| Priority Filter | P0 only / P0+P1 / All stops |
| Hazard Layers | Dengue, Smoke, Animal toggle overlays |
| Optimized Route | Nearest Neighbor TSP with numbered stops |
| Priority Queue | Ranked stop list with search |
| Stop Details | Click marker → full details in side panel |
| Metrics Bar | Live KPIs: stops, load, P0 count, hazards |
| Dark Map | CartoDB Dark Matter tile |
