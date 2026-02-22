/**
 * Tile Proxy Service — ProFish (#129)
 *
 * Self-hosted tile proxy CDN configuration for Copernicus marine layers.
 * Proxies tile requests through our own CDN to:
 *   1. Cache tiles at the edge (lower latency)
 *   2. Apply API key server-side (no key exposure in client)
 *   3. Transform formats (convert NetCDF → PNG tiles on server)
 *   4. Apply rate limiting per user/tier
 *   5. Serve pre-rendered mbtiles for offline packs
 *
 * In production, this maps to a CloudFront → Lambda@Edge → Copernicus pipeline.
 * For development, tiles are proxied directly with client-side caching.
 */

const TILE_PROXY_BASE = 'https://tiles.profish.app/v1'; // Production CDN
const COPERNICUS_BASE = 'https://wmts.marine.copernicus.eu/teroWmts';
const DEV_MODE = __DEV__ || false;

// ── Tile layer definitions ──────────────────────────────

export const TILE_LAYERS = {
  SST: {
    id: 'sst',
    name: 'Sea Surface Temperature',
    source: 'copernicus',
    product: 'GLOBAL_ANALYSISFORECAST_PHY_001_024',
    variable: 'thetao',
    format: 'png',
    minZoom: 2,
    maxZoom: 10,
    opacity: 0.6,
  },
  CHLOROPHYLL: {
    id: 'chlorophyll',
    name: 'Chlorophyll Concentration',
    source: 'copernicus',
    product: 'GLOBAL_ANALYSISFORECAST_BGC_001_028',
    variable: 'chl',
    format: 'png',
    minZoom: 2,
    maxZoom: 10,
    opacity: 0.5,
  },
  BATHYMETRY: {
    id: 'bathymetry',
    name: 'Bathymetry / Depth',
    source: 'gebco',
    format: 'png',
    minZoom: 2,
    maxZoom: 12,
    opacity: 0.7,
  },
  CURRENTS: {
    id: 'currents',
    name: 'Ocean Currents',
    source: 'copernicus',
    product: 'GLOBAL_ANALYSISFORECAST_PHY_001_024',
    variable: 'uo,vo',
    format: 'png',
    minZoom: 2,
    maxZoom: 10,
    opacity: 0.5,
  },
  WAVE_HEIGHT: {
    id: 'wave_height',
    name: 'Wave Height',
    source: 'copernicus',
    product: 'GLOBAL_ANALYSISFORECAST_WAV_001_027',
    variable: 'VHM0',
    format: 'png',
    minZoom: 2,
    maxZoom: 10,
    opacity: 0.5,
  },
};

// ── Service ─────────────────────────────────────────────

const tileProxyService = {
  /**
   * Get tile URL for a layer at specific coordinates
   * In production: CDN URL; In dev: direct source URL
   */
  getTileUrl(layerId, z, x, y) {
    const layer = TILE_LAYERS[layerId.toUpperCase()] || TILE_LAYERS.SST;

    if (DEV_MODE) {
      return this._getDirectUrl(layer, z, x, y);
    }

    return `${TILE_PROXY_BASE}/${layer.id}/{z}/{x}/{y}.${layer.format}`;
  },

  /**
   * Get tile source config for Mapbox GL layer integration
   */
  getTileSource(layerId) {
    const layer = TILE_LAYERS[layerId.toUpperCase()] || TILE_LAYERS.SST;
    const base = DEV_MODE
      ? this._getDirectBaseUrl(layer)
      : `${TILE_PROXY_BASE}/${layer.id}`;

    return {
      type: 'raster',
      tiles: [`${base}/{z}/{x}/{y}.${layer.format}`],
      tileSize: 256,
      minzoom: layer.minZoom,
      maxzoom: layer.maxZoom,
      attribution:
        layer.source === 'copernicus'
          ? '© Copernicus Marine Service'
          : layer.source === 'gebco'
          ? '© GEBCO'
          : '',
    };
  },

  /**
   * Get all available tile layers
   */
  getLayers() {
    return Object.values(TILE_LAYERS);
  },

  /**
   * Check if CDN is healthy
   */
  async healthCheck() {
    try {
      const response = await fetch(`${TILE_PROXY_BASE}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get CDN configuration for server deployment
   * (Used by deployment scripts, not client-side)
   */
  getCdnConfig() {
    return {
      provider: 'cloudfront',
      origin: COPERNICUS_BASE,
      cacheBehavior: {
        defaultTTL: 3600, // 1 hour
        maxTTL: 86400, // 24 hours
        compress: true,
        queryStringCaching: 'all',
      },
      lambdaEdge: {
        viewerRequest: 'inject-api-key',
        originRequest: 'transform-tile-format',
      },
      cachePolicy: {
        headersCacheKeys: ['Accept-Encoding'],
        queryStringCacheKeys: ['product', 'variable', 'time'],
      },
      geoRestriction: 'none',
      priceClass: 'PriceClass_100', // NA + EU only initially
    };
  },

  // ── Internal ──────────────────────────────────────────

  _getDirectUrl(layer, z, x, y) {
    if (layer.source === 'gebco') {
      return `https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_basemap_NCEI/MapServer/tile/${z}/${y}/${x}`;
    }
    // Copernicus WMTS direct URL (requires server-side key in production)
    return `${COPERNICUS_BASE}?service=WMTS&request=GetTile&version=1.0.0&layer=${layer.product}&style=default&format=image/png&tileMatrixSet=EPSG:3857&tileMatrix=${z}&tileRow=${y}&tileCol=${x}`;
  },

  _getDirectBaseUrl(layer) {
    if (layer.source === 'gebco') {
      return 'https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_basemap_NCEI/MapServer/tile';
    }
    return TILE_PROXY_BASE + '/' + layer.id;
  },
};

export default tileProxyService;
