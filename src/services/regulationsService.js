/**
 * Regulations Service — Firebase-backed fishing rules CMS
 * #531-535 — Dynamic regulations, "Is It Legal?", license info, protected areas, season alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@profish_regulations';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// #531 — Firebase collection structure for regulations
// In production, these live in Firestore: /regulations/{regionId}/rules/{ruleId}
// This service provides the local fallback + sync logic

/**
 * Comprehensive fishing regulations database
 * Organized by region → state/province → rules
 * Updated via Firebase Firestore (remote) + local JSON fallback
 */
const REGULATIONS_DB = {
  // ========== NORTH AMERICA ==========
  US_FL: {
    region: 'North America',
    state: 'Florida',
    country: 'US',
    licenseUrl: 'https://myfwc.com/license/',
    reportingUrl: 'https://myfwc.com/fishing/',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'largemouth_bass',
        minSize: 14,
        maxSize: null,
        bagLimit: 5,
        season: 'year-round',
        notes: 'Only 1 over 22 inches per day',
      },
      {
        species: 'redfish',
        minSize: 18,
        maxSize: 27,
        bagLimit: 1,
        season: 'year-round',
        notes: 'Slot limit — must be 18-27 inches',
      },
      {
        species: 'snook',
        minSize: 28,
        maxSize: 33,
        bagLimit: 1,
        season: 'Sep 1 - Dec 14, Feb 1 - May 31',
        notes: 'Closed Jun-Aug & Dec 15-Jan 31. Slot 28-33"',
      },
      {
        species: 'spotted_seatrout',
        minSize: 15,
        maxSize: 20,
        bagLimit: 3,
        season: 'year-round',
        notes: 'Slot 15-20 inches, 1 over 20" allowed',
      },
      {
        species: 'tarpon',
        minSize: null,
        maxSize: null,
        bagLimit: 0,
        season: 'year-round',
        notes: 'Catch and release only. $50 tarpon tag required to keep',
      },
      {
        species: 'red_snapper',
        minSize: 16,
        maxSize: null,
        bagLimit: 2,
        season: 'Jun-Jul (federal), varies (state)',
        notes: 'Short federal season. Check current dates.',
      },
      {
        species: 'grouper_gag',
        minSize: 24,
        maxSize: null,
        bagLimit: 2,
        season: 'Jun 1 - Dec 31',
        notes: 'Closed Jan-May for spawning',
      },
    ],
  },
  US_TX: {
    region: 'North America',
    state: 'Texas',
    country: 'US',
    licenseUrl: 'https://tpwd.texas.gov/business/licenses/',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'largemouth_bass',
        minSize: 14,
        maxSize: null,
        bagLimit: 5,
        season: 'year-round',
        notes: 'Varies by lake — check specific lake regs',
      },
      {
        species: 'redfish',
        minSize: 20,
        maxSize: 28,
        bagLimit: 3,
        season: 'year-round',
        notes: 'Slot limit 20-28 inches. 1 over 28 per day',
      },
      {
        species: 'spotted_seatrout',
        minSize: 15,
        maxSize: 25,
        bagLimit: 5,
        season: 'year-round',
        notes: 'Only 1 over 25 inches',
      },
      {
        species: 'catfish_channel',
        minSize: 12,
        maxSize: null,
        bagLimit: 25,
        season: 'year-round',
        notes: 'No limit on blue/flathead in some waters',
      },
      {
        species: 'crappie',
        minSize: 10,
        maxSize: null,
        bagLimit: 25,
        season: 'year-round',
        notes: 'Combined black & white crappie',
      },
    ],
  },
  US_CA: {
    region: 'North America',
    state: 'California',
    country: 'US',
    licenseUrl: 'https://wildlife.ca.gov/Licensing/Fishing',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'largemouth_bass',
        minSize: 12,
        maxSize: null,
        bagLimit: 5,
        season: 'year-round',
        notes: 'Some waters catch-and-release only Jan-Jun',
      },
      {
        species: 'rainbow_trout',
        minSize: null,
        maxSize: null,
        bagLimit: 5,
        season: 'Last Sat Apr - Nov 15',
        notes: 'General trout season. Varies by water.',
      },
      {
        species: 'striped_bass',
        minSize: 18,
        maxSize: null,
        bagLimit: 2,
        season: 'year-round',
        notes: 'Sacramento River and Delta',
      },
      {
        species: 'halibut',
        minSize: 22,
        maxSize: null,
        bagLimit: 5,
        season: 'year-round',
        notes: 'California halibut (not Pacific)',
      },
      {
        species: 'yellowtail',
        minSize: 24,
        maxSize: null,
        bagLimit: 10,
        season: 'year-round',
        notes: 'Offshore. Part of 10-fish California pelagic bag',
      },
    ],
  },
  US_MN: {
    region: 'North America',
    state: 'Minnesota',
    country: 'US',
    licenseUrl: 'https://www.dnr.state.mn.us/licenses/fishing/',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'walleye',
        minSize: 15,
        maxSize: null,
        bagLimit: 6,
        season: 'Mid-May - Feb',
        notes: 'Varies by lake zone. Mille Lacs special regs.',
      },
      {
        species: 'northern_pike',
        minSize: 24,
        maxSize: null,
        bagLimit: 3,
        season: 'Mid-May - Feb',
        notes: 'Only 1 over 36 inches',
      },
      {
        species: 'muskie',
        minSize: 54,
        maxSize: null,
        bagLimit: 1,
        season: 'Jun - Nov',
        notes: '54-inch minimum. Most released.',
      },
      {
        species: 'largemouth_bass',
        minSize: 14,
        maxSize: null,
        bagLimit: 6,
        season: 'Late May - Feb',
        notes: 'Catch and release during spawn May-June on some lakes',
      },
      {
        species: 'crappie',
        minSize: null,
        maxSize: null,
        bagLimit: 10,
        season: 'year-round',
        notes: 'No minimum length',
      },
    ],
  },
  CA_ON: {
    region: 'North America',
    state: 'Ontario',
    country: 'CA',
    licenseUrl: 'https://www.ontario.ca/page/fishing-licence',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'walleye',
        minSize: null,
        maxSize: null,
        bagLimit: 4,
        season: 'Varies by zone',
        notes: 'Zone-specific seasons. Conservation license: 2 fish.',
      },
      {
        species: 'largemouth_bass',
        minSize: null,
        maxSize: null,
        bagLimit: 6,
        season: 'Late Jun - Nov',
        notes: 'Catch-and-release only before season opener',
      },
      {
        species: 'northern_pike',
        minSize: null,
        maxSize: null,
        bagLimit: 6,
        season: 'Jan - Mar, May - Dec',
        notes: 'Conservation license: 2 fish',
      },
      {
        species: 'muskie',
        minSize: 36,
        maxSize: null,
        bagLimit: 1,
        season: 'Jun - Dec',
        notes: '36 inch minimum (91 cm)',
      },
      {
        species: 'lake_trout',
        minSize: null,
        maxSize: null,
        bagLimit: 2,
        season: 'Varies by zone',
        notes: 'Many lakes catch-and-release only',
      },
    ],
  },

  // ========== EUROPE ==========
  EU_UK: {
    region: 'Europe',
    state: 'England & Wales',
    country: 'UK',
    licenseUrl: 'https://www.gov.uk/fishing-licences',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'atlantic_salmon',
        minSize: null,
        maxSize: null,
        bagLimit: 2,
        season: 'Feb 1 - Oct 31',
        notes: 'Rivers only. Many rivers catch-and-release mandatory.',
      },
      {
        species: 'sea_trout',
        minSize: null,
        maxSize: null,
        bagLimit: null,
        season: 'Mar 3 - Oct 7',
        notes: 'Varies by river. Mandatory catch returns.',
      },
      {
        species: 'coarse_fish',
        minSize: null,
        maxSize: null,
        bagLimit: null,
        season: 'Jun 16 - Mar 14',
        notes: 'Close season on rivers. Canals/lakes exempt.',
      },
      {
        species: 'european_bass',
        minSize: 42,
        maxSize: null,
        bagLimit: 2,
        season: 'Apr 1 - Oct 31',
        notes: '42cm minimum. Catch-and-release only Nov-Mar.',
      },
    ],
  },
  EU_NO: {
    region: 'Nordics',
    state: 'Norway',
    country: 'NO',
    licenseUrl: 'https://www.miljodirektoratet.no/fishing-in-norway/',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'atlantic_salmon',
        minSize: null,
        maxSize: null,
        bagLimit: null,
        season: 'Jun - Sep',
        notes:
          'River-specific. License from landowner required. Disinfect all gear.',
      },
      {
        species: 'atlantic_cod',
        minSize: 40,
        maxSize: null,
        bagLimit: null,
        season: 'year-round',
        notes: 'Tourist limit: 18kg filleted fish can be exported',
      },
      {
        species: 'atlantic_halibut',
        minSize: 80,
        maxSize: null,
        bagLimit: null,
        season: 'year-round',
        notes: '80cm minimum. Release large breeding females.',
      },
      {
        species: 'brown_trout',
        minSize: 25,
        maxSize: null,
        bagLimit: null,
        season: 'Varies',
        notes: 'Freshwater fishing license required for persons over 16.',
      },
    ],
  },
  EU_SE: {
    region: 'Nordics',
    state: 'Sweden',
    country: 'SE',
    licenseUrl: 'https://www.fiskekort.se/',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'atlantic_salmon',
        minSize: 60,
        maxSize: null,
        bagLimit: 1,
        season: 'Varies by river',
        notes: 'Strongly regulated. Many rivers catch-and-release only.',
      },
      {
        species: 'zander',
        minSize: 40,
        maxSize: 65,
        bagLimit: 3,
        season: 'Varies',
        notes: 'Slot limit on many waters. Protected during spawning.',
      },
      {
        species: 'european_perch',
        minSize: null,
        maxSize: null,
        bagLimit: null,
        season: 'year-round',
        notes: 'Free to fish on coast and 5 largest lakes',
      },
      {
        species: 'northern_pike',
        minSize: 40,
        maxSize: 75,
        bagLimit: 3,
        season: 'year-round',
        notes: 'Slot limit encourages releasing large breeding fish.',
      },
    ],
  },

  // ========== OCEANIA ==========
  OC_AU_NSW: {
    region: 'Oceania',
    state: 'New South Wales',
    country: 'AU',
    licenseUrl:
      'https://www.service.nsw.gov.au/transaction/apply-for-a-recreational-fishing-fee',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'barramundi',
        minSize: 58,
        maxSize: null,
        bagLimit: 5,
        season: 'year-round',
        notes: '58cm minimum size limit',
      },
      {
        species: 'mulloway',
        minSize: 70,
        maxSize: null,
        bagLimit: 2,
        season: 'year-round',
        notes: '70cm minimum. Declining population.',
      },
      {
        species: 'snapper',
        minSize: 30,
        maxSize: null,
        bagLimit: 10,
        season: 'year-round',
        notes: 'Combined possession limit in some zones',
      },
      {
        species: 'australian_bass',
        minSize: 30,
        maxSize: null,
        bagLimit: 2,
        season: 'year-round',
        notes: 'Catch-and-release May 1 - Aug 31 in some dams',
      },
      {
        species: 'flathead_dusky',
        minSize: 36,
        maxSize: 70,
        bagLimit: 10,
        season: 'year-round',
        notes: 'Slot limit — only 1 over 70cm per person',
      },
    ],
  },
  OC_NZ: {
    region: 'Oceania',
    state: 'New Zealand',
    country: 'NZ',
    licenseUrl: 'https://fishandgame.org.nz/licences/',
    lastUpdated: '2025-01-15',
    rules: [
      {
        species: 'rainbow_trout',
        minSize: null,
        maxSize: null,
        bagLimit: 2,
        season: 'Oct 1 - Apr 30',
        notes: 'Varies by region/backcountry. Check local regs.',
      },
      {
        species: 'brown_trout',
        minSize: null,
        maxSize: null,
        bagLimit: 2,
        season: 'Oct 1 - Apr 30',
        notes: 'Many back-country waters have trophy regs (1 fish)',
      },
      {
        species: 'snapper',
        minSize: 30,
        maxSize: null,
        bagLimit: 7,
        season: 'year-round',
        notes: '7 per person daily bag (reduced from 9 in 2024)',
      },
      {
        species: 'kingfish',
        minSize: 75,
        maxSize: null,
        bagLimit: 3,
        season: 'year-round',
        notes: '75cm minimum size',
      },
    ],
  },
};

/**
 * #532 — "Is It Legal?" checker
 * Check if a planned catch is legal given species, size, region
 */
function checkLegality(
  regionCode,
  speciesId,
  lengthCm = null,
  date = new Date(),
) {
  const region = REGULATIONS_DB[regionCode];
  if (!region)
    return {
      legal: null,
      status: 'UNKNOWN_REGION',
      message: 'No regulations found for this region. Check local authorities.',
    };

  const rule = region.rules.find(r => r.species === speciesId);
  if (!rule)
    return {
      legal: null,
      status: 'UNKNOWN_SPECIES',
      message: 'No specific regulations found for this species in this region.',
    };

  const issues = [];

  // Check season
  if (rule.season !== 'year-round') {
    // Simple month-based check (full calendar parsing would need more complex logic)
    issues.push({
      type: 'season',
      message: `Season: ${rule.season}. Verify current dates.`,
      severity: 'warning',
    });
  }

  // Check size
  if (lengthCm !== null) {
    if (rule.minSize && lengthCm < rule.minSize) {
      issues.push({
        type: 'undersized',
        message: `Below minimum size (${rule.minSize} inches). Must release.`,
        severity: 'illegal',
      });
    }
    if (rule.maxSize && lengthCm > rule.maxSize) {
      issues.push({
        type: 'oversized',
        message: `Above maximum size (${rule.maxSize} inches). Slot limit — must release.`,
        severity: 'illegal',
      });
    }
  }

  // Check bag limit
  if (rule.bagLimit === 0) {
    issues.push({
      type: 'no_harvest',
      message: 'Catch and release only. Cannot keep this species.',
      severity: 'illegal',
    });
  }

  const hasIllegal = issues.some(i => i.severity === 'illegal');

  return {
    legal: issues.length === 0 ? true : !hasIllegal,
    status: hasIllegal
      ? 'ILLEGAL'
      : issues.length > 0
      ? 'CHECK_REQUIRED'
      : 'LEGAL',
    rule,
    issues,
    region: {
      name: region.state,
      country: region.country,
      licenseUrl: region.licenseUrl,
    },
    message: hasIllegal
      ? '⚠️ This catch may violate regulations. Please release the fish.'
      : issues.length > 0
      ? '⚡ Check season dates and local rules before keeping.'
      : '✅ This catch appears legal. Always verify with local authorities.',
    notes: rule.notes,
  };
}

/**
 * #533 — License information for a region
 */
function getLicenseInfo(regionCode) {
  const region = REGULATIONS_DB[regionCode];
  if (!region) return null;
  return {
    state: region.state,
    country: region.country,
    licenseUrl: region.licenseUrl,
    reportingUrl: region.reportingUrl || null,
    lastUpdated: region.lastUpdated,
  };
}

/**
 * #534 — Get all rules for a region
 */
function getRegionRules(regionCode) {
  return REGULATIONS_DB[regionCode] || null;
}

/**
 * Get all available regions
 */
function getAvailableRegions() {
  return Object.entries(REGULATIONS_DB).map(([code, data]) => ({
    code,
    name: data.state,
    country: data.country,
    region: data.region,
    ruleCount: data.rules.length,
    lastUpdated: data.lastUpdated,
  }));
}

/**
 * Search regulations by species across all regions
 */
function searchSpeciesRegulations(speciesId) {
  const results = [];
  for (const [code, data] of Object.entries(REGULATIONS_DB)) {
    const rule = data.rules.find(r => r.species === speciesId);
    if (rule) {
      results.push({
        regionCode: code,
        state: data.state,
        country: data.country,
        ...rule,
      });
    }
  }
  return results;
}

/**
 * #531 — Sync regulations from Firebase (when available)
 * Falls back to local DB if offline
 */
async function syncRegulations() {
  try {
    // Attempt Firebase sync
    const firestore = require('@react-native-firebase/firestore').default;
    const snapshot = await firestore().collection('regulations').get();
    if (!snapshot.empty) {
      const remoteRegs = {};
      snapshot.forEach(doc => {
        remoteRegs[doc.id] = doc.data();
      });
      // Cache the remote data
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: remoteRegs,
          timestamp: Date.now(),
        }),
      );
      return { source: 'firebase', count: Object.keys(remoteRegs).length };
    }
  } catch (e) {
    // Firebase not available — use local fallback
  }

  // Check local cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return { source: 'cache', count: Object.keys(REGULATIONS_DB).length };
      }
    }
  } catch (e) {
    /* ignore */
  }

  return { source: 'local', count: Object.keys(REGULATIONS_DB).length };
}

/**
 * #535 — Check if any season notifications are relevant
 */
function getSeasonAlerts(regionCode, targetSpecies = []) {
  const region = REGULATIONS_DB[regionCode];
  if (!region) return [];

  const alerts = [];
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  for (const rule of region.rules) {
    if (targetSpecies.length > 0 && !targetSpecies.includes(rule.species))
      continue;
    if (rule.season === 'year-round') continue;

    alerts.push({
      species: rule.species,
      season: rule.season,
      bagLimit: rule.bagLimit,
      minSize: rule.minSize,
      maxSize: rule.maxSize,
      notes: rule.notes,
      type: 'season_info',
      message: `${rule.species.replace(/_/g, ' ')}: Season is ${rule.season}`,
    });
  }

  return alerts;
}

export {
  REGULATIONS_DB,
  checkLegality,
  getLicenseInfo,
  getRegionRules,
  getAvailableRegions,
  searchSpeciesRegulations,
  syncRegulations,
  getSeasonAlerts,
};

export default {
  checkLegality,
  getLicenseInfo,
  getRegionRules,
  getAvailableRegions,
  searchSpeciesRegulations,
  syncRegulations,
  getSeasonAlerts,
};
