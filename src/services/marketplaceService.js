/**
 * Marketplace Service — ProFish (#410-419)
 *
 * Marketplace for fishing gear, guides, and charters.
 *
 * Data model (#410):
 * - Listings: gear (buy/sell), guides (profiles), charters (bookings)
 * - Firestore: marketplace/{type}/{listingId}
 * - Reviews: marketplace_reviews/{listingId}/reviews/{reviewId}
 *
 * Features:
 * #411 — Browse marketplace
 * #412 — Gear listings (used equipment buy/sell)
 * #413 — Guide profiles (bio, reviews, availability, rates)
 * #414 — Charter booking flow
 * #415 — Stripe Connect payments
 * #416 — Review/rating system
 * #417 — Affiliate gear links
 * #418 — Location-based search
 * #419 — Branded guide reports
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Data Model (#410) ────────────────────────────────────

export const LISTING_TYPE = {
  GEAR: 'gear',
  GUIDE: 'guide',
  CHARTER: 'charter',
};

export const GEAR_CATEGORY = {
  RODS: 'rods',
  REELS: 'reels',
  LURES: 'lures',
  TACKLE: 'tackle',
  ELECTRONICS: 'electronics',
  APPAREL: 'apparel',
  BOATS: 'boats',
  ACCESSORIES: 'accessories',
  OTHER: 'other',
};

export const GEAR_CONDITION = {
  NEW: { label: 'New', color: '#4CAF50' },
  LIKE_NEW: { label: 'Like New', color: '#8BC34A' },
  GOOD: { label: 'Good', color: '#FF9800' },
  FAIR: { label: 'Fair', color: '#F44336' },
  PARTS: { label: 'For Parts', color: '#666' },
};

export const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  PENDING: 'pending',
  EXPIRED: 'expired',
  REMOVED: 'removed',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
};

// ── Listing Schemas ──────────────────────────────────────

/**
 * Create a gear listing (#412)
 */
export function createGearListing(data) {
  return {
    type: LISTING_TYPE.GEAR,
    status: LISTING_STATUS.ACTIVE,
    title: data.title || '',
    description: data.description || '',
    category: data.category || GEAR_CATEGORY.OTHER,
    condition: data.condition || 'good',
    price: data.price || 0,
    currency: data.currency || 'USD',
    negotiable: data.negotiable || false,
    photos: data.photos || [], // Array of URIs
    brand: data.brand || '',
    model: data.model || '',
    // Seller info
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    sellerRating: data.sellerRating || 0,
    // Location (#418)
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
    },
    shippingAvailable: data.shippingAvailable || false,
    shippingCost: data.shippingCost || 0,
    // Metadata
    createdAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: Date.now() + 30 * 86400000, // 30 days
    views: 0,
    saves: 0,
  };
}

/**
 * Create a guide profile (#413)
 */
export function createGuideProfile(data) {
  return {
    type: LISTING_TYPE.GUIDE,
    status: LISTING_STATUS.ACTIVE,
    // Bio
    userId: data.userId,
    displayName: data.displayName || '',
    bio: data.bio || '',
    profilePhoto: data.profilePhoto || '',
    coverPhoto: data.coverPhoto || '',
    yearsExperience: data.yearsExperience || 0,
    certifications: data.certifications || [],
    languages: data.languages || ['en'],
    // Specialties
    specialties: data.specialties || [], // Species IDs
    techniques: data.techniques || [],
    waterTypes: data.waterTypes || [], // freshwater, saltwater, fly
    // Location (#418)
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      serviceRadius: data.serviceRadius || 50, // miles
    },
    operatingAreas: data.operatingAreas || [], // Region names
    // Rates
    rates: {
      halfDay: data.halfDayRate || 0,
      fullDay: data.fullDayRate || 0,
      multiDay: data.multiDayRate || 0,
      currency: data.currency || 'USD',
    },
    // Availability
    availability: {
      daysOfWeek: data.daysOfWeek || [1, 2, 3, 4, 5, 6], // Mon-Sat
      startTime: data.startTime || '05:00',
      endTime: data.endTime || '18:00',
      blackoutDates: data.blackoutDates || [],
      maxGroupSize: data.maxGroupSize || 4,
    },
    // Reviews (#416)
    avgRating: 0,
    reviewCount: 0,
    // Metadata
    createdAt: Date.now(),
    updatedAt: Date.now(),
    verified: false,
    featured: false,
  };
}

/**
 * Create a charter listing (#414)
 */
export function createCharterListing(data) {
  return {
    type: LISTING_TYPE.CHARTER,
    status: LISTING_STATUS.ACTIVE,
    // Charter info
    businessName: data.businessName || '',
    captainName: data.captainName || '',
    description: data.description || '',
    photos: data.photos || [],
    coverPhoto: data.coverPhoto || '',
    // Vessel
    vessel: {
      name: data.vesselName || '',
      type: data.vesselType || 'center_console', // center_console, sportfisher, catamaran, kayak
      length: data.vesselLength || 0, // feet
      capacity: data.vesselCapacity || 6,
      amenities: data.amenities || [], // toilet, fish finder, live well, etc.
    },
    // Location (#418)
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      port: data.port || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
    },
    // Trip types
    tripTypes: data.tripTypes || [
      { name: 'Half Day (4hr)', duration: 4, price: 400 },
      { name: 'Full Day (8hr)', duration: 8, price: 700 },
      { name: 'Overnight', duration: 24, price: 1500 },
    ],
    // Target species
    targetSpecies: data.targetSpecies || [],
    // Booking info
    currency: data.currency || 'USD',
    depositPercent: data.depositPercent || 25,
    cancellationPolicy: data.cancellationPolicy || '48h_full_refund',
    // Reviews (#416)
    avgRating: 0,
    reviewCount: 0,
    // Stripe Connect (#415)
    stripeAccountId: data.stripeAccountId || null,
    // Metadata
    createdAt: Date.now(),
    updatedAt: Date.now(),
    verified: false,
    featured: false,
    uscgLicense: data.uscgLicense || '',
  };
}

// ── Review System (#416) ─────────────────────────────────

export function createReview(data) {
  return {
    listingId: data.listingId,
    listingType: data.listingType,
    reviewerId: data.reviewerId,
    reviewerName: data.reviewerName,
    rating: Math.min(5, Math.max(1, data.rating || 5)),
    title: data.title || '',
    text: data.text || '',
    photos: data.photos || [],
    // Verified booking
    bookingId: data.bookingId || null,
    verified: !!data.bookingId,
    // Moderation
    approved: false,
    flagged: false,
    createdAt: Date.now(),
  };
}

// ── Affiliate Links (#417) ───────────────────────────────

const AFFILIATE_CONFIG = {
  AMAZON_TAG: 'profish-20', // Amazon Associates tag
  TACKLE_WAREHOUSE_ID: 'profish',
  BASS_PRO_ID: 'profish',
};

export const affiliateService = {
  /**
   * Generate affiliate link for a product
   */
  getAffiliateLink(product, retailer = 'amazon') {
    switch (retailer) {
      case 'amazon':
        if (product.asin) {
          return `https://www.amazon.com/dp/${product.asin}?tag=${AFFILIATE_CONFIG.AMAZON_TAG}`;
        }
        return `https://www.amazon.com/s?k=${encodeURIComponent(
          product.name,
        )}&tag=${AFFILIATE_CONFIG.AMAZON_TAG}`;

      case 'tackle_warehouse':
        return `https://www.tacklewarehouse.com/search?q=${encodeURIComponent(
          product.name,
        )}&ref=${AFFILIATE_CONFIG.TACKLE_WAREHOUSE_ID}`;

      case 'bass_pro':
        return `https://www.basspro.com/shop/en/search?q=${encodeURIComponent(
          product.name,
        )}&ref=${AFFILIATE_CONFIG.BASS_PRO_ID}`;

      default:
        return null;
    }
  },

  /**
   * Get recommended gear with affiliate links
   */
  getRecommendedGear(speciesId) {
    const GEAR_RECOMMENDATIONS = {
      largemouth_bass: [
        {
          name: 'Abu Garcia Revo X Baitcast Combo',
          asin: 'B07PX8NV2J',
          price: 99.99,
          category: 'rod_reel',
        },
        {
          name: 'Strike King KVD 1.5 Crankbait',
          asin: 'B001O2I8W6',
          price: 5.99,
          category: 'lure',
        },
        {
          name: 'Seaguar InvizX Fluorocarbon 15lb',
          asin: 'B001O2HVP0',
          price: 19.99,
          category: 'line',
        },
      ],
      rainbow_trout: [
        {
          name: 'Ugly Stik Elite Spinning Combo',
          asin: 'B07PRQVHG8',
          price: 69.99,
          category: 'rod_reel',
        },
        {
          name: 'Panther Martin Spinner 6-Pack',
          asin: 'B000GX9O6A',
          price: 12.99,
          category: 'lure',
        },
        {
          name: 'PowerBait Trout Bait',
          asin: 'B0000AUUU3',
          price: 6.99,
          category: 'bait',
        },
      ],
      walleye: [
        {
          name: 'St. Croix Eyecon Spinning Rod',
          asin: 'B07NPRSQQ8',
          price: 129.99,
          category: 'rod',
        },
        {
          name: 'Rapala Jigging Rap',
          asin: 'B0000AUXCV',
          price: 8.99,
          category: 'lure',
        },
        {
          name: 'Northland Fire-Ball Jig 6-Pack',
          asin: 'B003ZZYZZY',
          price: 7.99,
          category: 'jig',
        },
      ],
    };

    const gear = GEAR_RECOMMENDATIONS[speciesId] || [];
    return gear.map(item => ({
      ...item,
      affiliateUrl: this.getAffiliateLink(item, 'amazon'),
    }));
  },
};

// ── Location-Based Search (#418) ─────────────────────────

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Branded Guide Reports (#419) ─────────────────────────

function generateGuideReportHtml(guide, trip, catches) {
  const catchRows = catches
    .map(
      c => `
    <tr>
      <td>${c.time || ''}</td>
      <td><strong>${c.species || ''}</strong></td>
      <td>${c.weight ? c.weight + ' lb' : '—'}</td>
      <td>${c.length ? c.length + '"' : '—'}</td>
      <td>${c.method || ''}</td>
    </tr>
  `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Helvetica, Arial; padding: 20px; color: #1a1a2e; }
        .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #0a84ff; padding-bottom: 16px; }
        .logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
        .guide-name { font-size: 24px; font-weight: bold; color: #0a84ff; }
        .guide-title { color: #666; font-size: 14px; }
        .trip-box { background: #f0f4ff; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .trip-box h3 { margin: 0 0 8px; color: #0a84ff; }
        .trip-box p { margin: 4px 0; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #0a84ff; color: white; padding: 8px; text-align: left; font-size: 12px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
        .stats { display: flex; gap: 12px; margin: 16px 0; }
        .stat { background: #f0f4ff; border-radius: 8px; padding: 12px; flex: 1; text-align: center; }
        .stat-val { font-size: 24px; font-weight: bold; color: #0a84ff; }
        .stat-label { font-size: 10px; color: #666; }
        .footer { margin-top: 30px; text-align: center; color: #aaa; font-size: 10px; border-top: 1px solid #eee; padding-top: 12px; }
        .photos { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
        .photos img { width: 120px; height: 90px; object-fit: cover; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${
          guide.profilePhoto
            ? `<img src="${guide.profilePhoto}" class="logo" />`
            : ''
        }
        <div>
          <div class="guide-name">${
            guide.displayName || guide.businessName || 'Fishing Guide'
          }</div>
          <div class="guide-title">Professional Fishing Guide | ${
            guide.location?.city || ''
          }, ${guide.location?.state || ''}</div>
        </div>
      </div>

      <div class="trip-box">
        <h3>Trip Report</h3>
        <p><strong>Date:</strong> ${
          trip.date || new Date().toLocaleDateString()
        }</p>
        <p><strong>Location:</strong> ${trip.location || 'N/A'}</p>
        <p><strong>Duration:</strong> ${trip.duration || 'N/A'}</p>
        <p><strong>Guests:</strong> ${trip.guestNames?.join(', ') || 'N/A'}</p>
        <p><strong>Conditions:</strong> ${trip.conditions || 'N/A'}</p>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-val">${catches.length}</div>
          <div class="stat-label">Total Catches</div>
        </div>
        <div class="stat">
          <div class="stat-val">${
            new Set(catches.map(c => c.species)).size
          }</div>
          <div class="stat-label">Species</div>
        </div>
        <div class="stat">
          <div class="stat-val">${catches.reduce(
            (max, c) => Math.max(max, c.weight || 0),
            0,
          )} lb</div>
          <div class="stat-label">Biggest Catch</div>
        </div>
      </div>

      <h3>Catch Log</h3>
      <table>
        <thead>
          <tr><th>Time</th><th>Species</th><th>Weight</th><th>Length</th><th>Method</th></tr>
        </thead>
        <tbody>${catchRows}</tbody>
      </table>

      ${trip.notes ? `<h3>Captain's Notes</h3><p>${trip.notes}</p>` : ''}

      <div class="footer">
        Report by ${
          guide.displayName || 'ProFish Guide'
        } | Generated with ProFish Pro
      </div>
    </body>
    </html>
  `;
}

// ── Booking Flow (#414) ──────────────────────────────────

export function createBooking(data) {
  return {
    listingId: data.listingId,
    listingType: data.listingType, // guide or charter
    providerId: data.providerId,
    customerId: data.customerId,
    customerName: data.customerName,
    // Trip details
    date: data.date,
    startTime: data.startTime,
    tripType: data.tripType, // half_day, full_day, etc.
    groupSize: data.groupSize || 1,
    targetSpecies: data.targetSpecies || [],
    specialRequests: data.specialRequests || '',
    // Payment
    price: data.price || 0,
    deposit: data.deposit || 0,
    currency: data.currency || 'USD',
    stripePaymentId: null,
    // Status
    status: BOOKING_STATUS.PENDING,
    // Metadata
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Main Marketplace Service ─────────────────────────────

const CACHE_KEY = '@profish_marketplace_cache';

const marketplaceService = {
  // ── Gear Listings (#412) ────────────────────

  /**
   * Create a gear listing
   */
  async createGearListing(data) {
    const listing = createGearListing(data);
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      const ref = await firestore().collection('marketplace_gear').add(listing);
      return { success: true, id: ref.id, listing };
    } catch (e) {
      console.warn('[Marketplace] Create gear listing error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Get gear listings with filters
   */
  async getGearListings(filters = {}) {
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      let query = firestore()
        .collection('marketplace_gear')
        .where('status', '==', LISTING_STATUS.ACTIVE)
        .orderBy('createdAt', 'desc')
        .limit(filters.limit || 20);

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.maxPrice) {
        query = query.where('price', '<=', filters.maxPrice);
      }

      const snap = await query.get();
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Location filter (#418)
      if (filters.latitude && filters.longitude && filters.radius) {
        results = results.filter(r => {
          if (!r.location?.latitude) return false;
          const dist = haversineDistance(
            filters.latitude,
            filters.longitude,
            r.location.latitude,
            r.location.longitude,
          );
          return dist <= filters.radius;
        });
      }

      return results;
    } catch (e) {
      console.warn('[Marketplace] Get gear listings error:', e);
      return [];
    }
  },

  // ── Guide Profiles (#413) ──────────────────

  async createGuideProfile(data) {
    const profile = createGuideProfile(data);
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      await firestore()
        .collection('marketplace_guides')
        .doc(data.userId)
        .set(profile);
      return { success: true, profile };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getGuides(filters = {}) {
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      let query = firestore()
        .collection('marketplace_guides')
        .where('status', '==', LISTING_STATUS.ACTIVE)
        .orderBy('avgRating', 'desc')
        .limit(filters.limit || 20);

      const snap = await query.get();
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Location filter (#418)
      if (filters.latitude && filters.longitude && filters.radius) {
        results = results.filter(r => {
          if (!r.location?.latitude) return false;
          const dist = haversineDistance(
            filters.latitude,
            filters.longitude,
            r.location.latitude,
            r.location.longitude,
          );
          return dist <= (r.location.serviceRadius || filters.radius);
        });
      }

      // Species filter
      if (filters.species) {
        results = results.filter(r => r.specialties?.includes(filters.species));
      }

      return results;
    } catch (e) {
      return [];
    }
  },

  // ── Charter Listings (#414) ────────────────

  async createCharterListing(data) {
    const listing = createCharterListing(data);
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      const ref = await firestore()
        .collection('marketplace_charters')
        .add(listing);
      return { success: true, id: ref.id, listing };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getCharters(filters = {}) {
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      let query = firestore()
        .collection('marketplace_charters')
        .where('status', '==', LISTING_STATUS.ACTIVE)
        .orderBy('avgRating', 'desc')
        .limit(filters.limit || 20);

      const snap = await query.get();
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Location filter (#418)
      if (filters.latitude && filters.longitude && filters.radius) {
        results = results.filter(r => {
          if (!r.location?.latitude) return false;
          const dist = haversineDistance(
            filters.latitude,
            filters.longitude,
            r.location.latitude,
            r.location.longitude,
          );
          return dist <= filters.radius;
        });
      }

      return results;
    } catch (e) {
      return [];
    }
  },

  // ── Bookings (#414) ────────────────────────

  async createBooking(data) {
    const booking = createBooking(data);
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      const ref = await firestore()
        .collection('marketplace_bookings')
        .add(booking);
      return { success: true, id: ref.id, booking };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getMyBookings(userId) {
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      const snap = await firestore()
        .collection('marketplace_bookings')
        .where('customerId', '==', userId)
        .orderBy('date', 'desc')
        .limit(50)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  },

  // ── Reviews (#416) ─────────────────────────

  async addReview(data) {
    const review = createReview(data);
    try {
      const firestore = require('@react-native-firebase/firestore').default;

      // Add review
      const ref = await firestore()
        .collection('marketplace_reviews')
        .doc(data.listingId)
        .collection('reviews')
        .add(review);

      // Update listing avg rating
      const collectionName = `marketplace_${data.listingType}s`;
      const reviewsSnap = await firestore()
        .collection('marketplace_reviews')
        .doc(data.listingId)
        .collection('reviews')
        .where('approved', '==', true)
        .get();

      const reviews = reviewsSnap.docs.map(d => d.data());
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      await firestore()
        .collection(collectionName)
        .doc(data.listingId)
        .update({
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        });

      return { success: true, id: ref.id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getReviews(listingId, limit = 20) {
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      const snap = await firestore()
        .collection('marketplace_reviews')
        .doc(listingId)
        .collection('reviews')
        .where('approved', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  },

  // ── Stripe Connect (#415) ──────────────────

  /**
   * Create Stripe Connect onboard link for guide/charter
   */
  async createStripeAccount(userId) {
    try {
      // Cloud function call to create Stripe Connect account
      const response = await fetch(
        __DEV__
          ? 'http://localhost:3001/api/v1/stripe/create-account'
          : 'https://api.profishapp.com/v1/stripe/create-account',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        },
      );
      const data = await response.json();
      return data; // { accountId, onboardingUrl }
    } catch (e) {
      return { error: e.message };
    }
  },

  /**
   * Process payment for a booking
   */
  async processBookingPayment(bookingId, amount, stripeAccountId) {
    try {
      const response = await fetch(
        __DEV__
          ? 'http://localhost:3001/api/v1/stripe/payment'
          : 'https://api.profishapp.com/v1/stripe/payment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            amount,
            currency: 'usd',
            destination: stripeAccountId, // Stripe Connect destination
            applicationFee: Math.round(amount * 0.1), // 10% platform fee
          }),
        },
      );
      return await response.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  // ── Affiliate Links (#417) ─────────────────

  affiliate: affiliateService,

  // ── Guide Reports (#419) ───────────────────

  generateGuideReport(guide, trip, catches) {
    return generateGuideReportHtml(guide, trip, catches);
  },

  // ── Location Search (#418) ─────────────────

  /**
   * Search all marketplace listings near a location
   */
  async searchNearby(latitude, longitude, radius = 25, types = null) {
    const searchTypes = types || [LISTING_TYPE.GUIDE, LISTING_TYPE.CHARTER];
    const results = {};

    if (searchTypes.includes(LISTING_TYPE.GUIDE)) {
      results.guides = await this.getGuides({ latitude, longitude, radius });
    }
    if (searchTypes.includes(LISTING_TYPE.CHARTER)) {
      results.charters = await this.getCharters({
        latitude,
        longitude,
        radius,
      });
    }
    if (searchTypes.includes(LISTING_TYPE.GEAR)) {
      results.gear = await this.getGearListings({
        latitude,
        longitude,
        radius,
      });
    }

    return results;
  },
};

export default marketplaceService;
