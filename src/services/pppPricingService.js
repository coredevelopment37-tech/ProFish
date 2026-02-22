/**
 * PPP-Adjusted Pricing Service (#259)
 *
 * Uses RevenueCat offerings (which handle per-region App Store pricing)
 * and supplements with display-level PPP adjustments.
 *
 * Apple/Google handle actual charge amounts per region.
 * This service provides localized price strings for UI display.
 */

import regionGatingService from './regionGatingService';

// PPP multipliers by region (relative to US = 1.0)
// Sources: World Bank PPP data, App Store equalized pricing
const PPP_MULTIPLIERS = {
  NA: 1.0, // $7.99/mo | $59.99/yr
  EU: 0.95, // €7.49/mo | €56.99/yr
  NORDICS: 1.05, // SEK 89/mo | SEK 649/yr
  GCC: 0.9, // AED 29/mo | AED 219/yr
  MENA: 0.6, // EGP 149/mo | EGP 1099/yr
  SA: 0.45, // BRL 29.90/mo | BRL 219.90/yr
  CA: 0.55, // MXN 99/mo | MXN 749/yr
  SEA: 0.35, // THB 179/mo | THB 1299/yr
  EA: 0.85, // JPY 980/mo | JPY 7400/yr
  SA_ASIA: 0.25, // INR 249/mo | INR 1799/yr
  OC: 0.95, // AUD 12.99/mo | AUD 89.99/yr
  AF: 0.3, // ZAR 69/mo | ZAR 499/yr
  GLOBAL: 1.0,
};

// Localized price display strings (from App Store Connect / Google Play Console)
const LOCALIZED_PRICES = {
  NA: { monthly: '$7.99', yearly: '$59.99', currency: 'USD' },
  EU: { monthly: '€7.49', yearly: '€56.99', currency: 'EUR' },
  NORDICS: { monthly: '89 kr', yearly: '649 kr', currency: 'SEK' },
  GCC: { monthly: 'AED 29', yearly: 'AED 219', currency: 'AED' },
  MENA: { monthly: 'EGP 149', yearly: 'EGP 1099', currency: 'EGP' },
  SA: { monthly: 'R$ 29.90', yearly: 'R$ 219.90', currency: 'BRL' },
  CA: { monthly: 'MX$99', yearly: 'MX$749', currency: 'MXN' },
  SEA: { monthly: '฿179', yearly: '฿1299', currency: 'THB' },
  EA: { monthly: '¥980', yearly: '¥7400', currency: 'JPY' },
  SA_ASIA: { monthly: '₹249', yearly: '₹1799', currency: 'INR' },
  OC: { monthly: 'A$12.99', yearly: 'A$89.99', currency: 'AUD' },
  AF: { monthly: 'R69', yearly: 'R499', currency: 'ZAR' },
  GLOBAL: { monthly: '$7.99', yearly: '$59.99', currency: 'USD' },
};

const pppPricingService = {
  /**
   * Get localized price for user's detected region.
   * Falls back to USD if region unknown.
   *
   * NOTE: In production, use RevenueCat's priceString from offerings
   * which is always authoritative. This is a fallback for offline display.
   */
  getLocalizedPrices() {
    const region = regionGatingService.getRegion() || 'GLOBAL';
    return LOCALIZED_PRICES[region] || LOCALIZED_PRICES.GLOBAL;
  },

  /**
   * Get PPP multiplier for current region
   */
  getPPPMultiplier() {
    const region = regionGatingService.getRegion() || 'GLOBAL';
    return PPP_MULTIPLIERS[region] || 1.0;
  },

  /**
   * Get display price string for paywall
   * Prefers RevenueCat priceString when available
   */
  getPaywallPrices(revenueCatOfferings = null) {
    // If RevenueCat offerings available, use those (authoritative)
    if (revenueCatOfferings?.current?.availablePackages) {
      const packages = revenueCatOfferings.current.availablePackages;
      const monthly = packages.find(p => p.identifier?.includes('monthly'));
      const yearly = packages.find(p => p.identifier?.includes('yearly'));
      return {
        monthly:
          monthly?.product?.priceString || this.getLocalizedPrices().monthly,
        yearly:
          yearly?.product?.priceString || this.getLocalizedPrices().yearly,
        currency:
          monthly?.product?.currencyCode || this.getLocalizedPrices().currency,
        source: 'revenuecat',
      };
    }

    // Fallback to static PPP prices
    const prices = this.getLocalizedPrices();
    return { ...prices, source: 'ppp_static' };
  },

  /**
   * Get savings percentage for yearly vs monthly
   */
  getYearlySavings() {
    // $7.99 × 12 = $95.88/yr, Pro yearly = $59.99/yr → 37% savings
    return Math.round((1 - 59.99 / (7.99 * 12)) * 100);
  },
};

export { PPP_MULTIPLIERS, LOCALIZED_PRICES };
export default pppPricingService;
