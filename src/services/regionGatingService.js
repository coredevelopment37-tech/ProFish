/**
 * Region Gating Service — ProFish
 *
 * Detects user region for:
 *   - PPP-adjusted pricing
 *   - Default species for their region
 *   - Regulation data availability
 *   - Language auto-detection
 *
 * No features are region-gated — everything is available everywhere.
 * This is purely for customization and analytics.
 */

import * as RNLocalize from 'react-native-localize';

// Region definitions
const REGIONS = {
  NA: { id: 'NA', label: 'North America', countries: ['US', 'CA', 'MX'] },
  EU: {
    id: 'EU',
    label: 'Europe',
    countries: [
      'GB',
      'IE',
      'DE',
      'FR',
      'ES',
      'PT',
      'IT',
      'NL',
      'BE',
      'AT',
      'CH',
      'PL',
      'CZ',
      'HU',
      'HR',
      'GR',
      'RO',
    ],
  },
  NORDICS: {
    id: 'NORDICS',
    label: 'Scandinavia',
    countries: ['SE', 'NO', 'FI', 'DK'],
  },
  GCC: {
    id: 'GCC',
    label: 'Gulf States',
    countries: ['AE', 'SA', 'OM', 'QA', 'KW', 'BH'],
  },
  MENA: {
    id: 'MENA',
    label: 'Middle East & North Africa',
    countries: ['EG', 'MA', 'TN', 'JO', 'TR'],
  },
  SA: {
    id: 'SA',
    label: 'South America',
    countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'UY'],
  },
  CA: {
    id: 'CA',
    label: 'Central America',
    countries: ['CR', 'PA', 'GT', 'DO'],
  },
  SEA: {
    id: 'SEA',
    label: 'Southeast Asia',
    countries: ['TH', 'ID', 'MY', 'PH', 'VN', 'KH', 'MM', 'SG'],
  },
  EA: { id: 'EA', label: 'East Asia', countries: ['JP', 'KR', 'TW', 'HK'] },
  SA_ASIA: { id: 'SA_ASIA', label: 'South Asia', countries: ['IN', 'LK'] },
  OC: { id: 'OC', label: 'Oceania', countries: ['AU', 'NZ', 'FJ', 'PG'] },
  AF: {
    id: 'AF',
    label: 'Africa',
    countries: ['ZA', 'KE', 'TZ', 'MZ', 'NG', 'GH', 'UG', 'MU'],
  },
};

const regionGatingService = {
  _detectedRegion: null,
  _detectedCountry: null,

  /**
   * Detect user's region from device locale
   */
  detect() {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      this._detectedCountry = locales[0].countryCode;
      this._detectedRegion = this._findRegion(this._detectedCountry);
    }

    return {
      country: this._detectedCountry,
      region: this._detectedRegion,
    };
  },

  getCountry() {
    if (!this._detectedCountry) this.detect();
    return this._detectedCountry;
  },

  getRegion() {
    if (!this._detectedRegion) this.detect();
    return this._detectedRegion;
  },

  getRegionLabel() {
    const region = this.getRegion();
    return REGIONS[region]?.label || 'Global';
  },

  _findRegion(countryCode) {
    for (const [regionId, region] of Object.entries(REGIONS)) {
      if (region.countries.includes(countryCode)) {
        return regionId;
      }
    }
    return 'GLOBAL';
  },
};

export { REGIONS };
export default regionGatingService;
