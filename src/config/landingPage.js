/**
 * Landing Page Configuration (#469)
 *
 * Content and metadata for profish.app landing page.
 * Can be used by a static site generator (Next.js, Astro, etc.)
 * or rendered in a WebView for in-app "About" screen.
 */

const LANDING_PAGE = {
  domain: 'profish.app',
  tagline: 'Your AI-Powered Fishing Companion',
  heroSubtitle:
    'FishCast scores, 18 map layers, AI species ID, offline maps — all in one app.',

  appStoreLinks: {
    ios: 'https://apps.apple.com/app/profish/id_PLACEHOLDER',
    android: 'https://play.google.com/store/apps/details?id=com.profish.app',
  },

  features: [
    {
      icon: '🎯',
      title: 'FishCast Score',
      description:
        'Real-time fishing conditions rated 0-100 based on 8 factors including barometric pressure, solunar, tide, and wind.',
    },
    {
      icon: '🗺️',
      title: '18 Map Layers',
      description:
        'Bathymetry, SST, chlorophyll, nautical charts, tide stations, fish hotspots — stack layers with a CPU budget system.',
    },
    {
      icon: '🤖',
      title: 'AI Species ID',
      description:
        'Snap a photo and instantly identify your catch from 200+ species. Works offline with on-device TFLite model.',
    },
    {
      icon: '📊',
      title: 'Catch Analytics',
      description:
        'Track every catch with species, weight, conditions. Export to PDF/CSV. See your personal bests and monthly trends.',
    },
    {
      icon: '🌊',
      title: 'Tide & Solunar',
      description:
        'Global tide predictions (NOAA + WorldTides) and solunar feeding windows. Know when fish are biting.',
    },
    {
      icon: '📴',
      title: 'Offline Maps',
      description:
        'Download map packs for your fishing region. Works without cell service — essential for remote spots.',
    },
    {
      icon: '🌍',
      title: '24 Languages',
      description:
        'Fully localized in English, Spanish, Arabic, Japanese, and 20 more. Fish anywhere in the world.',
    },
    {
      icon: '🏆',
      title: 'Tournaments & Leaderboards',
      description:
        'Compete in fishing tournaments. Anti-cheat photo verification. Species-specific leaderboards.',
    },
  ],

  pricing: {
    free: {
      name: 'Free',
      price: '$0',
      features: [
        '5 catches/month',
        '1-day FishCast',
        '6 map layers',
        'Weather & solunar',
        '5 AI IDs/day',
      ],
    },
    pro: {
      name: 'Pro',
      priceMonthly: '$7.99/mo',
      priceYearly: '$59.99/yr',
      savings: 'Save 37%',
      features: [
        'Unlimited catches',
        '7-day FishCast',
        'All 18 map layers',
        'Offline maps',
        'Unlimited AI species ID',
        'Catch statistics & export',
        'No ads',
      ],
    },
  },

  seo: {
    title: 'ProFish — AI-Powered Fishing App | FishCast, Maps, Species ID',
    description:
      'The ultimate fishing companion. Real-time FishCast scores, 18 map layers, AI species identification, offline maps, and catch logging for anglers worldwide.',
    keywords: [
      'fishing app',
      'fishcast',
      'fishing conditions',
      'tide predictions',
      'solunar tables',
      'fishing map',
      'species identification',
      'catch log',
      'fishing weather',
      'bathymetry map',
      'offshore fishing',
      'bass fishing app',
    ],
    ogImage: 'https://profish.app/og-image.png',
  },

  socialProof: {
    stats: [
      { value: '200+', label: 'Fish Species' },
      { value: '18', label: 'Map Layers' },
      { value: '24', label: 'Languages' },
      { value: '12', label: 'Global Regions' },
    ],
  },
};

export default LANDING_PAGE;
