# ProFish

**The world's best fishing app.** Built for 260M+ anglers across 100+ countries.

## Overview

ProFish is a global fishing super-app featuring:

- **FishCast** — AI-powered fishing activity predictions (pressure, solunar, tide, moon phase, wind)
- **Interactive Map** — Mapbox-powered with bathymetry, SST, tide stations, fish hotspots
- **Catch Logging** — Full catch diary with species, weight, length, GPS, photos
- **Species Database** — 40+ species across freshwater & saltwater globally
- **24 Languages** — Day-one global launch with community translation improvement
- **Smart Layer System** — 18 data layers with CPU budget management

## Tech Stack

| Layer           | Technology                               |
| --------------- | ---------------------------------------- |
| Framework       | React Native 0.83.1                      |
| Maps            | Mapbox (@rnmapbox/maps)                  |
| Auth            | Firebase Auth (Google, Apple, Anonymous) |
| Database        | Firestore + AsyncStorage offline         |
| Weather         | Open-Meteo (free)                        |
| Tides           | NOAA (US free) + WorldTides (global)     |
| Analytics       | Firebase Analytics                       |
| Crash Reporting | Sentry                                   |
| Navigation      | React Navigation v7                      |
| i18n            | i18next (24 languages)                   |
| State           | React Context + useReducer               |
| Subscriptions   | RevenueCat                               |

## Free Data Stack

Zero-cost APIs powering core features:

- **Open-Meteo** — Weather + marine forecasts
- **NOAA** — US tide predictions + nautical charts
- **GEBCO** — Global bathymetry
- **Copernicus/Sentinel** — Sea surface temperature + chlorophyll
- **FishBase** — Species data

## Subscription Tiers

| Tier  | Price      | Key Features                                         |
| ----- | ---------- | ---------------------------------------------------- |
| Free  | $0         | 5 catches/mo, basic FishCast, 3 layers               |
| Pro   | $59.99/yr  | Unlimited catches, full FishCast, 10 layers, offline |
| Team  | $149.99/yr | 10 members, shared spots, team stats                 |
| Guide | $249.99/yr | Client management, branded reports, priority support |

## Languages (24)

Gold: English, Swedish, Norwegian, German, French, Spanish, Portuguese (BR)
Silver: Arabic, Japanese, Korean, Finnish, Danish, Dutch, Italian
Bronze: Polish, Czech, Turkish, Russian, Thai
Copper: Indonesian, Malay, Vietnamese, Hindi, Filipino

## Project Structure

```
src/
├── config/          # i18n, env, layerRegistry
├── services/        # 14 service modules
│   ├── weatherService.js
│   ├── fishCastService.js
│   ├── solunarService.js
│   ├── tideService.js
│   ├── catchService.js
│   ├── speciesDatabase.js
│   ├── subscriptionService.js
│   ├── mapboxConfig.js
│   ├── featureGate.js
│   ├── analyticsService.js
│   ├── offlineManager.js
│   ├── crashReporter.js
│   ├── firebaseAuthService.js
│   └── regionGatingService.js
├── store/           # AppContext (global state)
├── navigation/      # RootNavigator (5-tab + modals)
├── screens/main/    # 7 screens
├── locales/         # 24 language files
└── components/      # Shared components (coming soon)
```

## Getting Started

```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## Environment Setup

Copy `.env.template` to `.env` and fill in your API keys:

- `MAPBOX_ACCESS_TOKEN`
- `WORLDTIDES_API_KEY`
- Firebase config (auto from `google-services.json` / `GoogleService-Info.plist`)

## Docs

See `docs/` folder for project plans and architecture documents.

---

**ProFish** — Tight lines, everywhere.
