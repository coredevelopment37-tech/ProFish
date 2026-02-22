/**
 * Marketing & Social Media Plan (#470, #471, #472, #473, #481, #482)
 *
 * Social accounts, content plan, press release template,
 * ASO keywords, influencer outreach targets.
 */

const MARKETING_PLAN = {
  // ── Social Media Accounts (#470) ─────────────────
  socialAccounts: {
    instagram: '@profishapp',
    tiktok: '@profishapp',
    youtube: '@ProFishApp',
    facebook: '/ProFishApp',
    x: '@ProFishApp',
    reddit: 'r/ProFishApp',
  },

  // ── App Store Preview Video (#471) ───────────────
  previewVideo: {
    duration: '30 seconds',
    format: '1080x1920 (portrait) for App Store, 1920x1080 for Google Play',
    scenes: [
      { time: '0-5s', content: 'ProFish logo + tagline animation' },
      { time: '5-10s', content: 'FishCast score on map with weather overlay' },
      {
        time: '10-15s',
        content: 'Layer toggling: bathymetry + SST + catch markers',
      },
      {
        time: '15-20s',
        content: 'AI species ID: photo → instant identification',
      },
      { time: '20-25s', content: 'Catch log feed with photos + stats chart' },
      { time: '25-28s', content: 'Offline maps download + solunar table' },
      {
        time: '28-30s',
        content: 'CTA: Download Free on App Store / Google Play',
      },
    ],
    music: 'Upbeat acoustic/adventure — royalty-free',
    voiceover: false,
    textOverlays: true,
  },

  // ── Press Release (#472) ─────────────────────────
  pressRelease: {
    headline:
      'ProFish Launches: AI-Powered Fishing App with Real-Time FishCast Scores and 18 Map Layers',
    subheadline:
      'Free app brings professional-grade fishing intelligence to anglers worldwide',
    releaseDate: 'TBD',
    body: [
      'ProFish, a new AI-powered fishing companion app, launches today on iOS and Android. The app combines real-time weather data, tide predictions, solunar tables, and barometric pressure analysis into a single FishCast score (0-100) that tells anglers when conditions are best for fishing.',
      'Key features include 18 stackable map layers (bathymetry, sea surface temperature, chlorophyll, nautical charts), AI species identification from photos (200+ species), offline map packs for areas without cell coverage, and a catch logging system with cloud sync.',
      'ProFish is free to use with a Pro subscription ($7.99/month or $59.99/year) unlocking unlimited catches, all map layers, 7-day forecasts, offline maps, and advanced analytics. The app supports 24 languages and covers 12 global fishing regions.',
      'Built by anglers for anglers, ProFish is available for download on the Apple App Store and Google Play Store.',
    ],
    mediaContact: 'press@profish.app',
    pressKit: 'https://profish.app/press',
  },

  // ── ASO Screenshots (#473) ──────────────────────
  asoScreenshots: {
    count: 6,
    style: 'Lifestyle mockup with phone frame + overlay text',
    screens: [
      {
        title: 'Know When Fish Are Biting',
        subtitle: 'FishCast score rates conditions 0-100',
        screen: 'HomeScreen with FishCast overlay',
        bgColor: '#0F3460',
      },
      {
        title: '18 Map Layers at Your Fingertips',
        subtitle: 'Bathymetry, SST, currents & more',
        screen: 'MapScreen with 3 layers active',
        bgColor: '#1A1A2E',
      },
      {
        title: 'AI Species Identification',
        subtitle: 'Snap a photo, know your catch',
        screen: 'AI ID result showing Largemouth Bass 94% confidence',
        bgColor: '#16213E',
      },
      {
        title: 'Log Every Catch',
        subtitle: 'Weight, length, conditions — all tracked',
        screen: 'CatchDetailScreen with full data',
        bgColor: '#E94560',
      },
      {
        title: 'Fish Offline',
        subtitle: 'Download maps for areas without signal',
        screen: 'OfflineMapScreen with downloaded packs',
        bgColor: '#0F3460',
      },
      {
        title: 'Tides & Solunar Tables',
        subtitle: 'Global tide predictions + feeding windows',
        screen: 'TideScreen with chart',
        bgColor: '#1A1A2E',
      },
    ],
    asoKeywords: [
      'fishing',
      'fish forecast',
      'tide chart',
      'fishing weather',
      'fishing map',
      'catch log',
      'fish identifier',
      'solunar',
      'fishing conditions',
      'offshore fishing',
      'bass fishing',
      'saltwater fishing',
      'freshwater fishing',
      'fishing spots',
    ],
  },

  // ── Influencer Outreach (#481) ──────────────────
  influencerTargets: [
    {
      name: 'Jon B.',
      platform: 'YouTube',
      subscribers: '6M+',
      niche: 'Bass fishing',
    },
    {
      name: 'BlacktipH',
      platform: 'YouTube',
      subscribers: '5M+',
      niche: 'Saltwater/sharks',
    },
    {
      name: 'Fishing with Norm',
      platform: 'YouTube',
      subscribers: '1M+',
      niche: 'Multi-species',
    },
    {
      name: '1Rod1ReelFishing',
      platform: 'YouTube',
      subscribers: '3M+',
      niche: 'Versatile fishing',
    },
    {
      name: 'Tactical Bassin',
      platform: 'YouTube',
      subscribers: '700K+',
      niche: 'Bass technique',
    },
    {
      name: 'Salt Strong',
      platform: 'YouTube/Website',
      subscribers: '500K+',
      niche: 'Inshore saltwater',
    },
    {
      name: 'Dude Perfect (fishing eps)',
      platform: 'YouTube',
      subscribers: '60M+',
      niche: 'Entertainment fishing',
    },
    {
      name: 'LunkersTV',
      platform: 'YouTube',
      subscribers: '2M+',
      niche: 'Bass fishing',
    },
    {
      name: 'Dophin Fishing',
      platform: 'TikTok',
      subscribers: '2M+',
      niche: 'Offshore fishing',
    },
    {
      name: 'FishingBoosted',
      platform: 'Instagram',
      subscribers: '300K+',
      niche: 'Fly fishing',
    },
  ],
  outreachTemplate: `Hi [Name],\n\nI'm [Your Name] from ProFish — a new AI-powered fishing app launching soon. We'd love for you to try it out and share your thoughts with your audience.\n\nProFish offers real-time FishCast scores, 18 map layers, and AI species ID — all free.\n\nWould you be interested in a sponsored review or partnership?\n\nBest,\n[Your Name]\npress@profish.app`,

  // ── Review Sites (#482) ─────────────────────────
  reviewSites: [
    {
      name: 'OutdoorGearLab',
      url: 'https://www.outdoorgearlab.com',
      contact: 'editorial@outdoorgearlab.com',
    },
    {
      name: 'Field & Stream',
      url: 'https://www.fieldandstream.com',
      contact: 'tips@fieldandstream.com',
    },
    {
      name: 'Sport Fishing Magazine',
      url: 'https://www.sportfishingmag.com',
      contact: 'editor@sportfishingmag.com',
    },
    {
      name: 'Wired Outdoors',
      url: 'https://www.wired.com',
      contact: 'pitches@wired.com',
    },
    {
      name: 'TechCrunch (app launches)',
      url: 'https://techcrunch.com',
      contact: 'tips@techcrunch.com',
    },
    {
      name: 'Product Hunt',
      url: 'https://producthunt.com',
      notes: 'Schedule Ship page 1 week before launch',
    },
    {
      name: 'AppAdvice',
      url: 'https://appadvice.com',
      contact: 'tips@appadvice.com',
    },
    {
      name: 'Bassmaster Magazine',
      url: 'https://www.bassmaster.com',
      contact: 'editorial@bassmaster.com',
    },
  ],
};

export default MARKETING_PLAN;
