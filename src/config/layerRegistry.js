/**
 * layerRegistry — ProFish map layers with CPU budget system
 *
 * Ported from ProHunt's layer budget system.
 * Each layer has a CPU cost; total active layers cannot exceed MAX_LAYER_BUDGET.
 *
 * Fishing-specific layers:
 *   - Bathymetry (GEBCO free)
 *   - Sea Surface Temperature (Copernicus/Sentinel free)
 *   - Chlorophyll-a concentration (Copernicus free)
 *   - Tide stations
 *   - Nautical charts (NOAA free for US)
 *   - Fish hotspots (user-generated heatmap)
 *   - Weather overlay
 *   - Current/wind arrows
 *   - Solunar overlay
 *   - Catch markers
 */

const MAX_LAYER_BUDGET = 10;

const LAYERS = {
  // ── Base layers (always available) ─────────────────
  SATELLITE: {
    id: 'satellite',
    label: 'layer.satellite',
    cost: 0,
    tier: 'free',
    source: 'mapbox',
    default: true,
  },
  TERRAIN: {
    id: 'terrain',
    label: 'layer.terrain',
    cost: 0,
    tier: 'free',
    source: 'mapbox',
    default: false,
  },

  // ── Free fishing layers ────────────────────────────
  WEATHER: {
    id: 'weather',
    label: 'layer.weather',
    cost: 1,
    tier: 'free',
    source: 'open-meteo',
    default: true,
    tileUrl:
      'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=',
    type: 'raster',
    opacity: 0.4,
  },
  WIND_ARROWS: {
    id: 'wind_arrows',
    label: 'layer.windArrows',
    cost: 1,
    tier: 'free',
    source: 'open-meteo',
    default: false,
  },
  SOLUNAR: {
    id: 'solunar',
    label: 'layer.solunar',
    cost: 1,
    tier: 'free',
    source: 'calculated',
    default: false,
  },
  CATCH_MARKERS: {
    id: 'catch_markers',
    label: 'layer.catchMarkers',
    cost: 1,
    tier: 'free',
    source: 'user-data',
    default: true,
  },
  TIDE_STATIONS: {
    id: 'tide_stations',
    label: 'layer.tideStations',
    cost: 1,
    tier: 'free',
    source: 'worldtides',
    default: false,
  },

  // ── Pro layers ─────────────────────────────────────
  BATHYMETRY: {
    id: 'bathymetry',
    label: 'layer.bathymetry',
    cost: 2,
    tier: 'pro',
    source: 'gebco',
    default: false,
    tileUrl:
      'https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_basemap_NCEI/MapServer/tile/{z}/{y}/{x}',
    type: 'raster',
    opacity: 0.7,
  },
  SST: {
    id: 'sea_surface_temp',
    label: 'layer.sst',
    cost: 2,
    tier: 'pro',
    source: 'copernicus',
    default: false,
    tileUrl:
      'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.transparentPng?analysed_sst%5B(last)%5D%5B({south}):({north})%5D%5B({west}):({east})%5D&.draw=surface&.vars=longitude%7Clatitude%7Canalysed_sst',
    type: 'wms',
    opacity: 0.6,
  },
  CHLOROPHYLL: {
    id: 'chlorophyll',
    label: 'layer.chlorophyll',
    cost: 2,
    tier: 'pro',
    source: 'copernicus',
    default: false,
    tileUrl:
      'https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdMH1chla1day.transparentPng',
    type: 'wms',
    opacity: 0.5,
  },
  NAUTICAL_CHARTS: {
    id: 'nautical_charts',
    label: 'layer.nauticalCharts',
    cost: 2,
    tier: 'pro',
    source: 'noaa',
    default: false,
    tileUrl:
      'https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png',
    type: 'raster',
    opacity: 0.7,
  },
  FISH_HOTSPOTS: {
    id: 'fish_hotspots',
    label: 'layer.fishHotspots',
    cost: 2,
    tier: 'pro',
    source: 'aggregated-catches',
    default: false,
  },
  CURRENT_ARROWS: {
    id: 'current_arrows',
    label: 'layer.currentArrows',
    cost: 2,
    tier: 'pro',
    source: 'copernicus',
    default: false,
  },
  WATER_TEMP_CONTOURS: {
    id: 'water_temp_contours',
    label: 'layer.waterTempContours',
    cost: 2,
    tier: 'pro',
    source: 'copernicus',
    default: false,
  },
  DEPTH_CONTOURS: {
    id: 'depth_contours',
    label: 'layer.depthContours',
    cost: 2,
    tier: 'pro',
    source: 'gebco',
    default: false,
  },

  // ── Phase 2 layers (not yet active) ────────────────
  MARINE_PROTECTED_AREAS: {
    id: 'marine_protected_areas',
    label: 'layer.marineProtectedAreas',
    cost: 2,
    tier: 'pro',
    source: 'wdpa',
    default: false,
    tileUrl:
      'https://data-gis.unep-wcmc.org/server/rest/services/ProtectedSites/The_World_Database_of_Protected_Areas/MapServer/tile/{z}/{y}/{x}',
    type: 'raster',
    opacity: 0.4,
  },
  BOAT_RAMPS: {
    id: 'boat_ramps',
    label: 'layer.boatRamps',
    cost: 1,
    tier: 'free',
    source: 'osm',
    default: false,
  },
  FISHING_REGULATIONS: {
    id: 'fishing_regulations',
    label: 'layer.fishingRegulations',
    cost: 2,
    tier: 'pro',
    source: 'custom',
    default: false,
  },
  CMAP_CHARTS: {
    id: 'cmap_charts',
    label: 'layer.cmapCharts',
    cost: 3,
    tier: 'pro',
    source: 'cmap',
    phase: 2,
    default: false,
  },
};

/**
 * Get a layer config by its ID
 */
function getLayerById(layerId) {
  return Object.values(LAYERS).find(l => l.id === layerId) || null;
}

/**
 * Get all raster tile layers that are currently active and have tile URLs
 */
function getActiveTileLayers(activeLayers) {
  return activeLayers
    .map(id => getLayerById(id))
    .filter(l => l && l.tileUrl && l.type === 'raster');
}

/**
 * Calculate total CPU cost of active layers
 */
function calculateBudget(activeLayers) {
  return activeLayers.reduce((total, layerId) => {
    const layer = Object.values(LAYERS).find(l => l.id === layerId);
    return total + (layer ? layer.cost : 0);
  }, 0);
}

/**
 * Check if a layer can be activated within budget
 */
function canActivateLayer(layerId, activeLayers) {
  const layer = Object.values(LAYERS).find(l => l.id === layerId);
  if (!layer) return false;
  const currentBudget = calculateBudget(activeLayers);
  return currentBudget + layer.cost <= MAX_LAYER_BUDGET;
}

/**
 * Get all layers available for a given subscription tier
 */
function getAvailableLayers(tier = 'free', phase = 1) {
  const tierOrder = { free: 0, pro: 1, team: 2, guide: 3 };
  const userTierLevel = tierOrder[tier] || 0;

  return Object.values(LAYERS).filter(layer => {
    const layerTierLevel = tierOrder[layer.tier] || 0;
    const phaseOk = !layer.phase || layer.phase <= phase;
    return layerTierLevel <= userTierLevel && phaseOk;
  });
}

/**
 * Get default active layers for a tier
 */
function getDefaultLayers(tier = 'free') {
  return getAvailableLayers(tier)
    .filter(l => l.default)
    .map(l => l.id);
}

export {
  LAYERS,
  MAX_LAYER_BUDGET,
  calculateBudget,
  canActivateLayer,
  getAvailableLayers,
  getDefaultLayers,
  getLayerById,
  getActiveTileLayers,
};

export default LAYERS;
