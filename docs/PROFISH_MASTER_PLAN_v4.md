# ProFish Master Plan v4.0 — "Global Domination"

> **Version:** 4.0 · **Refined:** 2026-02-21  
> **Mission:** Build the world's best fishing app for 260M+ anglers. All countries, 24 languages, day one.  
> **Philosophy:** _"The goal is aggressive and clear — to be the best, largest, and the only one that counts."_

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Budget & Cost Model](#2-budget--cost-model)
3. [Architecture & Tech Stack](#3-architecture--tech-stack)
4. [Phase 1: MVP Launch (Weeks 1-6)](#4-phase-1-mvp-launch)
5. [Phase 2: Growth (Weeks 7-14)](#5-phase-2-growth)
6. [Phase 3: Dominance (Weeks 15+)](#6-phase-3-dominance)
7. [Feature Deep Dives](#7-feature-deep-dives)
8. [24-Language Strategy](#8-24-language-strategy)
9. [12 Target Regions](#9-12-target-regions)
10. [Subscription & Monetization](#10-subscription--monetization)
11. [Free Data Stack](#11-free-data-stack)
12. [Map System (18 Layers)](#12-map-system-18-layers)
13. [Species Database](#13-species-database)
14. [Marketing & Launch Strategy](#14-marketing--launch-strategy)
15. [Revenue Projections](#15-revenue-projections)
16. [Competitive Analysis](#16-competitive-analysis)
17. [Risk Mitigation](#17-risk-mitigation)
18. [Scale Triggers](#18-scale-triggers)
19. [KPIs & Success Metrics](#19-kpis--success-metrics)

---

## 1. Executive Summary

ProFish is the world's first truly global fishing app — launching in 24 languages across 100+ countries simultaneously. While competitors (Fishbrain, Fishidy, Anglr) focus on US/EU markets with English-first apps, ProFish targets the full 260M angler market with localized experiences from day one.

**Core innovation:** Zero-cost data stack (Open-Meteo, NOAA, GEBCO, Copernicus, FishBase) + AI-driven development keeping total Year 1 costs under $5,000.

**Key metrics targets:**

- Month 3: 1K MAU, 3% paid → $150 MRR
- Month 6: 5K MAU, 4% paid → $1,000 MRR
- Month 12: 25K MAU, 5% paid → $6,250 MRR
- Month 18: 100K MAU, 6% paid → $30,000 MRR

---

## 2. Budget & Cost Model

### Year 1 Breakdown

| Item             | Monthly | Annual              | Notes                         |
| ---------------- | ------- | ------------------- | ----------------------------- |
| Apple Developer  | —       | $99                 | Required for App Store        |
| Google Play      | —       | $25                 | One-time                      |
| AWS (us-east-1)  | $60-270 | $720-3,240          | Single region, CloudFront CDN |
| WorldTides API   | ~$100   | ~$1,200             | With 6hr cache + 2-day cap    |
| Mapbox           | $0      | $0                  | Free tier (25K MAU)           |
| Firebase         | $0      | $0                  | Free tier (Spark plan)        |
| RevenueCat       | $0      | $0                  | Free tier (<$2.5K MRR)        |
| Sentry           | $0      | $0                  | Free tier                     |
| Domain + misc    | —       | ~$50                | profish.app                   |
| **Total Year 1** |         | **$2,100 - $4,600** |                               |

### Cost Progression

| MAU   | AWS  | WorldTides | Mapbox | Firebase | Monthly Total |
| ----- | ---- | ---------- | ------ | -------- | ------------- |
| <1K   | $60  | $100       | $0     | $0       | ~$160         |
| 1-5K  | $100 | $100       | $0     | $0       | ~$200         |
| 5-25K | $170 | $100       | $0     | $0       | ~$270         |
| 25K+  | $270 | $100       | $250+  | $25+     | ~$645+        |

---

## 3. Architecture & Tech Stack

### Client

| Layer         | Technology                          | Version                |
| ------------- | ----------------------------------- | ---------------------- |
| Framework     | React Native                        | 0.83.1                 |
| Navigation    | @react-navigation/native            | v7                     |
| Maps          | @rnmapbox/maps                      | Latest                 |
| Auth          | @react-native-firebase/auth         | Latest                 |
| Database      | @react-native-firebase/firestore    | Latest                 |
| Local Storage | @react-native-async-storage         | Latest                 |
| Subscriptions | react-native-purchases (RevenueCat) | v8                     |
| i18n          | i18next + react-i18next             | Latest                 |
| Animations    | react-native-reanimated             | v4                     |
| Icons         | react-native-vector-icons           | MaterialCommunityIcons |
| Config        | react-native-config                 | Latest                 |

### Backend

| Service         | Provider            | Tier             |
| --------------- | ------------------- | ---------------- |
| Authentication  | Firebase Auth       | Spark (free)     |
| User Database   | Cloud Firestore     | Spark (free)     |
| Weather         | Open-Meteo          | Free (unlimited) |
| Tides (Global)  | WorldTides          | Paid (~$100/mo)  |
| Tides (US/NOAA) | NOAA CO-OPS         | Free (unlimited) |
| Bathymetry      | GEBCO               | Free (open data) |
| Nautical Charts | NOAA RNC            | Free (open data) |
| SST             | Copernicus/Sentinel | Free (open data) |
| Species         | FishBase            | Free (open data) |
| CDN             | CloudFront          | AWS              |
| Subscriptions   | RevenueCat          | Free tier        |
| Crash Reports   | Sentry              | Free tier        |
| Analytics       | Firebase Analytics  | Free             |

### Architecture Principles

1. **Offline-first:** AsyncStorage primary, Firestore sync when online
2. **Single region:** us-east-1 until scale triggers hit
3. **Zero-cost data:** All scientific data from free/open sources
4. **Code sharing:** Matching ProHunt architecture for reuse
5. **Progressive enhancement:** Free tier is genuinely useful

---

## 4. Phase 1: MVP Launch (Weeks 1-6)

### 4.1 FishCast — Weighted Prediction Algorithm

**0-100 score** — catches correlated to 8 environmental factors:

| Factor              | Weight | Data Source         | Algorithm                                              |
| ------------------- | ------ | ------------------- | ------------------------------------------------------ |
| Barometric Pressure | 20%    | Open-Meteo          | Falling = best, stable = good, rising = fair           |
| Moon Phase          | 15%    | Astronomy calc      | New/Full = high, Quarter = moderate                    |
| Solunar Periods     | 15%    | Sun/Moon calc       | Major periods (2hr) = 100%, Minor (1hr) = 60%          |
| Wind Speed          | 12%    | Open-Meteo          | 5-15 km/h = best, calm/strong = poor                   |
| Time of Day         | 12%    | Sunrise/Sunset calc | Dawn/Dusk golden hours = peak                          |
| Tide Phase          | 10%    | WorldTides/NOAA     | Rising/2hr-before-high = best for coast                |
| Cloud Cover         | 8%     | Open-Meteo          | Overcast = best, clear midday = worst                  |
| Precipitation       | 8%     | Open-Meteo          | Light rain = good, heavy = bad, post-front = excellent |

**Output:** Score (0-100), color rating (green/yellow/orange/red), factor breakdown, best times today, summary text.

**Free tier:** Today only, basic score.  
**Pro tier:** 7-day forecast, hourly breakdown, factor details, notifications.

### 4.2 Interactive Map — 18 Layers

Full specification in [`PROFISH_MAP_SPEC.md`](PROFISH_MAP_SPEC.md).

Key features:

- Mapbox GL with Dark/Satellite base styles
- 18 fishing-specific overlay layers (bathymetry, nautical, SST, chlorophyll, etc.)
- CPU budget system (max 10 simultaneous layers)
- Layer picker with subscription tier gating
- Catch markers with clustering
- GPS tracking with follow mode
- Weather card overlay
- Search bar (location, species, spots)
- Offline map packs (Pro+)

### 4.3 Catch Logging

**Fields:**

- Species (autocomplete from 56-species database)
- Weight (kg/lbs toggle based on user units preference)
- Length (cm/in toggle)
- GPS (auto-captured)
- Photo (camera or gallery)
- Bait/Lure used
- Method (8 options: Spinning, Fly, Trolling, Jigging, Bottom, Surfcasting, Handline, Spearfishing, Other)
- Water type (Fresh/Salt/Brackish)
- Weather conditions (auto-captured from Open-Meteo at log time)
- Released? (yes/no toggle)
- Notes (free text)
- Date/time (defaults to now)

**Storage:**

- AsyncStorage (immediate, offline)
- Firestore sync (background, when connected)
- Conflict resolution: last-write-wins with device timestamp

### 4.4 Species Database

56 species across 5 habitat types:

| Habitat     | Count | Examples                                                                |
| ----------- | ----- | ----------------------------------------------------------------------- |
| Freshwater  | 18    | Largemouth Bass, Rainbow Trout, Northern Pike, Walleye, Channel Catfish |
| Saltwater   | 22    | Striped Bass, Bluefin Tuna, Mahi-Mahi, Red Snapper, Tarpon              |
| Brackish    | 4     | Snook, Redfish, Flounder, Spotted Seatrout                              |
| Anadromous  | 8     | Atlantic Salmon, Chinook Salmon, Steelhead, Sea Trout, American Shad    |
| Catadromous | 4     | European Eel, American Eel, Japanese Eel, Barramundi                    |

Each species includes: common name, scientific name, habitat type, regions, typical size range, record sizes, preferred baits, seasonal patterns.

### 4.5 Navigation Structure

```
App
├── AuthStack (unauthenticated)
│   ├── WelcomeScreen
│   └── AuthScreen (Google / Apple / Anonymous)
├── MainTabs (authenticated)
│   ├── FishCast Tab (home)
│   │   └── FishCastScreen
│   ├── Map Tab
│   │   └── MapScreen
│   ├── Log Catch Tab (center, prominent)
│   │   └── LogCatchScreen (modal)
│   ├── Catches Tab
│   │   ├── CatchesScreen (list)
│   │   └── CatchDetailScreen
│   ├── Community Tab
│   │   └── CommunityScreen
│   └── Profile Tab
│       ├── ProfileScreen
│       └── PaywallModal
└── Species Modal
    └── SpeciesDetailScreen
```

### 4.6 Shared Components (9)

| Component       | Purpose                                    |
| --------------- | ------------------------------------------ |
| LoadingOverlay  | Full-screen spinner with optional message  |
| ErrorBoundary   | Crash recovery with "Try Again" button     |
| FishScoreCircle | Animated circular score (0-100) with color |
| SpeciesPicker   | Autocomplete search + modal list           |
| LayerPicker     | Map layer selector with budget indicator   |
| WeatherCard     | Compact current conditions overlay         |
| PaywallModal    | Subscription upgrade with RevenueCat       |
| BottomSheet     | Reusable draggable bottom sheet            |
| CatchCard       | Catch list item with photo + stats         |

---

## 5. Phase 2: Growth (Weeks 7-14)

### 5.1 Social/Community

- User profiles (avatar, bio, stats, public catches)
- Community feed (nearby catches, top anglers, species feeds)
- Like, comment, share interactions
- "Catch of the Day/Week" featured content
- Privacy controls (public/friends/private catches)

### 5.2 Tournament System

- Create/join tournaments (species, location, dates)
- Live leaderboard with real-time updates
- Photo verification requirement
- Prize descriptions and sponsor logos
- Tournament history and stats

### 5.3 Advanced Analytics

- Personal bests dashboard
- Species heatmaps (where you catch what)
- Catch rate over time (charts)
- Best conditions analysis (when you catch most)
- Seasonal patterns insights
- Export to CSV/PDF

### 5.4 Team & Guide Tiers

- **Team ($149.99/yr):** Shared catches, team leaderboard, group chat
- **Guide ($249.99/yr):** Client management, branded catch reports, booking calendar, group sessions

### 5.5 Offline Data

- Offline map region packs (downloaded via Mapbox)
- Offline species database (full data cached)
- Offline catch logging (always available)
- Offline FishCast (cached recent forecasts)
- Background sync when reconnected

---

## 6. Phase 3: Dominance (Weeks 15+)

### 6.1 AI Species Identification

- Camera-based species recognition
- Real-time object detection with bounding box
- Confidence percentage + top-3 suggestions
- Auto-populates catch log
- Training pipeline from community catch photos

### 6.2 Marketplace

- Gear listings (buy/sell/trade)
- Guide directory (searchable by location/species)
- Charter booking integration
- Gear recommendations based on catch history
- Affiliate revenue from gear brands

### 6.3 AR Features

- AR catch measurement (length/weight estimation from photo)
- AR navigation to fishing spots
- AR species overlay on camera feed

### 6.4 Advanced Map Features

- Live AIS boat tracking overlay
- Real-time weather radar
- Current and wave direction visualization
- Community hot-spot heat layer (anonymized)
- 3D bathymetry viewer

### 6.5 Branded Guide Reports

- Custom-branded PDF catch reports
- Client emailing integration
- QR code validation
- Photo gallery with watermark
- Seasonal summaries for charter marketing

---

## 7. Feature Deep Dives

### 7.1 FishCast Score Calculation

```
finalScore = Σ (factor_score × factor_weight)

where each factor_score = f(raw_data) → 0-100

Example — February morning, Stockholm coast:
  Pressure:    1008 hPa, falling slowly    → 80 × 0.20 = 16.0
  Moon:        Waxing gibbous (70%)        → 55 × 0.15 =  8.25
  Solunar:     Minor period (within 1hr)   → 60 × 0.15 =  9.0
  Wind:        12 km/h SW                  → 85 × 0.12 = 10.2
  Time:        07:15 (30min after sunrise) → 95 × 0.12 = 11.4
  Tide:        Rising, 1hr before high     → 90 × 0.10 =  9.0
  Cloud:       Overcast (85%)              → 75 × 0.08 =  6.0
  Precip:      Light drizzle (0.3mm/hr)    → 70 × 0.08 =  5.6
  ─────────────────────────────────────────────────────
  TOTAL:                                      75.45 → "Good"
```

**Score ranges:**

- 80-100: Excellent (green) — "Fish are biting!"
- 60-79: Good (yellow-green) — "Good conditions"
- 40-59: Fair (orange) — "Average day"
- 20-39: Poor (red-orange) — "Tough fishing"
- 0-19: Very Poor (red) — "Stay home"

### 7.2 Offline-First Sync Architecture

```
User action → Write to AsyncStorage immediately
           → Queue sync operation
           → Background: when online, push to Firestore
           → Firestore listener: pull remote changes
           → Merge strategy: last-write-wins (device timestamp)
           → Conflict UI: none (silent merge)

Data priority:
  1. Catches → always sync (critical user data)
  2. Settings → sync on change (language, units)
  3. Species favorites → sync on change
  4. Map bookmarks → sync on change
```

### 7.3 Subscription Gate Logic

```
Feature access check:
  1. Read user.subscription.tier from state
  2. Check feature → tier mapping
  3. If allowed → render feature
  4. If blocked → show PaywallModal with upgrade CTA

Catch limit check:
  1. Count catches this calendar month
  2. Free tier: if count >= 5, block + show paywall
  3. Pro+: unlimited

Layer access check:
  1. Each layer has .minTier property
  2. LayerPicker grays out + shows lock icon for inaccessible layers
  3. Tap locked layer → PaywallModal
```

---

## 8. 24-Language Strategy

### Quality Tiers

| Tier       | Languages                                                             | Quality             | Review Process          |
| ---------- | --------------------------------------------------------------------- | ------------------- | ----------------------- |
| **Gold**   | English, Swedish, Norwegian, German, French, Spanish, Portuguese (BR) | Human-quality       | Native speaker review   |
| **Silver** | Arabic (RTL), Japanese, Korean, Finnish, Danish, Dutch, Italian       | AI + careful review | AI + native spot-check  |
| **Bronze** | Polish, Czech, Turkish, Russian, Thai                                 | AI-generated        | AI + community feedback |
| **Copper** | Indonesian, Malay, Vietnamese, Hindi, Filipino                        | AI-generated        | Community-improvable    |

### Language Files

All 24 locale files live in `src/locales/`:

| Code    | Language            | Tier   | ~Keys | RTL     |
| ------- | ------------------- | ------ | ----- | ------- |
| `en`    | English             | Gold   | 150   | No      |
| `sv`    | Swedish             | Gold   | 150   | No      |
| `no`    | Norwegian           | Gold   | 150   | No      |
| `de`    | German              | Gold   | 150   | No      |
| `fr`    | French              | Gold   | 150   | No      |
| `es`    | Spanish             | Gold   | 150   | No      |
| `pt-BR` | Portuguese (Brazil) | Gold   | 150   | No      |
| `ar`    | Arabic              | Silver | 150   | **Yes** |
| `ja`    | Japanese            | Silver | 150   | No      |
| `ko`    | Korean              | Silver | 150   | No      |
| `fi`    | Finnish             | Silver | 150   | No      |
| `da`    | Danish              | Silver | 150   | No      |
| `nl`    | Dutch               | Silver | 150   | No      |
| `it`    | Italian             | Silver | 150   | No      |
| `pl`    | Polish              | Bronze | 150   | No      |
| `cs`    | Czech               | Bronze | 150   | No      |
| `tr`    | Turkish             | Bronze | 150   | No      |
| `ru`    | Russian             | Bronze | 150   | No      |
| `th`    | Thai                | Bronze | 150   | No      |
| `id`    | Indonesian          | Copper | 150   | No      |
| `ms`    | Malay               | Copper | 150   | No      |
| `vi`    | Vietnamese          | Copper | 150   | No      |
| `hi`    | Hindi               | Copper | 150   | No      |
| `fil`   | Filipino            | Copper | 150   | No      |

### Translation Key Categories (~150 keys)

| Category      | Keys | Examples                                                        |
| ------------- | ---- | --------------------------------------------------------------- |
| `common.*`    | ~20  | save, cancel, delete, confirm, search, close, loading, error    |
| `tabs.*`      | 5    | fishcast, map, logCatch, catches, community, profile            |
| `fishcast.*`  | ~20  | score, pressure, moon, wind, tide, humidity, summary, factors   |
| `map.*`       | ~15  | title, layers, satellite, follow, search, offline, markers      |
| `catch.*`     | ~20  | species, weight, length, photo, bait, method, released, notes   |
| `catches.*`   | ~10  | total, thisMonth, noCatches, personalBest, species              |
| `species.*`   | ~10  | freshwater, saltwater, brackish, anadromous, catadromous        |
| `community.*` | ~10  | feed, nearby, topAnglers, share, like, comment                  |
| `profile.*`   | ~15  | language, units, signOut, deleteAccount, notifications, version |
| `paywall.*`   | ~15  | title, pro, team, guide, features, subscribe, restore, trial    |
| `auth.*`      | ~10  | signIn, signUp, google, apple, anonymous, error                 |

### RTL Support (Arabic)

- `I18nManager.forceRTL(true)` when Arabic selected
- All layouts use `flexDirection` + `textAlign` that auto-flip
- Test coverage for RTL in all screens

### Community Translation System (Phase 2)

- Users can suggest translation improvements
- Voting system for best translations
- Moderated by native speakers per language
- Monthly translation update releases

---

## 9. 12 Target Regions

| Region                   | Key Markets                                         | Language(s)         | Angler Population |
| ------------------------ | --------------------------------------------------- | ------------------- | ----------------- |
| **NA** (North America)   | US, Canada                                          | EN, FR, ES          | ~50M              |
| **EU** (Europe)          | UK, Ireland                                         | EN                  | ~10M              |
| **NORDICS**              | Sweden, Norway, Finland, Denmark                    | SV, NO, FI, DA      | ~5M               |
| **DACH**                 | Germany, Austria, Switzerland                       | DE                  | ~8M               |
| **LATAM**                | Brazil, Mexico, Argentina                           | PT-BR, ES           | ~20M              |
| **GCC** (Gulf)           | UAE, Saudi, Qatar                                   | AR                  | ~3M               |
| **MENA**                 | Egypt, Morocco, Tunisia                             | AR, FR              | ~5M               |
| **SEA** (Southeast Asia) | Indonesia, Thailand, Vietnam, Philippines, Malaysia | ID, TH, VI, FIL, MS | ~40M              |
| **EA** (East Asia)       | Japan, Korea                                        | JA, KO              | ~25M              |
| **SA_ASIA** (South Asia) | India                                               | HI, EN              | ~15M              |
| **OC** (Oceania)         | Australia, NZ                                       | EN                  | ~5M               |
| **AF** (Africa)          | South Africa, Kenya, Nigeria                        | EN                  | ~10M              |

**Total addressable market: ~260M anglers globally**

---

## 10. Subscription & Monetization

### Tier Structure

|                   | **Free**     | **Pro**     | **Team**      | **Guide**             |
| ----------------- | ------------ | ----------- | ------------- | --------------------- |
| **Price**         | $0           | $59.99/yr   | $149.99/yr    | $249.99/yr            |
| **Catches/month** | 5            | Unlimited   | Unlimited     | Unlimited             |
| **Map layers**    | 3            | 10          | All 18        | All 18                |
| **FishCast**      | Today, basic | 7-day, full | Full + shared | Full + client         |
| **Offline**       | No           | Yes         | Yes           | Yes + branded         |
| **Community**     | Read only    | Full access | Full + team   | Full + business       |
| **Species ID**    | —            | —           | —             | AI-powered            |
| **Analytics**     | Basic        | Full        | Full + team   | Full + client reports |
| **Support**       | Community    | Email       | Priority      | Dedicated             |

### PPP-Adjusted Pricing (Phase 2)

Purchasing Power Parity adjustments by region:

| Region        | Pro    | Team    | Guide   | Multiplier |
| ------------- | ------ | ------- | ------- | ---------- |
| NA/EU/Nordics | $59.99 | $149.99 | $249.99 | 1.0x       |
| LATAM         | $29.99 | $74.99  | $124.99 | 0.5x       |
| SEA           | $19.99 | $49.99  | $84.99  | 0.33x      |
| SA_ASIA       | $14.99 | $39.99  | $64.99  | 0.25x      |
| AF            | $14.99 | $39.99  | $64.99  | 0.25x      |
| GCC           | $59.99 | $149.99 | $249.99 | 1.0x       |

### Revenue Model

- RevenueCat handles all IAP (Apple/Google)
- 70% revenue after store commission (30%)
- Free tier is genuinely useful (drives word-of-mouth)
- Pro tier is primary revenue driver (~80% of revenue)
- Team/Guide are high-value niche (~20% of revenue)

---

## 11. Free Data Stack

### Zero-Cost APIs

| Data                               | Source                | Rate Limit    | Cache Strategy           |
| ---------------------------------- | --------------------- | ------------- | ------------------------ |
| **Weather** (hourly, 7-day)        | Open-Meteo            | Unlimited     | 1hr TTL                  |
| **Marine forecast** (waves, swell) | Open-Meteo Marine     | Unlimited     | 1hr TTL                  |
| **Tides (US)**                     | NOAA CO-OPS           | Unlimited     | 24hr TTL                 |
| **Tides (global)**                 | WorldTides            | ~$100/mo      | 6hr TTL + 2-day cap      |
| **Bathymetry**                     | GEBCO 2023            | Unlimited     | Raster tiles, CDN cached |
| **Nautical charts**                | NOAA RNC/ENC          | Unlimited     | Raster tiles, CDN cached |
| **SST** (sea surface temp)         | Copernicus/CMEMS      | Unlimited     | Daily update, CDN        |
| **Chlorophyll**                    | Copernicus/Sentinel-3 | Unlimited     | Daily update, CDN        |
| **Species data**                   | FishBase              | Unlimited     | App-bundled JSON         |
| **Sunrise/Sunset**                 | Astronomy calculation | Local compute | Pre-computed             |
| **Moon phase**                     | Astronomy calculation | Local compute | Pre-computed             |
| **Solunar periods**                | Sun/Moon calculation  | Local compute | Pre-computed             |

### NOAA Station Finder

- Pre-built database of ~210 NOAA tide stations
- Haversine distance calculation (100km search radius)
- Nearest station auto-selected based on user GPS
- Falls back to WorldTides for non-US locations

---

## 12. Map System (18 Layers)

Full specification in [`PROFISH_MAP_SPEC.md`](PROFISH_MAP_SPEC.md).

### Layer Summary

| #   | Layer                  | Type        | Source            | Tier  |
| --- | ---------------------- | ----------- | ----------------- | ----- |
| 1   | Satellite              | Base toggle | Mapbox            | Free  |
| 2   | Bathymetry             | Raster      | GEBCO             | Free  |
| 3   | Depth contours         | Vector      | GEBCO             | Free  |
| 4   | NOAA Nautical          | Raster      | NOAA RNC          | Pro   |
| 5   | SST (Sea Surface Temp) | Raster      | Copernicus        | Pro   |
| 6   | Chlorophyll            | Raster      | Copernicus        | Pro   |
| 7   | Currents               | Vector      | Copernicus        | Pro   |
| 8   | Wind overlay           | Animated    | Open-Meteo        | Pro   |
| 9   | Wave height            | Raster      | Open-Meteo        | Pro   |
| 10  | Tide stations          | Points      | NOAA/WorldTides   | Free  |
| 11  | My catches             | Points      | Local + Firestore | Free  |
| 12  | Community catches      | Points      | Firestore         | Team  |
| 13  | Fishing zones          | Polygon     | OSM + curated     | Pro   |
| 14  | Marine protected areas | Polygon     | WDPA              | Free  |
| 15  | Boat ramps             | Points      | OSM               | Free  |
| 16  | Tackle shops           | Points      | OSM/Google        | Pro   |
| 17  | AIS (boat traffic)     | Points      | MarineTraffic     | Guide |
| 18  | Species heatmap        | Heatmap     | Community data    | Team  |

### CPU Budget System

- Maximum 10 layers active simultaneously
- Each layer has a CPU cost (1-3)
- Budget indicator in LayerPicker UI
- Auto-disables lowest-priority layer when budget exceeded

---

## 13. Species Database

### Current (56 species, 5 habitats, 12 regions)

**Freshwater (18):** Largemouth Bass, Smallmouth Bass, Spotted Bass, Striped Bass (freshwater), Rainbow Trout, Brown Trout, Brook Trout, Lake Trout, Northern Pike, Muskellunge, Walleye, Yellow Perch, Channel Catfish, Blue Catfish, Flathead Catfish, Crappie, Bluegill, Carp

**Saltwater (22):** Striped Bass, Bluefish, Red Drum, Black Drum, Spotted Seatrout, Flounder, Snook, Tarpon, Bonefish, Permit, Mahi-Mahi, Yellowfin Tuna, Bluefin Tuna, Wahoo, King Mackerel, Cobia, Red Snapper, Grouper, Amberjack, Sailfish, Marlin, Halibut

**Brackish (4):** Snook, Redfish, Flounder, Spotted Seatrout

**Anadromous (8):** Atlantic Salmon, Chinook Salmon, Coho Salmon, Sockeye Salmon, Sea Trout, Steelhead, American Shad, Sea Lamprey

**Catadromous (4):** European Eel, American Eel, Japanese Eel, Barramundi

### Phase 2 Expansion Target: 200+ Species

- Regional species packs (downloadable)
- Community-submitted species
- FishBase API integration for full global database

---

## 14. Marketing & Launch Strategy

### Pre-Launch (Weeks 1-4)

- Landing page at profish.app (email capture)
- Social media accounts (Instagram, TikTok, YouTube, Facebook)
- Fishing forum seeding (Reddit r/fishing, local forums in 12 regions)
- Beta tester recruitment (50 anglers across 10+ countries)

### Launch (Week 6)

- Simultaneous App Store + Google Play release
- Press kit with screenshots in all 24 languages
- Launch video (angler using app in 3 different countries)
- Reddit AMA on r/fishing
- Fishing influencer partnerships (5 per region)

### Growth (Weeks 7-24)

- ASO optimization (keywords in 24 languages)
- User-generated content campaigns (#ProFishCatch)
- Tournament sponsorships (virtual + physical)
- Fishing show/expo presence
- Referral program (invite friends → free Pro month)
- Content marketing (blog: "Best fishing spots in [country]" × 100 countries)

### Retention

- Push notifications for FishCast score changes
- Weekly digest email (your stats, best upcoming days)
- Streak/badge system (days fished, species caught)
- Seasonal challenges (Spring Bass Challenge, Winter Pike Challenge)

---

## 15. Revenue Projections

### Conservative Model

| Month | MAU     | Paid % | Paid Users | Avg Revenue/User | MRR     | Cumulative |
| ----- | ------- | ------ | ---------- | ---------------- | ------- | ---------- |
| 1     | 200     | 2%     | 4          | $5.00            | $20     | $20        |
| 3     | 1,000   | 3%     | 30         | $5.00            | $150    | $400       |
| 6     | 5,000   | 4%     | 200        | $5.00            | $1,000  | $3,000     |
| 9     | 12,000  | 4.5%   | 540        | $5.00            | $2,700  | $10,000    |
| 12    | 25,000  | 5%     | 1,250      | $5.00            | $6,250  | $40,000    |
| 18    | 100,000 | 6%     | 6,000      | $5.00            | $30,000 | $150,000   |
| 24    | 250,000 | 7%     | 17,500     | $5.00            | $87,500 | $600,000   |

### Aggressive Model (with viral growth)

| Month | MAU       | Paid % | MRR      |
| ----- | --------- | ------ | -------- |
| 6     | 15,000    | 5%     | $3,750   |
| 12    | 100,000   | 6%     | $30,000  |
| 18    | 500,000   | 7%     | $175,000 |
| 24    | 1,000,000 | 8%     | $400,000 |

---

## 16. Competitive Analysis

| Feature       | **ProFish**            | Fishbrain    | Fishidy   | Anglr     |
| ------------- | ---------------------- | ------------ | --------- | --------- |
| Languages     | **24**                 | 5            | 1 (EN)    | 1 (EN)    |
| Countries     | **100+**               | ~15          | US only   | US only   |
| Free tier     | **Generous**           | Very limited | Limited   | Limited   |
| FishCast      | **8-factor algorithm** | Solunar only | None      | None      |
| Map layers    | **18**                 | 5            | 8         | 3         |
| Offline       | **Full (Pro)**         | Partial      | No        | No        |
| Species DB    | **56 (growing)**       | 400+         | US only   | US only   |
| AI Species ID | Phase 3                | Yes          | No        | No        |
| Price (Pro)   | **$59.99/yr**          | $79.99/yr    | $49.99/yr | $59.99/yr |
| PPP pricing   | **Yes**                | No           | No        | No        |
| Data cost     | **~$0**                | High         | Medium    | Medium    |
| Open data     | **Yes**                | No           | Partial   | No        |

### ProFish Advantages:

1. **24 languages day one** — competitors are English-first, maybe 5 languages
2. **$0 data stack** — no expensive API lock-in
3. **Global coverage** — not limited to US/EU
4. **PPP pricing** — accessible in developing markets
5. **FishCast 8-factor** — more factors than any competitor
6. **Open architecture** — community-improvable translations and species data

---

## 17. Risk Mitigation

| Risk                          | Likelihood | Impact | Mitigation                                         |
| ----------------------------- | ---------- | ------ | -------------------------------------------------- |
| Mapbox costs exceed free tier | Medium     | Medium | Fallback to MapLibre (open source fork)            |
| Firebase costs spike          | Low        | Medium | Migrate to Supabase if needed                      |
| WorldTides discontinues       | Low        | High   | Build own tidal prediction from harmonic constants |
| Apple rejects RTL layout      | Low        | Low    | Thorough testing before submission                 |
| Low conversion rate (<2%)     | Medium     | High   | Improve free tier value, A/B test paywall          |
| Competition copies features   | High       | Low    | Speed advantage — first to 24 languages            |
| Translation quality issues    | Medium     | Medium | Community feedback loop, Gold tier priority        |
| Store review rejections       | Low        | Medium | Follow all guidelines, complete privacy policy     |

---

## 18. Scale Triggers

| Trigger                   | Action                                 | Cost Impact |
| ------------------------- | -------------------------------------- | ----------- |
| EU MAU > 5K               | Add eu-west-1 AWS region               | +$100/mo    |
| APAC MAU > 3K             | Add ap-southeast-1 region              | +$100/mo    |
| Mapbox MAU > 20K          | Review pricing, consider MapLibre      | $0-500/mo   |
| Firebase reads > 50K/day  | Optimize queries, consider Supabase    | +$25/mo     |
| WorldTides calls > budget | Increase cache TTL to 12hr             | $0          |
| MRR > $2,500              | RevenueCat starts charging ($0.02/txn) | Variable    |
| MRR > $10,000             | Hire part-time support staff           | +$2,000/mo  |
| MAU > 100K                | Full-time developer hire               | +$5,000/mo  |

---

## 19. KPIs & Success Metrics

### Daily

- DAU/MAU ratio (target: >25%)
- Catches logged
- FishCast views
- Crash-free sessions (target: >99.5%)

### Weekly

- New user signups
- Free → Pro conversions
- Retention (D7)
- Map session duration

### Monthly

- MAU growth rate (target: >15% MoM)
- Paid conversion rate (target: >4%)
- MRR
- Churn rate (target: <5%)
- NPS score (target: >50)
- Language distribution
- Region distribution

### Quarterly

- Revenue per region
- Feature usage by tier
- Translation quality scores
- Cost per MAU
- LTV:CAC ratio (target: >3:1)

---

## Appendix: File Structure

```
ProFish/
├── docs/
│   ├── PROFISH_MASTER_PLAN.md          (original v3.1)
│   ├── PROFISH_MASTER_PLAN_V4.md       (this document)
│   ├── PROFISH_CHECKLIST.md            (~380 items)
│   └── PROFISH_MAP_SPEC.md             (18-layer map spec)
├── src/
│   ├── components/         (9 shared components)
│   ├── config/             (env.js, layerRegistry.js, theme.js)
│   ├── locales/            (24 language files, ~150 keys each)
│   ├── navigation/         (AppNavigator, AuthStack, MainTabs)
│   ├── screens/
│   │   ├── auth/           (WelcomeScreen, AuthScreen)
│   │   └── main/           (FishCast, Map, LogCatch, Catches, Community, Profile)
│   ├── services/           (14 services)
│   └── store/              (AppContext, reducer)
├── android/                (configured, BUILD SUCCESSFUL)
├── ios/                    (configured, needs pod install)
├── .env                    (all keys configured)
└── package.json            (all dependencies installed)
```

---

_Built with AI-driven development. Budget: ~$5,000. Target: 260M anglers. One app to rule them all._

_"The goal is aggressive and clear — to be the best, largest, and the only one that counts."_
