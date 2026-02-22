/**
 * Public Fishing Spots Service — Free databases integration
 * #518-523 — USGS boat ramps, OSM fishing POIs, stocking reports,
 * pre-populated spots, piers/jetties, dams/reservoirs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@profish_public_spots';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * #518 — USGS / NOAA Public Boat Ramp Dataset (US)
 * Source: OpenStreetMap Overpass API (free, no key required)
 * Query: leisure=slipway OR leisure=marina nodes within bounding box
 *
 * NOTE: We use Overpass API (free) instead of paid APIs.
 * Rate limit: 2 requests per second, results cached 7 days.
 */
export async function fetchBoatRamps(lat, lng, radiusKm = 50) {
  const bbox = getBBox(lat, lng, radiusKm);
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"="slipway"](${bbox});
      node["leisure"="marina"](${bbox});
      way["leisure"="slipway"](${bbox});
      way["leisure"="marina"](${bbox});
      node["seamark:type"="harbour"](${bbox});
    );
    out center body;
  `.trim();

  return overpassQuery(query, `ramps_${lat.toFixed(2)}_${lng.toFixed(2)}`);
}

/**
 * #519 — OpenStreetMap Fishing POIs (worldwide)
 * Tags: leisure=fishing, sport=fishing, shop=fishing
 * Free, no API key needed.
 */
export async function fetchFishingPOIs(lat, lng, radiusKm = 50) {
  const bbox = getBBox(lat, lng, radiusKm);
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"="fishing"](${bbox});
      node["sport"="fishing"](${bbox});
      node["shop"="fishing"](${bbox});
      way["leisure"="fishing"](${bbox});
      relation["leisure"="fishing"](${bbox});
    );
    out center body;
  `.trim();

  return overpassQuery(query, `fishing_${lat.toFixed(2)}_${lng.toFixed(2)}`);
}

/**
 * #522 — Fishing piers and jetties from OSM
 */
export async function fetchPiersJetties(lat, lng, radiusKm = 50) {
  const bbox = getBBox(lat, lng, radiusKm);
  const query = `
    [out:json][timeout:25];
    (
      way["man_made"="pier"](${bbox});
      way["man_made"="jetty"](${bbox});
      node["man_made"="pier"](${bbox});
      node["leisure"="fishing"]["man_made"="pier"](${bbox});
    );
    out center body;
  `.trim();

  return overpassQuery(query, `piers_${lat.toFixed(2)}_${lng.toFixed(2)}`);
}

/**
 * #523 — Dams and reservoirs from OSM
 */
export async function fetchDamsReservoirs(lat, lng, radiusKm = 100) {
  const bbox = getBBox(lat, lng, radiusKm);
  const query = `
    [out:json][timeout:30];
    (
      way["water"="reservoir"](${bbox});
      way["waterway"="dam"](${bbox});
      node["waterway"="dam"](${bbox});
      relation["water"="reservoir"](${bbox});
    );
    out center body;
  `.trim();

  return overpassQuery(query, `dams_${lat.toFixed(2)}_${lng.toFixed(2)}`);
}

/**
 * #520 — Fish stocking reports (US)
 * Most states publish stocking data. We aggregate common formats.
 * This provides a config for known state stocking report URLs.
 */
export const STOCKING_REPORT_SOURCES = {
  // State → data URL for stocking reports (public, free)
  US: {
    CA: 'https://nrm.dfg.ca.gov/fishplant/',
    CO: 'https://cpw.state.co.us/thingstodo/Pages/FishStocking.aspx',
    FL: 'https://myfwc.com/fishing/freshwater/sites-forecasts/stocking-schedule/',
    GA: 'https://georgiawildlife.com/fishing/trout-stocking',
    MI: 'https://www.michigan.gov/dnr/managing-resources/fisheries/stocking',
    MN: 'https://www.dnr.state.mn.us/fishing/stocking/index.html',
    NC: 'https://www.ncwildlife.org/Fishing/Trout-Fishing/Trout-Stocking-Schedule',
    NY: 'https://www.dec.ny.gov/outdoor/7739.html',
    OR: 'https://myodfw.com/fishing/trout-stocking-schedule',
    PA: 'https://www.fishandboat.com/Fish/Stocking/Pages/TroutStockingDetails.aspx',
    TX: 'https://tpwd.texas.gov/fishboat/fish/management/stocking/',
    WA: 'https://wdfw.wa.gov/fishing/reports/stocking/trout-plants',
    WI: 'https://dnr.wisconsin.gov/topic/Fishing/stocking',
  },
  // Other countries
  AU: {
    NSW: 'https://www.dpi.nsw.gov.au/fishing/recreational/resources/stocking',
  },
  CA_COUNTRY: { ON: 'https://www.ontario.ca/page/fish-stocking-list' },
  UK: { ENGLAND: 'https://anglingtrust.net/get-fishing/' },
};

/**
 * #521 — Pre-populated top fishing spots per region
 * Curated list of iconic/popular fishing locations worldwide.
 * These are seeded on first launch so the map isn't empty.
 */
export const CURATED_SPOTS = {
  NA: [
    {
      name: 'Lake Okeechobee',
      lat: 26.95,
      lng: -80.83,
      species: ['largemouth_bass', 'bluegill', 'crappie'],
      type: 'lake',
    },
    {
      name: 'Florida Keys Flats',
      lat: 24.66,
      lng: -81.55,
      species: ['tarpon', 'bonefish', 'permit'],
      type: 'flats',
    },
    {
      name: 'Chesapeake Bay',
      lat: 37.41,
      lng: -76.28,
      species: ['striped_bass', 'bluefish', 'red_drum'],
      type: 'bay',
    },
    {
      name: 'Lake Fork',
      lat: 32.78,
      lng: -95.72,
      species: ['largemouth_bass'],
      type: 'lake',
    },
    {
      name: 'Kenai River',
      lat: 60.49,
      lng: -150.77,
      species: ['chinook_salmon', 'sockeye_salmon', 'rainbow_trout'],
      type: 'river',
    },
    {
      name: 'Lake Erie',
      lat: 42.05,
      lng: -81.2,
      species: ['walleye', 'yellow_perch', 'steelhead'],
      type: 'lake',
    },
    {
      name: 'Columbia River',
      lat: 46.24,
      lng: -123.17,
      species: ['chinook_salmon', 'steelhead', 'white_sturgeon'],
      type: 'river',
    },
    {
      name: 'Lake Champlain',
      lat: 44.53,
      lng: -73.34,
      species: ['largemouth_bass', 'lake_trout', 'walleye'],
      type: 'lake',
    },
    {
      name: 'Outer Banks',
      lat: 35.55,
      lng: -75.46,
      species: ['red_drum', 'bluefish', 'flounder'],
      type: 'surf',
    },
    {
      name: 'Mississippi Delta',
      lat: 29.17,
      lng: -89.25,
      species: ['redfish', 'spotted_seatrout', 'tarpon'],
      type: 'estuary',
    },
    {
      name: 'Lake Michigan',
      lat: 43.67,
      lng: -86.83,
      species: ['chinook_salmon', 'steelhead', 'lake_trout'],
      type: 'lake',
    },
    {
      name: 'Venice, LA (Offshore)',
      lat: 29.27,
      lng: -89.35,
      species: ['yellowfin_tuna', 'blue_marlin', 'mahi_mahi'],
      type: 'offshore',
    },
    {
      name: 'San Diego Bay',
      lat: 32.69,
      lng: -117.14,
      species: ['yellowtail_amberjack', 'yellowfin_tuna', 'calico_bass'],
      type: 'bay',
    },
    {
      name: 'Dale Hollow Lake',
      lat: 36.54,
      lng: -85.33,
      species: ['smallmouth_bass', 'walleye', 'muskie'],
      type: 'lake',
    },
    {
      name: 'Montauk Point',
      lat: 41.07,
      lng: -71.86,
      species: ['striped_bass', 'bluefish', 'fluke'],
      type: 'surf',
    },
  ],
  EU: [
    {
      name: 'River Ebro, Spain',
      lat: 41.08,
      lng: 0.61,
      species: ['wels_catfish', 'common_carp', 'largemouth_bass'],
      type: 'river',
    },
    {
      name: 'Lough Corrib, Ireland',
      lat: 53.45,
      lng: -9.35,
      species: ['brown_trout', 'atlantic_salmon', 'pike'],
      type: 'lake',
    },
    {
      name: 'River Test, England',
      lat: 51.08,
      lng: -1.52,
      species: ['brown_trout', 'grayling', 'atlantic_salmon'],
      type: 'river',
    },
    {
      name: 'Lake Balaton, Hungary',
      lat: 46.88,
      lng: 17.89,
      species: ['zander', 'common_carp', 'catfish'],
      type: 'lake',
    },
    {
      name: 'Po River, Italy',
      lat: 45.06,
      lng: 11.87,
      species: ['wels_catfish', 'common_carp', 'pike'],
      type: 'river',
    },
    {
      name: 'Rügen, Germany (Baltic)',
      lat: 54.45,
      lng: 13.37,
      species: ['atlantic_cod', 'sea_trout', 'pike'],
      type: 'coastal',
    },
    {
      name: 'Lac du Bourget, France',
      lat: 45.74,
      lng: 5.86,
      species: ['lake_trout', 'arctic_char', 'pike'],
      type: 'lake',
    },
    {
      name: 'Douro River, Portugal',
      lat: 41.14,
      lng: -8.61,
      species: ['barbel', 'largemouth_bass', 'common_carp'],
      type: 'river',
    },
  ],
  NORDICS: [
    {
      name: 'Lofoten Islands, Norway',
      lat: 68.15,
      lng: 14.0,
      species: ['atlantic_cod', 'atlantic_halibut', 'pollack'],
      type: 'coastal',
    },
    {
      name: 'River Mörrum, Sweden',
      lat: 56.19,
      lng: 14.75,
      species: ['atlantic_salmon', 'sea_trout'],
      type: 'river',
    },
    {
      name: 'Lake Inari, Finland',
      lat: 69.07,
      lng: 27.03,
      species: ['brown_trout', 'arctic_char', 'grayling'],
      type: 'lake',
    },
    {
      name: 'Søgne Archipelago, Norway',
      lat: 58.08,
      lng: 7.68,
      species: ['atlantic_cod', 'pollack', 'wrasse_ballan'],
      type: 'coastal',
    },
    {
      name: 'Lake Vättern, Sweden',
      lat: 58.35,
      lng: 14.58,
      species: ['arctic_char', 'brown_trout', 'pike'],
      type: 'lake',
    },
  ],
  OC: [
    {
      name: 'Cairns, QLD (Great Barrier Reef)',
      lat: -16.92,
      lng: 145.78,
      species: ['giant_trevally', 'coral_trout', 'barramundi'],
      type: 'offshore',
    },
    {
      name: 'Daintree River, QLD',
      lat: -16.3,
      lng: 145.42,
      species: ['barramundi', 'mangrove_jack', 'jungle_perch'],
      type: 'river',
    },
    {
      name: 'Lake Taupo, NZ',
      lat: -38.72,
      lng: 176.08,
      species: ['rainbow_trout', 'brown_trout'],
      type: 'lake',
    },
    {
      name: 'Sydney Harbour',
      lat: -33.86,
      lng: 151.21,
      species: ['mulloway', 'snapper', 'kingfish'],
      type: 'harbour',
    },
    {
      name: 'Port Lincoln, SA',
      lat: -34.73,
      lng: 135.86,
      species: ['yellowtail_amberjack', 'snapper', 'bluefin_tuna'],
      type: 'offshore',
    },
  ],
  SEA: [
    {
      name: 'Andaman Islands, India',
      lat: 11.68,
      lng: 92.77,
      species: ['giant_trevally', 'dogtooth_tuna', 'sailfish'],
      type: 'offshore',
    },
    {
      name: 'Kuala Rompin, Malaysia',
      lat: 2.79,
      lng: 103.5,
      species: ['sailfish', 'giant_trevally'],
      type: 'offshore',
    },
    {
      name: 'Bungsamran Lake, Bangkok',
      lat: 13.73,
      lng: 100.67,
      species: ['giant_snakehead', 'arapaima', 'mekong_catfish'],
      type: 'lake',
    },
  ],
  SA: [
    {
      name: 'Amazon Basin, Brazil',
      lat: -3.47,
      lng: -58.12,
      species: ['peacock_bass', 'arapaima', 'tambaqui'],
      type: 'river',
    },
    {
      name: 'Paraná River, Argentina',
      lat: -31.62,
      lng: -60.67,
      species: ['golden_dorado', 'surubi'],
      type: 'river',
    },
  ],
  AF: [
    {
      name: 'Lake Nasser, Egypt',
      lat: 23.12,
      lng: 32.68,
      species: ['nile_perch', 'tigerfish'],
      type: 'lake',
    },
    {
      name: 'Bazaruto Archipelago, Mozambique',
      lat: -21.65,
      lng: 35.38,
      species: ['giant_trevally', 'sailfish', 'blue_marlin'],
      type: 'offshore',
    },
  ],
  EA: [
    {
      name: 'Tsushima Strait, Japan',
      lat: 33.97,
      lng: 129.37,
      species: ['yellowfin_tuna', 'giant_trevally', 'amberjack'],
      type: 'offshore',
    },
  ],
};

/**
 * Fetch all spot types for a user's area
 * Results are cached to avoid repeated Overpass API calls
 */
export async function fetchAllPublicSpots(lat, lng, radiusKm = 50) {
  const cacheKey = `${CACHE_KEY}_${lat.toFixed(1)}_${lng.toFixed(1)}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }
  } catch (e) {
    /* ignore */
  }

  const results = {
    boatRamps: [],
    fishingPOIs: [],
    piers: [],
    dams: [],
    fetchedAt: new Date().toISOString(),
  };

  try {
    // Sequential to respect rate limit (2 req/sec) — wait 600ms between
    results.boatRamps = await fetchBoatRamps(lat, lng, radiusKm);
    await delay(600);
    results.fishingPOIs = await fetchFishingPOIs(lat, lng, radiusKm);
    await delay(600);
    results.piers = await fetchPiersJetties(lat, lng, radiusKm);
    await delay(600);
    results.dams = await fetchDamsReservoirs(lat, lng, radiusKm);
  } catch (e) {
    console.warn('[PublicSpots] Fetch error:', e.message);
  }

  // Cache results
  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: results, timestamp: Date.now() }),
    );
  } catch (e) {
    /* ignore */
  }

  return results;
}

/**
 * Get curated spots for a region
 */
export function getCuratedSpots(region) {
  return CURATED_SPOTS[region] || CURATED_SPOTS.NA;
}

// ——— Helpers ———

function getBBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return `${lat - latDelta},${lng - lngDelta},${lat + latDelta},${
    lng + lngDelta
  }`;
}

async function overpassQuery(query, cacheId) {
  const url = 'https://overpass-api.de/api/interpreter';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);

  const data = await response.json();
  return (data.elements || [])
    .map(el => ({
      id: `osm_${el.id}`,
      name: el.tags?.name || el.tags?.description || 'Unnamed',
      lat: el.lat || el.center?.lat,
      lng: el.lon || el.center?.lon,
      type:
        el.tags?.leisure || el.tags?.man_made || el.tags?.water || 'unknown',
      tags: el.tags || {},
      source: 'osm',
    }))
    .filter(s => s.lat && s.lng);
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default {
  fetchBoatRamps,
  fetchFishingPOIs,
  fetchPiersJetties,
  fetchDamsReservoirs,
  fetchAllPublicSpots,
  getCuratedSpots,
  STOCKING_REPORT_SOURCES,
  CURATED_SPOTS,
};
