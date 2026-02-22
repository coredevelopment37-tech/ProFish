# ProFish — Map Features Specification v1.0

> **Last updated:** 2026-02-21  
> **Stack:** React Native 0.83.1 · @rnmapbox/maps · Mapbox GL  
> **Reference:** `src/config/layerRegistry.js`, `src/screens/main/MapScreen.js`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Map Engine Configuration](#2-map-engine-configuration)
3. [Layer System (18 Layers)](#3-layer-system-18-layers)
4. [Layer Rendering Order (Z-Index)](#4-layer-rendering-order-z-index)
5. [Subscription Tier Access Matrix](#5-subscription-tier-access-matrix)
6. [CPU Budget System](#6-cpu-budget-system)
7. [Map Interactions](#7-map-interactions)
8. [Search System](#8-search-system)
9. [Markers & Clusters](#9-markers--clusters)
10. [Offline Maps](#10-offline-maps)
11. [Performance & Caching](#11-performance--caching)
12. [Layer Picker UI](#12-layer-picker-ui)
13. [Battery & Resource Management](#13-battery--resource-management)
14. [Error Handling & Fallbacks](#14-error-handling--fallbacks)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  MapScreen.js                                        │
│  ├── MapboxGL.MapView (Dark / Satellite base)        │
│  │   ├── MapboxGL.Camera (follow mode / manual)      │
│  │   ├── MapboxGL.UserLocation                       │
│  │   ├── RasterSource[] (tile overlay layers)        │
│  │   ├── VectorSource[] (GeoJSON/vector layers)      │
│  │   └── ShapeSource (catch markers / zones)         │
│  ├── WeatherCard (compact overlay)                   │
│  ├── MapControls (layers, GPS, compass, follow)      │
│  ├── LayerPicker (modal, budget-aware)               │
│  ├── SearchBar (location, species, spots)            │
│  └── FAB → LogCatch                                  │
├──────────────────────────────────────────────────────┤
│  layerRegistry.js                                    │
│  ├── LAYERS{} — 18 layer definitions                 │
│  ├── MAX_LAYER_BUDGET = 10                           │
│  ├── calculateBudget() / canActivateLayer()          │
│  └── getAvailableLayers(tier) / getDefaultLayers()   │
├──────────────────────────────────────────────────────┤
│  offlineManager.js                                   │
│  ├── downloadPack() — Mapbox offline tile packs      │
│  ├── deletePack() / getPacks()                       │
│  └── AsyncStorage persistence                        │
└──────────────────────────────────────────────────────┘
```

### SDK & Tokens

| Dependency          | Version                         | Notes                                                   |
| ------------------- | ------------------------------- | ------------------------------------------------------- |
| `@rnmapbox/maps`    | Latest stable                   | Wraps Mapbox GL Native                                  |
| Mapbox access token | `MAPBOX_ACCESS_TOKEN` in `.env` | Set via `MapboxGL.setAccessToken()` before first render |
| Free tier limit     | 25,000 MAU                      | Upgrade when approaching threshold                      |

---

## 2. Map Engine Configuration

### Default MapView Props

```js
<MapboxGL.MapView
  styleURL={
    isBaseDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.SatelliteStreet
  }
  compassEnabled={true}
  scaleBarEnabled={false}
  logoEnabled={false} // hidden for clean UX; attribution in Settings
  attributionEnabled={false} // legal attribution in app Settings screen
  rotateEnabled={true}
  pitchEnabled={true} // 3D tilt for terrain viewing
  zoomEnabled={true}
/>
```

### Camera Defaults

| Parameter          | Value                                               | Notes                          |
| ------------------ | --------------------------------------------------- | ------------------------------ |
| Default center     | User GPS, fallback `[18.0686, 59.3293]` (Stockholm) | Fallback for permission denied |
| Default zoom       | 12 (with GPS), 2 (without)                          |                                |
| Follow mode zoom   | 13                                                  | Fishing-optimized              |
| Min zoom           | 1                                                   | World view                     |
| Max zoom           | 18                                                  | Street-level detail            |
| Animation duration | 500ms                                               | Camera transitions             |
| Tilt range         | 0°–60°                                              | For 3D bathymetry viewing      |

---

## 3. Layer System (18 Layers)

### Layer 1: `base-dark`

| Property              | Value                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `base-dark`                                                                                                                  |
| **Label**             | `layer.baseDark`                                                                                                             |
| **Description**       | Mapbox Dark base style — default map appearance                                                                              |
| **Data Source**       | Mapbox GL Style                                                                                                              |
| **Style URL**         | `mapbox://styles/mapbox/dark-v11`                                                                                            |
| **Tile Type**         | Vector (Mapbox Streets)                                                                                                      |
| **Update Frequency**  | Mapbox-managed (continuous)                                                                                                  |
| **Free Tier Limits**  | 25,000 MAU (Mapbox free tier)                                                                                                |
| **Subscription Tier** | Free                                                                                                                         |
| **CPU Cost**          | 0 (base layer — always loaded)                                                                                               |
| **Opacity**           | 1.0                                                                                                                          |
| **Z-Index**           | 0 (bottom)                                                                                                                   |
| **Notes**             | Mutually exclusive with `satellite`. Dark theme reduces eye strain for dawn/dusk fishing. Water areas rendered in `#191A2E`. |

---

### Layer 2: `satellite`

| Property              | Value                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                | `satellite`                                                                                                                                      |
| **Label**             | `layer.satellite`                                                                                                                                |
| **Description**       | Mapbox Satellite Streets — aerial imagery with labels                                                                                            |
| **Data Source**       | Mapbox Satellite                                                                                                                                 |
| **Style URL**         | `mapbox://styles/mapbox/satellite-streets-v12`                                                                                                   |
| **Tile Type**         | Raster (satellite) + Vector (labels)                                                                                                             |
| **Update Frequency**  | Mapbox-managed (imagery updated periodically)                                                                                                    |
| **Free Tier Limits**  | Included in 25,000 MAU                                                                                                                           |
| **Subscription Tier** | Free                                                                                                                                             |
| **CPU Cost**          | 0 (base layer)                                                                                                                                   |
| **Opacity**           | 1.0                                                                                                                                              |
| **Z-Index**           | 0 (replaces base-dark)                                                                                                                           |
| **Notes**             | Mutually exclusive with `base-dark`. Preferred by offshore anglers for structure identification. Toggle via `MapboxGL.StyleURL.SatelliteStreet`. |

---

### Layer 3: `bathymetry`

| Property              | Value                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `bathymetry`                                                                                                                                 |
| **Label**             | `layer.bathymetry`                                                                                                                           |
| **Description**       | GEBCO global ocean bathymetry — depth shading from ocean floor mapping                                                                       |
| **Data Source**       | GEBCO via ESRI ArcGIS tile service                                                                                                           |
| **Tile URL**          | `https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_basemap_NCEI/MapServer/tile/{z}/{y}/{x}`                         |
| **Tile Type**         | Raster (256×256 PNG)                                                                                                                         |
| **Update Frequency**  | Annually (GEBCO releases yearly grids)                                                                                                       |
| **Free Tier Limits**  | Unlimited (open data, ESRI tile service)                                                                                                     |
| **Subscription Tier** | Pro                                                                                                                                          |
| **CPU Cost**          | 2                                                                                                                                            |
| **Opacity**           | 0.7                                                                                                                                          |
| **Z-Index**           | 10                                                                                                                                           |
| **Color Ramp**        | Light blue (shallow, 0–50m) → Dark blue (mid, 50–500m) → Navy/Black (deep, 500m+)                                                            |
| **Min Zoom**          | 3                                                                                                                                            |
| **Max Zoom**          | 13                                                                                                                                           |
| **Notes**             | Critical for identifying dropoffs, ledges, and underwater structure. Pairs well with `depth-contours` for precise readings. Global coverage. |

---

### Layer 4: `nautical-charts`

| Property              | Value                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `nautical-charts`                                                                                                                                                                                     |
| **Label**             | `layer.nauticalCharts`                                                                                                                                                                                |
| **Description**       | NOAA Electronic Navigational Charts — official US nautical chart rasters                                                                                                                              |
| **Data Source**       | NOAA Office of Coast Survey                                                                                                                                                                           |
| **Tile URL**          | `https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png`                                                                                                                                   |
| **Alt Scales**        | `https://tileservice.charts.noaa.gov/tiles/{scale}_1/{z}/{x}/{y}.png` where scale = `10000`, `25000`, `50000`, `100000`                                                                               |
| **Tile Type**         | Raster (256×256 PNG)                                                                                                                                                                                  |
| **Update Frequency**  | Weekly (NOAA updates every Thursday)                                                                                                                                                                  |
| **Free Tier Limits**  | Unlimited (US government open data)                                                                                                                                                                   |
| **Coverage**          | US coastal & inland waterways only                                                                                                                                                                    |
| **Subscription Tier** | Pro                                                                                                                                                                                                   |
| **CPU Cost**          | 2                                                                                                                                                                                                     |
| **Opacity**           | 0.7                                                                                                                                                                                                   |
| **Z-Index**           | 11                                                                                                                                                                                                    |
| **Min Zoom**          | 4                                                                                                                                                                                                     |
| **Max Zoom**          | 17                                                                                                                                                                                                    |
| **Notes**             | Shows buoys, channels, hazards, depth soundings, restricted areas. US-only; future: integrate international hydrographic offices. Automatically hidden outside US bbox `[-179.9, 17.5, -66.5, 72.0]`. |

---

### Layer 5: `sea-surface-temp`

| Property              | Value                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------- | --- | --- | --- | --- | --- |
| **ID**                | `sea-surface-temp`                                                                                                                                                                                                                                    |
| **Label**             | `layer.sst`                                                                                                                                                                                                                                           |
| **Description**       | Sea surface temperature color ramp from satellite-derived SST data                                                                                                                                                                                    |
| **Data Source**       | JPL MUR SST via NOAA CoastWatch ERDDAP                                                                                                                                                                                                                |
| **Tile URL / WMS**    | `https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.transparentPng?analysed_sst[(last)][(south):(north)][(west):(east)]&.draw=surface&.vars=longitude                                                                                        | latitude | analysed_sst&.colorBar=Rainbow2 |     |     |     |     | `   |
| **Alt Source**        | Copernicus Marine WMTS: `https://wmts.marine.copernicus.eu/teroWmts?service=WMTS&request=GetTile&layer=SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001&style=boxfill/rainbow&tilematrixset=EPSG:3857&tilematrix={z}&tilerow={y}&tilecol={x}&format=image/png` |
| **Tile Type**         | WMS raster / WMTS tiles                                                                                                                                                                                                                               |
| **Update Frequency**  | Daily (MUR SST is daily composite)                                                                                                                                                                                                                    |
| **Free Tier Limits**  | Unlimited (CoastWatch ERDDAP is free); Copernicus requires free registration                                                                                                                                                                          |
| **Subscription Tier** | Pro                                                                                                                                                                                                                                                   |
| **CPU Cost**          | 2                                                                                                                                                                                                                                                     |
| **Opacity**           | 0.6                                                                                                                                                                                                                                                   |
| **Z-Index**           | 20                                                                                                                                                                                                                                                    |
| **Color Ramp**        | Rainbow: Purple (< 5°C) → Blue (10°C) → Green (15°C) → Yellow (20°C) → Orange (25°C) → Red (> 30°C)                                                                                                                                                   |
| **Resolution**        | ~1 km (MUR SST)                                                                                                                                                                                                                                       |
| **Notes**             | Essential for finding temperature breaks where fish concentrate. Temperature break detection algorithm highlights ≥ 2°C/km gradients as yellow lines. Viewport-bounded requests only.                                                                 |

---

### Layer 6: `chlorophyll`

| Property              | Value                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- | --- | --- | --- | --- | --- |
| **ID**                | `chlorophyll`                                                                                                                                                                                           |
| **Label**             | `layer.chlorophyll`                                                                                                                                                                                     |
| **Description**       | Chlorophyll-a concentration — indicates phytoplankton density (fish food chain base)                                                                                                                    |
| **Data Source**       | NOAA CoastWatch ERDDAP (Aqua MODIS / VIIRS)                                                                                                                                                             |
| **Tile URL / WMS**    | `https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdMH1chla1day.transparentPng?chlorophyll[(last)][(south):(north)][(west):(east)]&.draw=surface&.vars=longitude                                        | latitude | chlorophyll&.colorBar=OceanChlorophyll |     |     |     |     | `   |
| **Alt Source**        | Copernicus Sentinel-3 OLCI: `https://wmts.marine.copernicus.eu/teroWmts` (layer: `OCEANCOLOUR_GLO_BGC_L4_NRT_009_102`)                                                                                  |
| **Tile Type**         | WMS raster                                                                                                                                                                                              |
| **Update Frequency**  | Daily (cloud-permitting; 8-day composites available as fallback)                                                                                                                                        |
| **Free Tier Limits**  | Unlimited (ERDDAP is free)                                                                                                                                                                              |
| **Subscription Tier** | Pro                                                                                                                                                                                                     |
| **CPU Cost**          | 2                                                                                                                                                                                                       |
| **Opacity**           | 0.5                                                                                                                                                                                                     |
| **Z-Index**           | 21                                                                                                                                                                                                      |
| **Color Ramp**        | Blue (< 0.1 mg/m³) → Cyan (0.3) → Green (1.0) → Yellow (3.0) → Red (> 10.0) — Logarithmic scale                                                                                                         |
| **Resolution**        | ~4 km (MODIS), ~300m (Sentinel-3)                                                                                                                                                                       |
| **Notes**             | High chlorophyll = baitfish = game fish. Cloud cover causes data gaps — use 8-day composite (`erdMH1chla8day`) as fallback when daily is sparse. Show "Data gap" badge when coverage < 30% of viewport. |

---

### Layer 7: `wind-overlay`

| Property              | Value                                                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `wind-overlay`                                                                                                                                                                                             |
| **Label**             | `layer.windArrows`                                                                                                                                                                                         |
| **Description**       | Animated wind particle vectors showing direction and speed                                                                                                                                                 |
| **Data Source**       | Open-Meteo Marine Forecast API                                                                                                                                                                             |
| **API Endpoint**      | `https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=wind_wave_direction,wind_wave_height&current=wind_speed_10m,wind_direction_10m`                                         |
| **Alt Source**        | `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m`                                                                           |
| **Tile Type**         | GeoJSON (client-generated wind particles from API data)                                                                                                                                                    |
| **Update Frequency**  | Hourly (API refresh)                                                                                                                                                                                       |
| **Free Tier Limits**  | 10,000 requests/day (Open-Meteo non-commercial)                                                                                                                                                            |
| **Subscription Tier** | Free                                                                                                                                                                                                       |
| **CPU Cost**          | 1                                                                                                                                                                                                          |
| **Opacity**           | 0.8                                                                                                                                                                                                        |
| **Z-Index**           | 30                                                                                                                                                                                                         |
| **Rendering**         | Animated particle flow lines using `MapboxGL.LineLayer` with offset animation. Arrow icons at grid points (every ~50px screen space). Color: white (< 10kt) → yellow (15kt) → orange (20kt) → red (> 25kt) |
| **Grid Resolution**   | Sampled at viewport 8×8 grid, interpolated                                                                                                                                                                 |
| **Notes**             | Wind is a key factor in FishCast (12% weight). Arrows rotate to true bearing. Speed shown as arrow length. Wind > 20kt triggers safety warning banner.                                                     |

---

### Layer 8: `current-overlay`

| Property              | Value                                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `current-overlay`                                                                                                                                                                                  |
| **Label**             | `layer.currentArrows`                                                                                                                                                                              |
| **Description**       | Ocean current direction and speed vectors                                                                                                                                                          |
| **Data Source**       | Copernicus Marine GLORYS / GlobCurrent                                                                                                                                                             |
| **API Endpoint**      | `https://nrt.cmems-du.eu/thredds/dodsC/cmems_mod_glo_phy_anfc_0.083deg_PT1H-m` (OPeNDAP)                                                                                                           |
| **Alt Source**        | NOAA OSCAR surface currents: `https://podaac-opendap.jpl.nasa.gov/opendap/allData/oscar/preview/L4/oscar_third_deg/`                                                                               |
| **Tile Type**         | GeoJSON (server-processed from NetCDF to vector arrows)                                                                                                                                            |
| **Update Frequency**  | 6-hourly (model runs)                                                                                                                                                                              |
| **Free Tier Limits**  | Copernicus free registration required; rate-limited to ~100 requests/hour                                                                                                                          |
| **Subscription Tier** | Pro                                                                                                                                                                                                |
| **CPU Cost**          | 2                                                                                                                                                                                                  |
| **Opacity**           | 0.7                                                                                                                                                                                                |
| **Z-Index**           | 31                                                                                                                                                                                                 |
| **Rendering**         | Directional arrows on grid. Arrow size proportional to speed. Color: Cyan (< 0.5 kt) → Blue (1 kt) → Purple (> 2 kt). Animated flow lines optional at zoom > 10.                                   |
| **Processing**        | Backend Lambda extracts viewport subset from NetCDF → returns GeoJSON FeatureCollection of Point features with `bearing` and `speed_kts` properties. 15-min cache per viewport tile.               |
| **Notes**             | Current breaks and eddies are prime fishing structure. Highlight convergence zones (opposing current arrows) with dashed circle overlay. Requires backend proxy due to CORS and NetCDF processing. |

---

### Layer 9: `tide-stations`

| Property                      | Value                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                        | `tide-stations`                                                                                                                                                                             |
| **Label**                     | `layer.tideStations`                                                                                                                                                                        |
| **Description**               | Tide station markers with real-time water level, predictions, and tide state                                                                                                                |
| **Data Source (Primary)**     | WorldTides API                                                                                                                                                                              |
| **API Endpoint**              | `https://www.worldtides.info/api/v3?heights&extremes&lat={lat}&lon={lon}&key={WORLDTIDES_KEY}`                                                                                              |
| **Data Source (US Fallback)** | NOAA CO-OPS Tides & Currents                                                                                                                                                                |
| **Fallback Endpoint**         | `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station={id}&product=predictions&datum=MLLW&units=metric&time_zone=lst_ldt&format=json`                                          |
| **Station List**              | `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions`                                                                                                |
| **Tile Type**                 | GeoJSON (point markers)                                                                                                                                                                     |
| **Update Frequency**          | Every 6 minutes (NOAA), hourly (WorldTides)                                                                                                                                                 |
| **Free Tier Limits**          | WorldTides: ~$100/mo budget (~10K requests); NOAA: unlimited (free)                                                                                                                         |
| **Subscription Tier**         | Free                                                                                                                                                                                        |
| **CPU Cost**                  | 1                                                                                                                                                                                           |
| **Opacity**                   | 1.0                                                                                                                                                                                         |
| **Z-Index**                   | 50                                                                                                                                                                                          |
| **Marker Style**              | Circle (20px) with tide arrow: ↑ rising (green), ↓ falling (red), — slack (yellow). Current height text label.                                                                              |
| **Popup Content**             | Station name, current height, high/low times today, 24h mini tide chart                                                                                                                     |
| **Notes**                     | Tap marker to see tide detail with SolunarTimeline. NOAA used as fallback for US stations to reduce WorldTides cost. Station data cached for 1 hour. Preload stations within 200km of user. |

---

### Layer 10: `catch-heatmap`

| Property              | Value                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| **ID**                | `catch-heatmap`                                                            |
| **Label**             | `layer.fishHotspots`                                                       |
| **Description**       | Aggregated community catch density heatmap from all ProFish users          |
| **Data Source**       | ProFish backend (Firestore aggregation → CloudFront GeoJSON)               |
| **API Endpoint**      | `https://api.profish.app/v1/catches/heatmap?bbox={w},{s},{e},{n}&zoom={z}` |
| **Tile Type**         | GeoJSON (point clusters) rendered as heatmap                               |
| **Update Frequency**  | Hourly aggregation (backend Lambda)                                        |
| **Free Tier Limits**  | N/A (own infrastructure)                                                   |
| **Subscription Tier** | Pro                                                                        |
| **CPU Cost**          | 2                                                                          |
| **Opacity**           | 0.6                                                                        |
| **Z-Index**           | 40                                                                         |
| **Heatmap Style**     |                                                                            |

```js
<MapboxGL.HeatmapLayer
  id="catch-heatmap"
  style={{
    heatmapRadius: [
      'interpolate',
      ['linear'],
      ['zoom'],
      6,
      15, // wide radius at low zoom
      12,
      25,
      16,
      40, // tight radius at high zoom
    ],
    heatmapWeight: ['get', 'weight'], // catch count per cell
    heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 6, 0.3, 12, 1],
    heatmapColor: [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0, 0, 255, 0)',
      0.2,
      'rgba(0, 128, 255, 0.4)',
      0.4,
      'rgba(0, 255, 128, 0.6)',
      0.6,
      'rgba(255, 255, 0, 0.7)',
      0.8,
      'rgba(255, 128, 0, 0.8)',
      1.0,
      'rgba(255, 0, 0, 0.9)',
    ],
    heatmapOpacity: 0.6,
  }}
/>
```

| **Privacy** | GPS coordinates fuzzed to ±200m grid cells. No individual user data exposed. |
| **Filters** | Species filter, date range (7d/30d/90d/1yr), time-of-day filter |
| **Notes** | Minimum 5 catches per grid cell to display (prevents single-user pins). Density weighted by recency (last 7 days = 3x weight). |

---

### Layer 11: `depth-contours`

| Property              | Value                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | `depth-contours`                                                                                                                             |
| **Label**             | `layer.depthContours`                                                                                                                        |
| **Description**       | Bathymetric depth contour lines at standard intervals                                                                                        |
| **Data Source**       | GEBCO bathymetry grid (processed to contour lines)                                                                                           |
| **Tile URL**          | Processed server-side from GEBCO NetCDF → MVT vector tiles served via CloudFront: `https://tiles.profish.app/depth-contours/{z}/{x}/{y}.pbf` |
| **Alt Source**        | EMODnet Bathymetry WMS: `https://ows.emodnet-bathymetry.eu/wms?service=WMS&request=GetMap&layers=emodnet:mean_atlas_land&styles=contours`    |
| **Tile Type**         | Vector (Mapbox Vector Tiles / PBF)                                                                                                           |
| **Update Frequency**  | Annually (matches GEBCO release cycle)                                                                                                       |
| **Free Tier Limits**  | Self-hosted tiles (one-time processing cost)                                                                                                 |
| **Subscription Tier** | Pro                                                                                                                                          |
| **CPU Cost**          | 2                                                                                                                                            |
| **Opacity**           | 0.8                                                                                                                                          |
| **Z-Index**           | 12                                                                                                                                           |
| **Contour Intervals** |                                                                                                                                              |

| Depth | Line Color | Width | Label                        |
| ----- | ---------- | ----- | ---------------------------- |
| 2m    | `#B3E5FC`  | 0.5px | —                            |
| 5m    | `#81D4FA`  | 0.8px | Every 5th                    |
| 10m   | `#4FC3F7`  | 1.0px | Yes                          |
| 20m   | `#29B6F6`  | 1.2px | Yes                          |
| 50m   | `#0288D1`  | 1.5px | Yes                          |
| 100m  | `#01579B`  | 2.0px | Yes                          |
| 200m  | `#002F6C`  | 2.5px | Yes (continental shelf edge) |
| 500m  | `#001A3D`  | 3.0px | Yes                          |

| **Label Style** | White text with dark halo, placed along contour line, `text-field: '{depth}m'` |
| **Notes** | Zoom-dependent visibility: 2m/5m contours appear at zoom ≥ 12, 10m/20m at zoom ≥ 9, 50m+ at all zoom levels. Essential for identifying drop-offs and structure. |

---

### Layer 12: `fish-activity-zones`

| Property              | Value                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **ID**                | `fish-activity-zones`                                                                         |
| **Label**             | `layer.fishActivityZones`                                                                     |
| **Description**       | AI-predicted fishing activity zones based on FishCast algorithm factors                       |
| **Data Source**       | ProFish backend — FishCast engine output                                                      |
| **API Endpoint**      | `https://api.profish.app/v1/fishcast/zones?bbox={w},{s},{e},{n}&species={species}&date={iso}` |
| **Tile Type**         | GeoJSON (polygons)                                                                            |
| **Update Frequency**  | Every 3 hours (recomputed with latest weather/tide data)                                      |
| **Free Tier Limits**  | N/A (own compute — Lambda)                                                                    |
| **Subscription Tier** | Pro                                                                                           |
| **CPU Cost**          | 2                                                                                             |
| **Opacity**           | 0.4                                                                                           |
| **Z-Index**           | 35                                                                                            |
| **Rendering**         | Fill polygons with score-based coloring:                                                      |

| FishCast Score     | Fill Color                | Border Color |
| ------------------ | ------------------------- | ------------ |
| 80–100 (Excellent) | `rgba(0, 255, 0, 0.25)`   | `#00FF00`    |
| 60–79 (Good)       | `rgba(255, 255, 0, 0.2)`  | `#FFFF00`    |
| 40–59 (Fair)       | `rgba(255, 165, 0, 0.15)` | `#FFA500`    |
| 20–39 (Poor)       | `rgba(255, 0, 0, 0.1)`    | `#FF0000`    |

| **Zone Size** | ~500m × 500m grid cells (H3 resolution 8) |
| **Factors** | Pressure (20%), Moon Phase (15%), Solunar (15%), Wind (12%), Time of Day (12%), Tide (10%), Cloud Cover (8%), Precipitation (8%) |
| **Notes** | Zones update dynamically with time-of-day slider. Species-specific zones available for Pro+. Tap zone to see factor breakdown (FactorBreakdown component). |

---

### Layer 13: `marine-protected-areas`

| Property              | Value                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **ID**                | `marine-protected-areas`                                                                                        |
| **Label**             | `layer.marineProtectedAreas`                                                                                    |
| **Description**       | No-take zones, marine reserves, and restricted fishing areas                                                    |
| **Data Source**       | ProtectedPlanet.net (WDPA — World Database on Protected Areas)                                                  |
| **API Endpoint**      | `https://api.protectedplanet.net/v3/protected_areas?marine=true&with_geometry=true&token={PROTECTEDPLANET_KEY}` |
| **Alt Source**        | Pre-processed GeoJSON tiles: `https://tiles.profish.app/mpa/{z}/{x}/{y}.pbf`                                    |
| **Tile Type**         | Vector (PBF) — pre-processed from WDPA shapefile                                                                |
| **Update Frequency**  | Monthly (WDPA updates monthly)                                                                                  |
| **Free Tier Limits**  | ProtectedPlanet API: free with registration; self-hosted tiles: unlimited                                       |
| **Subscription Tier** | Free                                                                                                            |
| **CPU Cost**          | 1                                                                                                               |
| **Opacity**           | 0.5                                                                                                             |
| **Z-Index**           | 55                                                                                                              |
| **Rendering**         |                                                                                                                 |

| Protection Level        | Fill Color                | Pattern        | Border              |
| ----------------------- | ------------------------- | -------------- | ------------------- |
| No-take (IUCN Ia/Ib)    | `rgba(255, 0, 0, 0.2)`    | Cross-hatch    | 2px red dashed      |
| Restricted (IUCN II–IV) | `rgba(255, 165, 0, 0.15)` | Diagonal lines | 1.5px orange dashed |
| Managed use (IUCN V–VI) | `rgba(255, 255, 0, 0.1)`  | None           | 1px yellow solid    |

| **Popup Content** | Area name, IUCN category, allowed activities, designation date, managing authority URL |
| **Notes** | Critical for legal compliance. Show warning toast when user enters restricted zone GPS boundary. Cross-reference with `fishing-regulations` layer. Always visible regardless of subscription when user is inside MPA bounds. |

---

### Layer 14: `boat-ramps`

| Property                   | Value                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                     | `boat-ramps`                                                                                                                       |
| **Label**                  | `layer.boatRamps`                                                                                                                  |
| **Description**            | Public boat launch and ramp locations                                                                                              |
| **Data Source**            | OpenStreetMap (Overpass API) + curated ProFish database                                                                            |
| **API Endpoint (OSM)**     | `https://overpass-api.de/api/interpreter?data=[out:json];node["leisure"="slipway"](bbox);out;`                                     |
| **API Endpoint (ProFish)** | `https://api.profish.app/v1/pois/boat-ramps?bbox={w},{s},{e},{n}`                                                                  |
| **Tile Type**              | GeoJSON (point markers)                                                                                                            |
| **Update Frequency**       | Weekly (OSM sync) + user-submitted additions                                                                                       |
| **Free Tier Limits**       | OSM Overpass: rate-limited (~10K/day); ProFish: own infra                                                                          |
| **Subscription Tier**      | Free                                                                                                                               |
| **CPU Cost**               | 1                                                                                                                                  |
| **Opacity**                | 1.0                                                                                                                                |
| **Z-Index**                | 52                                                                                                                                 |
| **Marker Style**           | Custom icon: boat ramp symbol (⛵ stylized), 24×24px, blue background circle                                                       |
| **Popup Content**          | Name, type (concrete/gravel/dirt), parking availability, fee, hours, user ratings, photos                                          |
| **Cluster**                | Clustered at zoom < 10, individual markers at zoom ≥ 10                                                                            |
| **Notes**                  | User-submitted ramps require moderation. Directions integration via deep link to Google Maps / Apple Maps. Min zoom to display: 7. |

---

### Layer 15: `fishing-regulations`

| Property              | Value                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| **ID**                | `fishing-regulations`                                                    |
| **Label**             | `layer.fishingRegulations`                                               |
| **Description**       | Regional regulation boundaries showing seasons, bag limits, size limits  |
| **Data Source**       | ProFish curated database (initially US/EU, expanding)                    |
| **API Endpoint**      | `https://api.profish.app/v1/regulations?bbox={w},{s},{e},{n}&date={iso}` |
| **Tile Type**         | GeoJSON (polygons)                                                       |
| **Update Frequency**  | As regulations change (monitored quarterly, emergency updates ASAP)      |
| **Free Tier Limits**  | N/A (own database)                                                       |
| **Subscription Tier** | Pro                                                                      |
| **CPU Cost**          | 2                                                                        |
| **Opacity**           | 0.3                                                                      |
| **Z-Index**           | 54                                                                       |
| **Rendering**         | Semi-transparent polygon boundaries with color-coded borders:            |

| Status               | Color              | Meaning                 |
| -------------------- | ------------------ | ----------------------- |
| Open season          | `#4CAF50` (green)  | All species open        |
| Partial season       | `#FFC107` (yellow) | Some species restricted |
| Closed season        | `#F44336` (red)    | No fishing allowed      |
| Catch & release only | `#2196F3` (blue)   | —                       |
| Special regulations  | `#9C27B0` (purple) | Read details            |

| **Popup Content** | Region name, applicable species with bag/size limits, season dates, license requirements, source URL |
| **Notes** | Initial coverage: US (state-by-state), EU (country-level), AU, NZ. Community-contributed regulation data reviewed by staff. Tap to see species-specific rules. Red banner if user's location is in closed area. |

---

### Layer 16: `weather-radar`

| Property               | Value                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                 | `weather-radar`                                                                                                                                                                                                                 |
| **Label**              | `layer.weather`                                                                                                                                                                                                                 |
| **Description**        | Real-time precipitation radar overlay                                                                                                                                                                                           |
| **Data Source**        | RainViewer API (free tier)                                                                                                                                                                                                      |
| **Tile URL**           | `https://tilecache.rainviewer.com/v2/radar/{timestamp}/256/{z}/{x}/{y}/2/1_1.png`                                                                                                                                               |
| **Timestamp Endpoint** | `https://api.rainviewer.com/public/weather-maps.json` → `radar.past[].path`                                                                                                                                                     |
| **Alt Source**         | OpenWeatherMap radar: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={OWM_KEY}`                                                                                                                   |
| **Tile Type**          | Raster (256×256 PNG, transparent)                                                                                                                                                                                               |
| **Update Frequency**   | Every 10 minutes (radar sweep)                                                                                                                                                                                                  |
| **Free Tier Limits**   | RainViewer: unlimited (free API); OWM: 1,000 calls/day free                                                                                                                                                                     |
| **Subscription Tier**  | Free                                                                                                                                                                                                                            |
| **CPU Cost**           | 1                                                                                                                                                                                                                               |
| **Opacity**            | 0.4                                                                                                                                                                                                                             |
| **Z-Index**            | 60                                                                                                                                                                                                                              |
| **Color Ramp**         | Standard radar: Green (light rain) → Yellow (moderate) → Red (heavy) → Purple (extreme)                                                                                                                                         |
| **Animation**          | Loop last 6 frames (60 minutes of radar history) with 500ms frame interval. Play/pause control.                                                                                                                                 |
| **Coverage**           | Global (RainViewer composites from national radar networks)                                                                                                                                                                     |
| **Notes**              | Auto-refresh tile URL every 10 minutes by re-fetching timestamp endpoint. Lightning strike overlay planned for Phase 2. Show "Rain approaching" notification if radar indicates precipitation moving toward user within 30 min. |

---

### Layer 17: `water-temp-gradient`

| Property              | Value                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID**                | `water-temp-gradient`                                                                                         |
| **Label**             | `layer.waterTempContours`                                                                                     |
| **Description**       | Temperature gradient visualization — highlights thermal boundaries where fish aggregate                       |
| **Data Source**       | JPL MUR SST (same as `sea-surface-temp`) + gradient computation                                               |
| **API Endpoint**      | `https://api.profish.app/v1/sst/gradients?bbox={w},{s},{e},{n}`                                               |
| **Processing**        | Backend computes Sobel gradient magnitude from SST grid → returns GeoJSON LineStrings where gradient ≥ 1°C/km |
| **Tile Type**         | GeoJSON (lines)                                                                                               |
| **Update Frequency**  | Daily                                                                                                         |
| **Free Tier Limits**  | N/A (computed from free SST data, served via own infra)                                                       |
| **Subscription Tier** | Pro                                                                                                           |
| **CPU Cost**          | 2                                                                                                             |
| **Opacity**           | 0.8                                                                                                           |
| **Z-Index**           | 22                                                                                                            |
| **Rendering**         | Lines colored by gradient strength:                                                                           |

| Gradient | Color              | Width                    |
| -------- | ------------------ | ------------------------ |
| 1–2°C/km | `#FFEB3B` (yellow) | 1.5px                    |
| 2–3°C/km | `#FF9800` (orange) | 2.5px                    |
| > 3°C/km | `#F44336` (red)    | 3.5px, pulsing animation |

| **Notes** | Temperature breaks are perhaps the single most important offshore fishing structure indicator. Strong gradients (> 3°C/km) trigger a "Hot Break Detected" push notification if user has alerts enabled. Best paired with `sea-surface-temp` and `chlorophyll` layers. |

---

### Layer 18: `species-distribution`

| Property              | Value                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **ID**                | `species-distribution`                                                                                          |
| **Label**             | `layer.speciesDistribution`                                                                                     |
| **Description**       | Known species habitat ranges — shows where target species are likely found                                      |
| **Data Source**       | AquaMaps (species distribution models) + FishBase                                                               |
| **API Endpoint**      | `https://api.profish.app/v1/species/{speciesId}/distribution` (pre-processed from AquaMaps 0.5° grid)           |
| **Alt Source**        | OBIS (Ocean Biodiversity Information System): `https://api.obis.org/v3/occurrence/grid/3?scientificname={name}` |
| **Tile Type**         | GeoJSON (polygon grid cells)                                                                                    |
| **Update Frequency**  | Quarterly (AquaMaps model updates)                                                                              |
| **Free Tier Limits**  | AquaMaps: free for non-commercial; OBIS: free                                                                   |
| **Subscription Tier** | Pro                                                                                                             |
| **CPU Cost**          | 2                                                                                                               |
| **Opacity**           | 0.35                                                                                                            |
| **Z-Index**           | 36                                                                                                              |
| **Rendering**         | Grid cells colored by habitat suitability probability:                                                          |

| Probability            | Color                    |
| ---------------------- | ------------------------ |
| 0.8–1.0 (core habitat) | `rgba(0, 200, 0, 0.3)`   |
| 0.5–0.8 (suitable)     | `rgba(255, 200, 0, 0.2)` |
| 0.2–0.5 (marginal)     | `rgba(255, 100, 0, 0.1)` |

| **Species Selector** | Dropdown in layer controls — filters by selected species from SpeciesPicker |
| **Notes** | Requires species selection to activate. Shows seasonal range shifts when season toggle is used. Data from AquaMaps half-degree cells, interpolated to smoother boundaries client-side. Links to SpeciesDetailScreen on tap. |

---

## 4. Layer Rendering Order (Z-Index)

Layers are rendered bottom-to-top. Higher Z-index renders on top.

| Z-Index | Layer                       | Type              | Notes                                          |
| ------- | --------------------------- | ----------------- | ---------------------------------------------- |
| 0       | `base-dark` / `satellite`   | Base style        | Mutually exclusive                             |
| 10      | `bathymetry`                | Raster            | Depth shading                                  |
| 11      | `nautical-charts`           | Raster            | Chart overlay                                  |
| 12      | `depth-contours`            | Vector lines      | Contour lines above bathymetry                 |
| 20      | `sea-surface-temp`          | Raster/WMS        | SST color ramp                                 |
| 21      | `chlorophyll`               | Raster/WMS        | Chlorophyll overlay                            |
| 22      | `water-temp-gradient`       | Vector lines      | Gradient break lines                           |
| 30      | `wind-overlay`              | Vector/animated   | Wind arrows                                    |
| 31      | `current-overlay`           | Vector/animated   | Current arrows                                 |
| 35      | `fish-activity-zones`       | Polygon fill      | AI zones                                       |
| 36      | `species-distribution`      | Polygon fill      | Habitat ranges                                 |
| 40      | `catch-heatmap`             | Heatmap           | Community density                              |
| 50      | `tide-stations`             | Point markers     | Tide data                                      |
| 52      | `boat-ramps`                | Point markers     | POI                                            |
| 54      | `fishing-regulations`       | Polygon border    | Regulation zones                               |
| 55      | `marine-protected-areas`    | Polygon border    | Protected areas (always on top of regulations) |
| 60      | `weather-radar`             | Raster (animated) | Precipitation                                  |
| 99      | User location puck          | System            | Always on top                                  |
| 100     | Catch markers (CircleLayer) | Vector points     | Always topmost data layer                      |

**Mapbox `belowLayerID` rule:** All raster/fill layers render below `catch-circles` layer ID to ensure catch markers are always tappable.

---

## 5. Subscription Tier Access Matrix

| Layer                    | Free | Pro ($59.99/yr) | Team ($149.99/yr) | Guide ($249.99/yr) |
| ------------------------ | ---- | --------------- | ----------------- | ------------------ |
| `base-dark`              | ✅   | ✅              | ✅                | ✅                 |
| `satellite`              | ✅   | ✅              | ✅                | ✅                 |
| `weather-radar`          | ✅   | ✅              | ✅                | ✅                 |
| `wind-overlay`           | ✅   | ✅              | ✅                | ✅                 |
| `tide-stations`          | ✅   | ✅              | ✅                | ✅                 |
| `marine-protected-areas` | ✅   | ✅              | ✅                | ✅                 |
| `boat-ramps`             | ✅   | ✅              | ✅                | ✅                 |
| `catch-markers` (own)    | ✅   | ✅              | ✅                | ✅                 |
| `bathymetry`             | 🔒   | ✅              | ✅                | ✅                 |
| `nautical-charts`        | 🔒   | ✅              | ✅                | ✅                 |
| `sea-surface-temp`       | 🔒   | ✅              | ✅                | ✅                 |
| `chlorophyll`            | 🔒   | ✅              | ✅                | ✅                 |
| `current-overlay`        | 🔒   | ✅              | ✅                | ✅                 |
| `depth-contours`         | 🔒   | ✅              | ✅                | ✅                 |
| `catch-heatmap`          | 🔒   | ✅              | ✅                | ✅                 |
| `fish-activity-zones`    | 🔒   | ✅              | ✅                | ✅                 |
| `water-temp-gradient`    | 🔒   | ✅              | ✅                | ✅                 |
| `fishing-regulations`    | 🔒   | ✅              | ✅                | ✅                 |
| `species-distribution`   | 🔒   | ✅              | ✅                | ✅                 |

### Simultaneous Active Layer Limits

| Tier  | Max Active Layers | Max Raster Layers | CPU Budget |
| ----- | ----------------- | ----------------- | ---------- |
| Free  | 3                 | 1                 | 3          |
| Pro   | 10                | 3                 | 10         |
| Team  | All               | 4                 | 14         |
| Guide | All               | 5                 | 18         |

**Free users** see locked layers in the Layer Picker with a "PRO" badge and blur effect. Tapping shows the PaywallModal.

---

## 6. CPU Budget System

The CPU budget system prevents performance degradation from too many active layers.

### Budget Rules

```
MAX_LAYER_BUDGET = 10 (adjustable per tier)

Layer CPU costs:
  Base layers (dark/satellite):  0  (free, always loaded)
  Lightweight overlays:          1  (weather, wind, tide, MPA, ramps, catch markers)
  Data-heavy overlays:           2  (bathy, SST, chlorophyll, charts, contours, heatmap, currents, zones, regs, gradient, species)
  Premium layers (Phase 2):      3  (C-MAP, etc.)
```

### Budget Calculation

```js
function calculateBudget(activeLayers) {
  return activeLayers.reduce((total, layerId) => {
    const layer = getLayerById(layerId);
    return total + (layer ? layer.cost : 0);
  }, 0);
}

function canActivateLayer(layerId, activeLayers) {
  const layer = getLayerById(layerId);
  if (!layer) return false;
  return calculateBudget(activeLayers) + layer.cost <= MAX_LAYER_BUDGET;
}
```

### Raster Layer Limit

Maximum 3 raster tile layers simultaneously to prevent GPU texture memory exhaustion:

```js
const MAX_RASTER_LAYERS = 3;

function canActivateRaster(layerId, activeLayers) {
  const layer = getLayerById(layerId);
  if (!layer || layer.type !== 'raster') return true; // non-raster always OK
  const activeRasterCount = activeLayers
    .map(getLayerById)
    .filter(l => l?.type === 'raster').length;
  return activeRasterCount < MAX_RASTER_LAYERS;
}
```

### Visual Budget Indicator

The LayerPicker displays a budget bar:

| Budget Used | Bar Color          | Message                            |
| ----------- | ------------------ | ---------------------------------- |
| 0–50%       | `#4CAF50` (green)  | —                                  |
| 51–80%      | `#FFC107` (yellow) | "Consider disabling unused layers" |
| 81–100%     | `#F44336` (red)    | "Layer budget nearly full"         |

When budget is full, remaining layer toggles are grayed out with tooltip "Disable a layer to enable this one".

---

## 7. Map Interactions

### 7.1 Tap Marker

| Behavior             | Detail                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Target**           | Catch markers, tide stations, boat ramps, any interactive feature                                                |
| **Detection**        | `ShapeSource.onPress` → `e.features[0]`                                                                          |
| **Response**         | Show detail popup/bottom sheet with feature data                                                                 |
| **Catch marker tap** | Species icon, weight, length, date, weather conditions at time of catch, "View Catch" button → CatchDetailScreen |
| **Tide station tap** | Station name, current water level, next high/low, 24h mini chart, "Full Forecast" button → TideDetailScreen      |
| **Boat ramp tap**    | Name, type, directions button, reviews, photos                                                                   |
| **Zone tap**         | FishCast score, factor breakdown, species predictions                                                            |
| **Hit area**         | 44×44pt minimum tap target (padded from visual marker size)                                                      |

### 7.2 Long-Press to Drop Pin

| Behavior           | Detail                                                  |
| ------------------ | ------------------------------------------------------- |
| **Gesture**        | Press and hold ≥ 500ms on map                           |
| **Haptic**         | Medium impact feedback on pin drop                      |
| **Pin Appearance** | Animated drop pin (bounces in), custom ProFish pin icon |
| **Context Menu**   | Bottom sheet with options:                              |

| Option               | Action                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| 📍 Save as Spot      | Save GPS to personal spots collection                                                                  |
| 🎣 Log Catch Here    | Pre-fill `LogCatchScreen` with coordinates                                                             |
| 📏 Measure From Here | Start distance measurement tool                                                                        |
| 🧭 Navigate Here     | Deep link to navigation app                                                                            |
| 📋 What's Here       | Show location info: coordinates, depth (if bathy loaded), nearest regulation zone, distance from shore |
| 🔗 Share Location    | Share GPS coordinates via system share sheet                                                           |

### 7.3 Pinch Zoom

| Behavior           | Detail                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Gesture**        | Two-finger pinch in/out                                                                                                    |
| **Range**          | Zoom 1 (world) to 18 (street-level)                                                                                        |
| **Double-tap**     | Zoom in +1 level centered on tap point                                                                                     |
| **Two-finger tap** | Zoom out –1 level                                                                                                          |
| **Speed**          | Deceleration easing for smooth feel                                                                                        |
| **Layer Response** | Layers show/hide based on zoom thresholds (see min/max zoom per layer). Clusters expand/collapse. Labels appear/disappear. |

### 7.4 Compass

| Behavior     | Detail                                                                               |
| ------------ | ------------------------------------------------------------------------------------ |
| **Display**  | Shows when map is rotated away from north                                            |
| **Tap**      | Resets bearing to 0° (north-up) with animation                                       |
| **Position** | Top-right, below weather card                                                        |
| **Style**    | `MapboxGL.MapView` `compassEnabled={true}`, custom compass image matching dark theme |

### 7.5 My-Location Button

| Behavior     | Detail                                               |
| ------------ | ---------------------------------------------------- |
| **Position** | Right control strip, below layers button             |
| **Icon**     | 📍 crosshair                                         |
| **Tap**      | Center camera on user GPS at zoom 13, duration 500ms |
| **State**    | Blue highlight when follow mode active               |

### 7.6 Follow Mode

| Behavior             | Detail                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| **Toggle**           | 🧭 compass button in control strip                                                |
| **Active**           | Camera continuously follows user location, zoom locked at 13                      |
| **Active + heading** | Double-tap follow button → camera follows and rotates to heading (course-up mode) |
| **Deactivate**       | Any manual pan gesture auto-disables follow mode. Button visually deactivates.    |
| **Implementation**   | `MapboxGL.Camera followUserLocation={followUser} followZoomLevel={13}`            |

### 7.7 Measure Distance Tool

| Behavior           | Detail                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Activation**     | Long-press menu → "Measure From Here", or toolbar button                                                       |
| **Mode**           | Tap successive points on map to create polyline                                                                |
| **Display**        | Dashed line between points with distance labels on each segment                                                |
| **Units**          | Nautical miles (offshore), km/mi (inshore), auto-detect by distance from shore                                 |
| **Total**          | Running total distance shown in top banner                                                                     |
| **Clear**          | "Clear Measurement" button in banner                                                                           |
| **Implementation** | Store point array in state, render with `MapboxGL.ShapeSource` + `LineLayer` (dashed) + `SymbolLayer` (labels) |

---

## 8. Search System

### 8.1 Location Search Bar

| Property     | Detail                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Position** | Top of map, collapsible (icon-only when collapsed)                                                      |
| **Provider** | Mapbox Geocoding API v6                                                                                 |
| **Endpoint** | `https://api.mapbox.com/search/geocode/v6/forward?q={query}&proximity={lon},{lat}&access_token={token}` |
| **Debounce** | 300ms after keystroke                                                                                   |
| **Results**  | 5 suggestions max, ordered by proximity to user                                                         |
| **Types**    | Places, addresses, POIs, water bodies, islands                                                          |
| **Select**   | Fly camera to result with `flyTo` animation, drop temporary pin                                         |
| **Recent**   | Last 10 searches stored in AsyncStorage                                                                 |
| **Offline**  | Shows "Search requires internet" message when offline                                                   |

### 8.2 Species Search

| Property         | Detail                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Access**       | Via search bar filter toggle or SpeciesPicker                                               |
| **Behavior**     | Type species name → show matching species from speciesDatabase                              |
| **Result**       | Activates `species-distribution` layer for selected species, centers map on nearest habitat |
| **Autocomplete** | Fuzzy match on common name (all 24 languages) and scientific name                           |

### 8.3 Spot Search

| Property         | Detail                                                 |
| ---------------- | ------------------------------------------------------ |
| **Access**       | Via search bar filter toggle or "My Spots" section     |
| **Behavior**     | Search saved personal fishing spots by name            |
| **Result**       | Fly to spot, show spot detail popup with catch history |
| **Shared spots** | Team/Guide tier: search team-shared spots              |

---

## 9. Markers & Clusters

### 9.1 Catch Markers

| Property             | Detail                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| **Source**           | `MapboxGL.ShapeSource` from catches GeoJSON FeatureCollection                      |
| **Visual**           | `CircleLayer`: 8px radius, `#FF6B00` fill, 2px white stroke                        |
| **Species icons**    | At zoom ≥ 12, replace circles with species-specific emoji/icon using `SymbolLayer` |
| **Released**         | Released catches show green ring instead of orange                                 |
| **Own vs community** | User's own catches: solid, community: semi-transparent (Pro+)                      |

### 9.2 Cluster Aggregation

| Property          | Detail                                       |
| ----------------- | -------------------------------------------- |
| **Engine**        | Mapbox GL native clustering on `ShapeSource` |
| **Configuration** |                                              |

```js
<MapboxGL.ShapeSource
  id="catches"
  shape={catchGeoJSON}
  cluster={true}
  clusterRadius={50}
  clusterMaxZoomLevel={14}
  clusterProperties={{
    sum: ['+', ['get', 'weight']],
    count: ['+', 1],
    species: ['concat', ['get', 'species'], ','],
  }}
>
  {/* Cluster circles */}
  <MapboxGL.CircleLayer
    id="catch-clusters"
    filter={['has', 'point_count']}
    style={{
      circleRadius: [
        'step',
        ['get', 'point_count'],
        18,
        10,
        24,
        50,
        32,
        100,
        40,
      ],
      circleColor: [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        10,
        '#f1f075',
        50,
        '#f28cb1',
      ],
      circleStrokeWidth: 2,
      circleStrokeColor: '#fff',
    }}
  />
  {/* Cluster count label */}
  <MapboxGL.SymbolLayer
    id="catch-cluster-count"
    filter={['has', 'point_count']}
    style={{
      textField: ['get', 'point_count_abbreviated'],
      textSize: 14,
      textColor: '#fff',
      textFont: ['DIN Pro Medium'],
    }}
  />
  {/* Individual markers */}
  <MapboxGL.CircleLayer
    id="catch-circles"
    filter={['!', ['has', 'point_count']]}
    style={{
      circleRadius: 8,
      circleColor: '#FF6B00',
      circleStrokeWidth: 2,
      circleStrokeColor: '#fff',
    }}
  />
</MapboxGL.ShapeSource>
```

### Cluster Behavior by Zoom

| Zoom Level | Behavior                                 |
| ---------- | ---------------------------------------- |
| 1–6        | Large region clusters (countries/states) |
| 7–9        | Sub-region clusters                      |
| 10–12      | Local clusters (lake/bay level)          |
| 13–14      | Small clusters (5+ catches within 50m)   |
| 15+        | Individual markers, no clustering        |

### 9.3 Marker Detail Popup

Implemented as a bottom sheet (not Mapbox popup) for better UX:

| Field             | Source                                                   |
| ----------------- | -------------------------------------------------------- |
| Species           | `feature.properties.species` → species icon + name       |
| Weight / Length   | `feature.properties.weight`, `feature.properties.length` |
| Date              | `feature.properties.catchDate`                           |
| Bait / Method     | `feature.properties.bait`, `feature.properties.method`   |
| Weather at catch  | Stored weather snapshot                                  |
| Photo thumbnail   | `feature.properties.photoUrl`                            |
| "View Full Catch" | Navigate to CatchDetailScreen                            |
| "Navigate Here"   | Deep link to Maps app                                    |

---

## 10. Offline Maps

### 10.1 Download Regions

| Property           | Detail                                                   |
| ------------------ | -------------------------------------------------------- |
| **Availability**   | Pro, Team, Guide tiers only                              |
| **Engine**         | `MapboxGL.offlineManager.createPack()`                   |
| **Selection**      | Draw rectangle on map, or select from predefined regions |
| **Zoom range**     | Min 6, Max 14 (configurable per download)                |
| **Style**          | Downloads active base style (Dark or Satellite)          |
| **Max packs**      | Pro: 5, Team: 15, Guide: 30                              |
| **Max total size** | Pro: 2 GB, Team: 5 GB, Guide: 10 GB                      |

### 10.2 Download Parameters

```js
await MapboxGL.offlineManager.createPack(
  {
    name: packId,
    styleURL: activeStyleURL,
    minZoom: 6,
    maxZoom: 14,
    bounds: [
      [sw.lng, sw.lat],
      [ne.lng, ne.lat],
    ],
  },
  onProgress,
  onError,
);
```

### 10.3 Estimated Tile Counts

| Area Size       | Zoom 6–14 Tiles | ~Download Size |
| --------------- | --------------- | -------------- |
| 10 km × 10 km   | ~5,500          | ~25 MB         |
| 50 km × 50 km   | ~22,000         | ~100 MB        |
| 100 km × 100 km | ~88,000         | ~400 MB        |
| 200 km × 200 km | ~350,000        | ~1.5 GB        |

### 10.4 Storage Management

| Feature             | Detail                                                  |
| ------------------- | ------------------------------------------------------- |
| **List packs**      | Settings → Offline Maps, shows name, size, date, status |
| **Delete pack**     | Swipe-to-delete or bulk delete                          |
| **Update pack**     | Re-download to get latest tiles (manual trigger)        |
| **Storage warning** | Alert when device storage < 500 MB                      |
| **Auto-cleanup**    | Expired packs auto-deleted after 90 days without use    |

### 10.5 Tile Expiry

| Tile Source                        | Expiry                   |
| ---------------------------------- | ------------------------ |
| Mapbox base tiles                  | 30 days (Mapbox default) |
| Raster overlays (SST, chlorophyll) | Not available offline    |
| Catch heatmap                      | Cached 24 hours          |
| Regulation boundaries              | Cached 7 days            |
| Species distribution               | Cached 30 days           |

### 10.6 Offline Data Layers

Beyond map tiles, these data layers cache locally:

| Data                    | Storage                  | Offline Duration              |
| ----------------------- | ------------------------ | ----------------------------- |
| User's catch history    | Firestore + AsyncStorage | Persistent                    |
| Tide predictions (NOAA) | AsyncStorage             | 7 days forward                |
| Weather forecast        | AsyncStorage             | 48 hours                      |
| Species database        | Bundled SQLite           | Persistent (updated with app) |
| Saved spots             | AsyncStorage             | Persistent                    |
| Regulation zones        | AsyncStorage             | 30 days                       |

---

## 11. Performance & Caching

### 11.1 Tile Caching Strategy

| Cache Level           | Implementation                              | Size                          | TTL                                 |
| --------------------- | ------------------------------------------- | ----------------------------- | ----------------------------------- |
| **L1: Memory**        | Mapbox GL internal texture cache            | ~100 MB                       | Session                             |
| **L2: Disk (Mapbox)** | Mapbox GL ambient cache                     | 50 MB default (set to 250 MB) | 30 days                             |
| **L3: Disk (App)**    | AsyncStorage / filesystem for API responses | ~50 MB                        | Per-source TTL                      |
| **L4: CDN**           | CloudFront edge cache for ProFish tiles     | —                             | 1 hour (dynamic), 24 hours (static) |

### Ambient Cache Configuration

```js
// Set Mapbox ambient cache size (call once at app init)
MapboxGL.offlineManager.setTileCountLimit(6000);
// Increase ambient cache
MapboxGL.setConnected(true);
```

### 11.2 Lazy Loading

| Rule                   | Detail                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **Viewport-only**      | WMS/ERDDAP requests use viewport bbox — no out-of-view fetching                               |
| **Zoom gating**        | Layers have `minZoom` — don't fetch tiles below threshold                                     |
| **Debounced fetch**    | API data layers (currents, zones) debounce 500ms after map idle                               |
| **Progressive detail** | Coarse grid at low zoom, fine grid at high zoom (e.g., currents: 1° grid at z6 → 0.1° at z12) |

### 11.3 Viewport-Only Rendering

```js
// On map region change, compute bbox for API calls
const onRegionDidChange = region => {
  const { geometry, properties } = region;
  const { visibleBounds } = properties;
  // visibleBounds = [[ne_lng, ne_lat], [sw_lng, sw_lat]]

  // Only fetch data layers for visible area
  fetchLayerData('fish-activity-zones', visibleBounds);
  fetchLayerData('current-overlay', visibleBounds);
  // etc.
};
```

### 11.4 API Response Caching

| Endpoint       | Cache Key                            | TTL        | Stale-While-Revalidate |
| -------------- | ------------------------------------ | ---------- | ---------------------- |
| SST tiles      | `sst:{z}:{x}:{y}:{date}`             | 24 hours   | Yes                    |
| Chlorophyll    | `chl:{z}:{x}:{y}:{date}`             | 24 hours   | Yes                    |
| Catch heatmap  | `heatmap:{bbox_hash}:{zoom}`         | 1 hour     | Yes                    |
| FishCast zones | `fishcast:{bbox_hash}:{date}:{hour}` | 3 hours    | No                     |
| Tide stations  | `tides:{station_id}:{date}`          | 1 hour     | Yes                    |
| Current arrows | `currents:{bbox_hash}:{timestamp}`   | 6 hours    | Yes                    |
| Regulations    | `regs:{bbox_hash}`                   | 7 days     | Yes                    |
| Boat ramps     | `ramps:{bbox_hash}`                  | 30 days    | Yes                    |
| MPA boundaries | `mpa:{z}:{x}:{y}`                    | 30 days    | Yes                    |
| Species dist.  | `species:{id}:{bbox_hash}`           | 30 days    | Yes                    |
| Weather radar  | `radar:{timestamp}:{z}:{x}:{y}`      | 10 minutes | No                     |
| Wind data      | `wind:{bbox_hash}:{hour}`            | 1 hour     | Yes                    |
| Depth contours | `depth:{z}:{x}:{y}`                  | 90 days    | Yes                    |

### 11.5 Memory Budget

| Resource                  | Limit           | Action When Exceeded               |
| ------------------------- | --------------- | ---------------------------------- |
| Raster textures (GPU)     | 3 layers max    | Disable oldest raster layer        |
| GeoJSON features (RAM)    | 50,000 features | Increase clustering, reduce detail |
| API response cache (disk) | 250 MB          | LRU eviction                       |
| Offline packs (disk)      | Per-tier limit  | Block new downloads                |

---

## 12. Layer Picker UI

### 12.1 Layout

| Property      | Detail                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| **Trigger**   | 🗂️ button in map controls (top-right)                                        |
| **Component** | `LayerPicker.js` — Modal slide-up bottom sheet                               |
| **Animation** | `animationType="slide"`, transparent overlay with `rgba(0,0,0,0.5)` backdrop |
| **Close**     | ✕ button, swipe down, or tap backdrop                                        |

### 12.2 Header

```
┌─────────────────────────────────────┐
│  ────  (drag handle)                │
│  🗺️ Map Layers                  ✕  │
│  ┌─────────────────────────────┐    │
│  │ Layer Budget    7/10        │    │
│  │ ████████████░░░░░           │    │
│  └─────────────────────────────┘    │
│  [Grid View] [List View]           │
└─────────────────────────────────────┘
```

### 12.3 Grid/List Toggle

| Mode     | Layout          | Detail                                                               |
| -------- | --------------- | -------------------------------------------------------------------- |
| **Grid** | 3-column grid   | Layer preview thumbnail (128×128), name, toggle. Default view.       |
| **List** | Full-width rows | Preview, name, description, source, tier badge, toggle. Detail view. |

Toggle state persisted in AsyncStorage.

### 12.4 Layer Card (Grid Mode)

```
┌────────────────┐
│ [Preview Image]│  ← 128×128 thumbnail of layer appearance
│                │
│ Bathymetry     │
│ ⬡ Cost: 2  PRO│  ← tier badge if locked
│ [  Toggle  🔘] │
└────────────────┘
```

### 12.5 Subscription Gate Visual

| User Tier          | Layer Tier | Visual                                                                                      |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| Matches or exceeds | —          | Normal card, functional toggle                                                              |
| Below required     | —          | Card has blur overlay (opacity 0.4), "PRO" / "TEAM" badge in corner, tap shows PaywallModal |

```js
{
  !isAvailable && (
    <View style={styles.lockOverlay}>
      <Text style={styles.lockBadge}>PRO</Text>
      <Text style={styles.lockIcon}>🔒</Text>
    </View>
  );
}
```

### 12.6 Layer Previews

Static thumbnail images for each layer, bundled in app assets:

| Layer                    | Preview                                         |
| ------------------------ | ----------------------------------------------- |
| `bathymetry`             | Blue-shaded ocean depth near a coastline        |
| `nautical-charts`        | NOAA chart snippet with buoys and depth numbers |
| `sea-surface-temp`       | Rainbow SST map of Gulf Stream                  |
| `chlorophyll`            | Green bloom near upwelling zone                 |
| `wind-overlay`           | White arrows over ocean                         |
| `current-overlay`        | Blue/purple current arrows                      |
| `tide-stations`          | Cluster of tide markers on coast                |
| `catch-heatmap`          | Red-yellow heat spots near jetty                |
| `depth-contours`         | Blue contour lines near reef                    |
| `fish-activity-zones`    | Green/yellow AI zones                           |
| `marine-protected-areas` | Red hatched boundary                            |
| `boat-ramps`             | Boat icons near marina                          |
| `fishing-regulations`    | Colored regulation boundaries                   |
| `weather-radar`          | Green/yellow radar sweep                        |
| `water-temp-gradient`    | Orange gradient lines                           |
| `species-distribution`   | Green habitat shading                           |

Preview images stored at: `src/assets/layer-previews/{layer-id}.png`

### 12.7 Layer Categories

Layers grouped in the picker:

| Category                 | Layers                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Base Maps**            | `base-dark`, `satellite`                                                                                    |
| **Ocean Data**           | `bathymetry`, `depth-contours`, `nautical-charts`, `sea-surface-temp`, `chlorophyll`, `water-temp-gradient` |
| **Weather & Conditions** | `weather-radar`, `wind-overlay`, `current-overlay`, `tide-stations`                                         |
| **Fishing Intelligence** | `catch-heatmap`, `fish-activity-zones`, `species-distribution`                                              |
| **Safety & Regulations** | `marine-protected-areas`, `fishing-regulations`                                                             |
| **Points of Interest**   | `boat-ramps`                                                                                                |

---

## 13. Battery & Resource Management

### 13.1 Battery-Aware Layer Management

```js
import { useBatteryLevel } from 'react-native-device-info';

const BATTERY_THRESHOLDS = {
  CRITICAL: 0.1, // 10% — disable all overlays, keep base only
  LOW: 0.2, // 20% — disable raster layers, keep lightweight
  MEDIUM: 0.4, // 40% — disable animations (wind, current particles)
};

function getMaxLayersForBattery(batteryLevel, isCharging) {
  if (isCharging) return MAX_LAYER_BUDGET; // full budget when charging
  if (batteryLevel < BATTERY_THRESHOLDS.CRITICAL) return 0;
  if (batteryLevel < BATTERY_THRESHOLDS.LOW) return 3;
  if (batteryLevel < BATTERY_THRESHOLDS.MEDIUM) return 6;
  return MAX_LAYER_BUDGET;
}
```

### 13.2 Auto-Disable Rules

| Battery Level | Action                                                             | User Notification                           |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| < 10%         | Disable all overlay layers, base map only                          | Toast: "Low battery — overlays disabled"    |
| < 20%         | Disable all raster layers (bathy, charts, SST, chlorophyll, radar) | Toast: "Low battery — raster layers paused" |
| < 40%         | Disable animated layers (wind particles, current flow)             | Silent (animations stop)                    |
| Charging      | Full budget restored                                               | —                                           |

### 13.3 GPS Polling Rate

| Battery Level | GPS Interval                | Distance Filter |
| ------------- | --------------------------- | --------------- |
| > 40%         | 10 seconds                  | 20m             |
| 20–40%        | 30 seconds                  | 50m             |
| 10–20%        | 60 seconds                  | 100m            |
| < 10%         | GPS paused (manual refresh) | —               |

### 13.4 Network-Aware Behavior

| Connection | Behavior                                       |
| ---------- | ---------------------------------------------- |
| WiFi       | Full resolution tiles, prefetch adjacent tiles |
| 4G/5G      | Standard resolution, no prefetch               |
| 3G         | Reduced tile quality, disable auto-refresh     |
| Offline    | Cached/offline tiles only, show offline banner |

---

## 14. Error Handling & Fallbacks

### 14.1 Layer Load Failures

| Scenario                    | Fallback                                                      | UI                               |
| --------------------------- | ------------------------------------------------------------- | -------------------------------- |
| Tile server timeout (> 10s) | Show cached tile if available, else transparent               | Small ⚠️ icon on layer toggle    |
| ERDDAP/WMS unavailable      | Switch to alternate source (see Alt Source per layer)         | "Using backup data source" toast |
| No data for viewport        | Show "No data available for this area" overlay text           | Subtle watermark text            |
| Rate limit exceeded         | Queue requests, exponential backoff (1s, 2s, 4s, 8s, max 60s) | —                                |
| Invalid tile response       | Skip tile, log to Sentry                                      | —                                |

### 14.2 Map Engine Fallbacks

| Scenario              | Behavior                                                        |
| --------------------- | --------------------------------------------------------------- |
| Mapbox token missing  | Show placeholder screen with setup instructions (current impl)  |
| Mapbox SDK crash      | Catch in error boundary, offer "Reload Map" button              |
| GPS permission denied | Map loads centered on last known location or Stockholm fallback |
| GPS accuracy > 100m   | Show accuracy circle, amber warning on location puck            |

### 14.3 Data Freshness Indicators

Each data layer shows a freshness badge in the layer picker:

| Indicator | Meaning             | Visual     |
| --------- | ------------------- | ---------- |
| 🟢        | Data < 1 hour old   | Green dot  |
| 🟡        | Data 1–24 hours old | Yellow dot |
| 🔴        | Data > 24 hours old | Red dot    |
| ⚫        | No data / offline   | Gray dot   |

---

## Appendix A: API Key Requirements

| Service                | Key Required | Env Variable                          | Free Tier           |
| ---------------------- | ------------ | ------------------------------------- | ------------------- |
| Mapbox                 | Yes          | `MAPBOX_ACCESS_TOKEN`                 | 25,000 MAU          |
| WorldTides             | Yes          | `WORLDTIDES_API_KEY`                  | ~$100/mo            |
| ProtectedPlanet        | Yes          | `PROTECTEDPLANET_API_KEY`             | Free (registration) |
| Copernicus Marine      | Yes          | `COPERNICUS_USER` / `COPERNICUS_PASS` | Free (registration) |
| RainViewer             | No           | —                                     | Free (public API)   |
| Open-Meteo             | No           | —                                     | 10,000/day          |
| NOAA ERDDAP            | No           | —                                     | Unlimited           |
| NOAA CO-OPS            | No           | —                                     | Unlimited           |
| GEBCO/ESRI tiles       | No           | —                                     | Unlimited           |
| OpenStreetMap Overpass | No           | —                                     | Rate-limited        |

## Appendix B: Layer Registry Update Checklist

When adding a new layer:

1. Add entry to `LAYERS` in `src/config/layerRegistry.js`
2. Add layer ID, tile URL, type, cost, tier, opacity, z-index
3. Add i18n key to all 24 locale files
4. Add preview thumbnail to `src/assets/layer-previews/`
5. Add to category group in `LayerPicker.js`
6. Add cache TTL entry to caching config
7. Add to subscription matrix (update RevenueCat entitlements if needed)
8. Add to offline data strategy (if applicable)
9. Test CPU budget impact — ensure budget math still works
10. Test on low-end Android device (Snapdragon 665 baseline)
11. Update this spec document

## Appendix C: Coordinate Reference Systems

| Usage            | CRS                      | Notes                  |
| ---------------- | ------------------------ | ---------------------- |
| Map display      | EPSG:3857 (Web Mercator) | Mapbox GL native       |
| GPS coordinates  | EPSG:4326 (WGS 84)       | All stored coordinates |
| Tile requests    | EPSG:3857                | ZXY scheme             |
| ERDDAP queries   | EPSG:4326                | Lat/lon bbox           |
| GeoJSON features | EPSG:4326                | RFC 7946               |

---

_Document version 1.0 — ProFish Map Features Specification_  
_Aligned with ProFish Master Plan v3.1 and layerRegistry.js_
