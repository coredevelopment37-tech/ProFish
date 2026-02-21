# ProFish — Complete Project Checklist

> **Version:** 3.1 · **Target:** ~380 items · **Stack:** React Native 0.83.1, Mapbox GL, Firebase, RevenueCat  
> **Last Updated:** 2026-02-21

Legend: `[x]` = Done · `[ ]` = To Do

---

## 1. Project Setup & Infrastructure (~30 items)

### Scaffolding & Toolchain

- [x] 1. Initialize React Native 0.83.1 project (`npx @react-native-community/cli init ProFish`)
- [x] 2. Configure `tsconfig.json` (paths, strict mode, baseUrl)
- [x] 3. Set up `babel.config.js` with module-resolver aliases
- [x] 4. Configure `metro.config.js` (asset extensions, resolver)
- [x] 5. Set up ESLint + Prettier with project rules
- [x] 6. Create `.env` and `react-native-config` integration
- [x] 7. Initialize Git repo with `.gitignore` (node_modules, android/build, ios/Pods)
- [x] 8. Push to GitHub remote repository
- [x] 9. Create `docs/PROFISH_MASTER_PLAN.md`

### Android Setup

- [x] 10. Configure `android/build.gradle` (compileSdk, minSdk 24, targetSdk 35)
- [x] 11. Configure `android/app/build.gradle` (applicationId `com.profish.app`, versionCode, signing)
- [x] 12. Add `google-services.json` for Firebase
- [x] 13. Register SHA-1 and SHA-256 fingerprints in Firebase Console
- [x] 14. Add Mapbox Maven repo and download token to `gradle.properties`
- [x] 15. Configure ProGuard rules for production builds
- [x] 16. Verify debug APK builds successfully on device/emulator
- [x] 17. Verify app launches and renders on physical Android device

### iOS Setup

- [x] 18. Configure `ios/Podfile` (platform :ios 15.1, use_frameworks)
- [x] 19. Add `GoogleService-Info.plist` to Xcode project
- [x] 20. Configure `Info.plist` (NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription)
- [x] 21. Set up `AppDelegate.swift` with Firebase initialization
- [x] 22. Configure Mapbox download token in `.netrc`
- [ ] 23. Run `pod install` and verify iOS build succeeds
- [ ] 24. Test on iOS Simulator (iPhone 15 Pro)
- [ ] 25. Test on physical iOS device

### API Keys & Services

- [x] 26. Obtain and configure Mapbox access token
- [x] 27. Create Firebase project (`profish-app`) with Auth + Firestore
- [x] 28. Obtain WorldTides API key
- [x] 29. Create RevenueCat project with Apple/Google API keys
- [x] 30. Configure Sentry DSN for crash reporting
- [ ] 31. Set up environment-specific `.env.development` / `.env.production`
- [ ] 32. Verify all API keys work in production mode

---

## 2. Core Architecture (~25 items)

### State Management

- [x] 33. Create `AppContext.js` with `useReducer` pattern
- [x] 34. Implement global state: user, tier, region, language, catches, isLoading
- [x] 35. Wire `AppProvider` to root `App.js`
- [x] 36. Implement subscription tier listener (RevenueCat → context dispatch)
- [x] 37. Implement region auto-detection on app init

### Navigation

- [x] 38. Install and configure React Navigation 7 (native-stack + bottom-tabs)
- [x] 39. Create `RootNavigator.js` with bottom tab bar (Map, Catches, FishCast, Community, Profile)
- [x] 40. Style tab bar (dark theme: `#1a1a2e` background, `#0080FF` active tint)
- [x] 41. Add tab icons via `react-native-vector-icons` with emoji fallback
- [x] 42. Register `LogCatch` as modal stack screen
- [x] 43. Register `SpeciesDetail` as card stack screen
- [x] 44. Add deep linking configuration (profish://catch/:id, profish://map)
- [x] 45. Add navigation analytics tracking (screen views)
- [x] 46. Implement auth-gated navigation (redirect to sign-in if unauthenticated for Pro features)

### Config & Env

- [x] 47. Create centralized `env.js` with typed getters (Mapbox, Firebase, RevenueCat, Sentry, WorldTides)
- [x] 48. Create `layerRegistry.js` with CPU budget system (MAX_BUDGET = 10)
- [x] 49. Create `i18n.js` with 24-language initialization
- [x] 50. Create `regionGatingService.js` for 12-region detection
- [x] 51. Create `featureFlags.js` for remote feature toggling (Firebase Remote Config)
- [x] 52. Create `constants.js` (colors, dimensions, tier limits, API endpoints)

### Error Handling

- [x] 53. Integrate `@sentry/react-native` for crash reporting
- [x] 54. Create global error boundary component (`ErrorBoundary.js`)
- [x] 55. Implement graceful API failure fallbacks (cached data on network error)
- [x] 56. Add retry logic with exponential backoff for API calls
- [x] 57. Create `crashReporter.js` with Sentry + analytics breadcrumbs

---

## 3. FishCast Engine (~30 items)

### Core Algorithm

- [x] 58. Create `fishCastService.js` with 8-factor weighted scoring engine
- [x] 59. Implement weight distribution: Pressure 20%, Moon 15%, Solunar 15%, Wind 12%, TimeOfDay 12%, Tide 10%, Cloud 8%, Precip 8%
- [x] 60. Implement `scorePressure()` — optimal 1010-1020 hPa, trend detection (rising = good)
- [x] 61. Implement `scoreMoonPhase()` — new/full moon = 100, quarter = 50
- [x] 62. Implement `scoreSolunarPeriod()` — major period = 100, minor = 70, outside = 30
- [x] 63. Implement `scoreWind()` — 5-15 km/h optimal, >30 = poor
- [x] 64. Implement `scoreTimeOfDay()` — dawn/dusk golden hour = 100, midday = 40
- [x] 65. Implement `scoreCloudCover()` — overcast 60-80% = optimal
- [x] 66. Implement `scorePrecipitation()` — light rain = good, heavy = poor
- [x] 67. Implement `scoreTideState()` — moving water (mid-tide) = best, slack = worst
- [x] 68. Calculate weighted composite score (0-100)
- [x] 69. Map score to labels: Poor (0-25), Fair (26-50), Good (51-70), Very Good (71-85), Excellent (86-100)

### Weather Integration

- [x] 70. Create `weatherService.js` — Open-Meteo API integration
- [x] 71. Fetch hourly forecast (temperature, wind, pressure, cloud cover, precipitation)
- [x] 72. Fetch marine forecast (wave height, swell direction, water temperature)
- [x] 73. Parse sunrise/sunset times from weather response
- [x] 74. Implement 7-day forecast caching (AsyncStorage, 1-hour TTL)
- [x] 75. Add weather data fallback for offline mode (last cached forecast)

### Solunar & Moon

- [x] 76. Create `solunarService.js` — astronomical calculation engine
- [x] 77. Calculate moon phase (new, waxing crescent, first quarter, waxing gibbous, full, waning gibbous, third quarter, waning crescent)
- [x] 78. Calculate moon illumination percentage
- [x] 79. Calculate major solunar periods (moon transit, moon underfoot)
- [x] 80. Calculate minor solunar periods (moonrise, moonset)
- [x] 81. Map moon phases to fishing ratings (1-5 scale)
- [ ] 82. Validate solunar calculations against USNO data for ±5 min accuracy

### Tide Integration

- [x] 83. Create `tideService.js` — dual-provider (WorldTides + NOAA)
- [x] 84. Implement NOAA station finder using haversine distance (100km radius)
- [x] 85. Fetch current tide state (rising, falling, high, low, slack)
- [x] 86. Fetch tide predictions (24-hour high/low schedule)
- [ ] 87. Implement tide height interpolation between prediction points
- [x] 88. Cache tide predictions for 24 hours

### FishCast UI

- [x] 89. Build FishCast score circle with animated fill (0-100, color-coded)
- [x] 90. Build factor breakdown component (8 bars showing individual factor scores)
- [x] 91. Build hourly forecast timeline (swipeable, color-coded by score)
- [x] 92. Build 7-day outlook grid (Pro only, gated by tier)
- [x] 93. Add "Best Times Today" summary card (top 3 windows)
- [x] 94. Add species-specific adjustments (e.g., bass prefer low pressure; trout prefer cold water)
- [x] 95. Add location-aware FishCast (auto-detect GPS, show nearest water body)

---

## 4. Interactive Map (~45 items)

### Base Map

- [x] 96. Integrate `@rnmapbox/maps` with Mapbox GL
- [x] 97. Configure default map style (dark theme for fishing)
- [x] 98. Implement user location tracking (GPS dot + heading)
- [x] 99. Add map rotation, tilt, and compass controls
- [x] 100. Implement map long-press to drop pin (for catch logging)
- [x] 101. Add location search bar (geocoding via Mapbox)
- [x] 102. Implement "center on my location" FAB button

### Layer System (18 Layers)

- [x] 103. Create `LayerPicker.js` component with tier-gated toggle list
- [x] 104. Implement CPU budget system (max 10 cost, per-layer costs)
- [x] 105. Implement `canActivateLayer()` budget check before enabling
- [x] 106. Implement tier-filtered `getAvailableLayers()` (free sees 6, pro sees all)

#### Free Layers (6)

- [x] 107. Layer: `base-dark` — Mapbox dark style (cost: 0)
- [x] 108. Layer: `satellite` — Mapbox satellite imagery (cost: 0)
- [x] 109. Layer: `weather` — Open-Meteo cloud/rain overlay (cost: 1)
- [x] 110. Layer: `wind-overlay` — Wind arrow vectors (cost: 1)
- [x] 111. Layer: `catch-heatmap` — User catch markers (cost: 1)
- [x] 112. Layer: `tide-stations` — WorldTides station markers (cost: 1)

#### Pro Layers (12)

- [x] 113. Layer: `bathymetry` — GEBCO global depth data (cost: 2, raster tiles)
- [x] 114. Layer: `nautical-charts` — NOAA ENC charts (cost: 2, raster tiles)
- [x] 115. Layer: `sea-surface-temp` — Copernicus/NOAA SST (cost: 2, WMS)
- [x] 116. Layer: `chlorophyll` — Copernicus/Sentinel CHL-a (cost: 2, WMS)
- [x] 117. Layer: `fish-activity-zones` — Aggregated catch hotspot heatmap (cost: 2)
- [x] 118. Layer: `current-overlay` — Ocean current arrows from Copernicus (cost: 2)
- [x] 119. Layer: `water-temp-gradient` — Temperature contour lines (cost: 2)
- [x] 120. Layer: `depth-contours` — GEBCO bathymetric contour lines (cost: 2)
- [x] 121. Layer: `solunar-overlay` — Color-coded feeding time zones on map
- [x] 122. Layer: `marine-protected-areas` — MPA boundaries (WDPA dataset)
- [x] 123. Layer: `boat-ramps` — Public boat ramp locations (OSM data)
- [x] 124. Layer: `fishing-regulations` — Regional regulation zone boundaries

#### Tile Source Integration

- [x] 125. Wire GEBCO bathymetry raster tiles (ArcGIS tile server)
- [x] 126. Wire NOAA nautical chart raster tiles (tileservice.charts.noaa.gov)
- [x] 127. Wire Copernicus SST via ERDDAP WMS (coastwatch.pfeg.noaa.gov)
- [x] 128. Wire Copernicus chlorophyll via ERDDAP WMS
- [ ] 129. Build self-hosted tile proxy for Copernicus data (CloudFront CDN cache)
- [x] 130. Implement tile loading indicators (spinner per layer)
- [x] 131. Implement tile error fallback (show placeholder on 404/timeout)

### Map Interactions

- [x] 132. Tap on catch marker → show catch detail popup
- [x] 133. Tap on tide station → show tide chart modal
- [ ] 134. Tap on fish hotspot → show species breakdown + best times
- [x] 135. Long-press → context menu (Log Catch Here, Get FishCast, Save Spot)
- [x] 136. Cluster catch markers at low zoom levels (Supercluster)
- [x] 137. De-cluster on zoom-in with animation
- [x] 138. Implement fishing spot bookmarks (pin + label, saved to AsyncStorage)
- [ ] 139. Add distance measurement tool (two-point line)
- [x] 140. Show FishCast score badge on current location marker

### Offline Maps

- [x] 141. Integrate `offlineManager.js` for Mapbox offline packs
- [ ] 142. UI for downloading region packs (slider for zoom range, estimated size)
- [ ] 143. Show download progress bar
- [ ] 144. List downloaded packs with size and delete option
- [ ] 145. Auto-download user's home region pack on first Pro subscription
- [ ] 146. Cap offline pack size (500 MB per region, warn at 80%)

---

## 5. Catch Logging (~35 items)

### Data Model

- [x] 147. Define catch schema: id, species, weight, length, lat/lng, locationName, photo, bait, method, waterType, conditions, released, notes, createdAt, synced
- [x] 148. Include conditions sub-object: weather, temperature, windSpeed, windDirection, pressure, moonPhase, tideState, waterTemp, waterClarity
- [x] 149. Generate unique IDs (`Date.now() + random` or UUID)

### CRUD Operations

- [x] 150. Implement `logCatch()` — save to AsyncStorage + queue Firestore sync
- [x] 151. Implement `getCatches()` — paginated with species filter
- [x] 152. Implement `updateCatch()` — local update + sync queue
- [x] 153. Implement `deleteCatch()` — soft delete + sync
- [x] 154. Implement `_persist()` — batch write to AsyncStorage
- [x] 155. Implement `_syncToFirestore()` — fire-and-forget cloud push

### Catch Logging Screen

- [x] 156. Species picker with search (autocomplete from 56 species)
- [x] 157. Weight input (kg/lb toggle based on user preference)
- [x] 158. Length input (cm/in toggle)
- [x] 159. GPS auto-fill from current location
- [x] 160. Manual location override via map pin drop
- [x] 161. Photo capture from camera or gallery (`react-native-image-picker`)
- [x] 162. Photo compression before storage (max 1024px, 80% quality JPEG)
- [x] 163. Bait/lure picker (common baits: worm, minnow, crankbait, jig, fly, shrimp, cut bait, artificial)
- [x] 164. Method picker (casting, trolling, fly fishing, jigging, bottom fishing, drift, surfcasting, ice fishing)
- [x] 165. Water type selector (saltwater, freshwater, brackish)
- [x] 166. Auto-populate conditions from `weatherService` + `tideService` at current GPS
- [x] 167. "Catch & Release" toggle
- [x] 168. Notes free-text field
- [x] 169. Validation: require species + GPS minimum
- [x] 170. Success haptic feedback + animation on save
- [x] 171. "Log Another" quick action after save

### Catches List Screen

- [x] 172. Display catch cards in reverse-chronological FlatList
- [x] 173. Show photo thumbnail, species, weight, date, location
- [x] 174. Filter by species, date range, water type
- [x] 175. Sort by date, weight, species
- [x] 176. Swipe-to-delete with confirmation
- [x] 177. Pull-to-refresh (re-sync from Firestore)
- [x] 178. Empty state illustration ("No catches yet — go fish!")

### Tier Limits

- [x] 179. Enforce Free tier: 5 catches/month limit (show upgrade prompt at limit)
- [x] 180. Track monthly catch count in AsyncStorage
- [x] 181. Reset count on 1st of each month

---

## 6. Species Database (~20 items)

### Data

- [x] 182. Build initial database: 56 species across 5 habitats
- [x] 183. Include freshwater species: largemouth bass, smallmouth bass, rainbow trout, brown trout, walleye, northern pike, bluegill, crappie, channel catfish, carp, perch
- [x] 184. Include saltwater species: redfish, snook, tarpon, mahi-mahi, tuna, marlin, sailfish, grouper, snapper, mackerel, barramundi, kingfish
- [x] 185. Include brackish species: striped bass, flounder, snook
- [x] 186. Include anadromous species: salmon (Atlantic, Chinook, Coho, Sockeye), steelhead, shad
- [x] 187. Include catadromous species: eel
- [x] 188. Map each species to regions: NA, EU, NORDICS, GCC, MENA, SA, CA, SEA, EA, SA_ASIA, OC, AF
- [x] 189. Include scientific names (FishBase taxonomy)
- [x] 190. Include family classification

### Species Detail Screen

- [x] 191. Display species hero image (FishBase / public domain)
- [x] 192. Show common name (localized), scientific name, family
- [x] 193. Show habitat badge(s): freshwater | saltwater | brackish | anadromous | catadromous
- [ ] 194. Show region distribution map (Mapbox with highlighted regions)
- [x] 195. Show typical size range (min/max weight + length)
- [x] 196. Show best season/month by region
- [x] 197. Show preferred bait/lure recommendations
- [x] 198. Show preferred time of day + conditions (pressure, wind, temp)
- [x] 199. Link to user's catches of this species
- [ ] 200. Add "FishCast for this species" (species-adjusted algorithm)

### Database Expansion

- [ ] 201. Expand to 200 species for Phase 2 launch
- [ ] 202. Add localized common names for all 24 languages (species.{id}.name key per locale)
- [ ] 203. Add conservation status (IUCN Red List) per species
- [ ] 204. Add catch regulations per species per region (size limits, bag limits, seasons)

---

## 7. Internationalization — i18n (~30 items)

### Setup

- [x] 205. Initialize i18next with `react-i18next` and `react-native-localize`
- [x] 206. Configure auto-detection of device language on first launch
- [x] 207. Configure fallback chain (device language → en)
- [x] 208. Import all 24 locale files in `i18n.js`
- [x] 209. Register language resources with quality tier metadata

### Translation Files (24 Languages)

#### Gold Tier — Native-perfect

- [x] 210. `en.json` — English (~150+ keys)
- [x] 211. `sv.json` — Swedish
- [x] 212. `no.json` — Norwegian

#### Silver Tier — AI + native review

- [x] 213. `de.json` — German
- [x] 214. `fr.json` — French
- [x] 215. `es.json` — Spanish
- [x] 216. `pt-BR.json` — Portuguese (Brazil)
- [x] 217. `ar.json` — Arabic (RTL)
- [x] 218. `ja.json` — Japanese
- [x] 219. `ko.json` — Korean
- [x] 220. `da.json` — Danish
- [x] 221. `fi.json` — Finnish
- [x] 222. `nl.json` — Dutch
- [x] 223. `it.json` — Italian

#### Bronze Tier — AI-generated

- [x] 224. `pl.json` — Polish
- [x] 225. `cs.json` — Czech
- [x] 226. `tr.json` — Turkish
- [x] 227. `ru.json` — Russian

#### Copper Tier — AI + community corrections

- [x] 228. `th.json` — Thai
- [x] 229. `id.json` — Indonesian
- [x] 230. `ms.json` — Malay
- [x] 231. `vi.json` — Vietnamese
- [x] 232. `hi.json` — Hindi
- [x] 233. `fil.json` — Filipino

### RTL & Advanced i18n

- [x] 234. Implement RTL layout mirroring for Arabic
- [x] 235. Apply `I18nManager.forceRTL()` when Arabic is selected
- [ ] 236. Test all screens in RTL mode (layouts, icons, swipe directions)
- [x] 237. Implement pluralization rules (i18next plural keys: `_one`, `_other`, `_zero`)
- [x] 238. Implement number formatting per locale (decimal separators: 1,000.50 vs 1.000,50)
- [x] 239. Implement date formatting per locale (MM/DD vs DD/MM)
- [x] 240. Implement unit conversion labels (kg/lb, cm/in, °C/°F, km/mi)
- [x] 241. Add in-app language picker (ProfileScreen → immediate language switch)
- [x] 242. Persist selected language to AsyncStorage (override device locale)
- [ ] 243. Implement translation key coverage audit script (find missing keys per locale)
- [ ] 244. Set up community translation contribution flow (GitHub PR template for locale fixes)

---

## 8. Subscriptions & Monetization (~25 items)

### RevenueCat Setup

- [x] 245. Install `react-native-purchases` and link native modules
- [x] 246. Initialize RevenueCat with platform-specific API keys (Apple/Google)
- [x] 247. Configure product SKUs: `profish_pro_yearly`, `profish_pro_monthly`
- [ ] 248. Configure Phase 2 SKUs: `profish_team_yearly`, `profish_team_monthly`, `profish_guide_yearly`, `profish_guide_monthly`
- [x] 249. Implement `subscriptionService.init()` — restore purchases on launch

### Tier System

- [x] 250. Define 4 tiers: Free, Pro ($59.99/yr), Team ($149.99/yr), Guide ($249.99/yr)
- [x] 251. Define tier limits: catches/month, layers, FishCast days, AI IDs/day, offline packs
- [x] 252. Implement `getCurrentTier()` — read from RevenueCat entitlements
- [x] 253. Implement tier change listener (update AppContext on purchase/expiry)
- [x] 254. Implement `checkFeatureAccess(feature, tier)` utility for gating

### Purchase Flow

- [x] 255. Implement `purchaseProduct(sku)` — RevenueCat purchase
- [x] 256. Implement `restorePurchases()` — for reinstalls/device switches
- [x] 257. Build `PaywallModal.js` component wired to RevenueCat
- [x] 258. Show feature comparison table in paywall (Free vs Pro vs Team vs Guide)
- [ ] 259. Show PPP-adjusted prices per region (RevenueCat offerings)
- [x] 260. Handle purchase success animation + confetti
- [x] 261. Handle purchase failure (user cancel, network error, already subscribed)
- [x] 262. Handle subscription expiration gracefully (downgrade to Free, keep data)

### App Store Products

- [ ] 263. Create products in Apple App Store Connect (auto-renewable subscriptions)
- [ ] 264. Create products in Google Play Console (subscription products)
- [ ] 265. Configure free trial periods (7-day Pro trial)
- [ ] 266. Configure introductory/promotional offers
- [ ] 267. Test sandbox purchases on iOS (Sandbox account)
- [ ] 268. Test sandbox purchases on Android (test track + license testers)
- [ ] 269. Verify receipt validation via RevenueCat webhook

---

## 9. Authentication & User Management (~20 items)

### Firebase Auth

- [x] 270. Create `firebaseAuthService.js` with multi-provider support
- [x] 271. Implement Google Sign-In (`@react-native-google-signin/google-signin`)
- [x] 272. Implement Apple Sign-In (`@invertase/react-native-apple-authentication`)
- [x] 273. Implement Anonymous Auth (auto-sign-in on first launch)
- [x] 274. Implement Email/Password authentication (sign-up + sign-in)
- [x] 275. Implement anonymous-to-permanent account linking (Google/Apple/Email)
- [x] 276. Implement password reset flow (Firebase `sendPasswordResetEmail`)

### User Profile

- [x] 277. Build ProfileScreen with language picker, units toggle, sign-out, delete account
- [x] 278. Implement user display name + avatar (from Google/Apple or custom upload)
- [x] 279. Implement preferred units setting (metric/imperial, persisted to AsyncStorage)
- [x] 280. Implement preferred species list (favorites for quick catch logging)
- [x] 281. Implement notification preferences (FishCast alerts, community mentions)
- [x] 282. Implement "Export My Data" (GDPR compliance — JSON download of all catches)
- [x] 283. Implement account deletion (Firebase Auth delete + Firestore user doc purge)
- [x] 284. Show subscription status + manage subscription link

### Auth State

- [x] 285. Implement auth state persistence (auto-login on app restart)
- [x] 286. Implement auth state listener (update AppContext on sign-in/sign-out)
- [x] 287. Handle token refresh automatically (Firebase SDK handles this)
- [x] 288. Show sign-in prompt for gated features (catches, community posts)
- [x] 289. Implement rate limiting for auth attempts (5 per minute)

---

## 10. Offline & Data Sync (~20 items)

### Offline-First Architecture

- [x] 290. Implement AsyncStorage as primary local cache for catches
- [x] 291. Implement sync queue (`@profish_sync_queue`) for pending Firestore writes
- [x] 292. Implement fire-and-forget Firestore sync on catch save
- [x] 293. Implement periodic background sync (every 15 min when online)
- [x] 294. Implement conflict resolution: last-write-wins with timestamp comparison)
- [x] 295. Implement sync status indicator (synced ✓, pending ↻, error ✗)

### Firestore Sync

- [x] 296. Create Firestore collection structure: `users/{uid}/catches/{catchId}`
- [x] 297. Create Firestore collection: `users/{uid}/preferences`
- [x] 298. Create Firestore collection: `users/{uid}/spots`
- [x] 299. Implement batch sync (upload up to 50 pending catches at once)
- [x] 300. Implement Firestore snapshot listener for real-time updates on shared catches
- [x] 301. Implement data pagination for Firestore reads (cursor-based)

### Offline Capabilities

- [x] 302. Cache weather data for 1 hour in AsyncStorage
- [x] 303. Cache tide predictions for 24 hours in AsyncStorage
- [x] 304. Cache species database locally (embedded — already done via JS object)
- [x] 305. Cache FishCast results (current location, 1-hour TTL)
- [x] 306. Mapbox offline map packs (Pro tier)
- [x] 307. Show "Offline Mode" banner when network is unavailable
- [x] 308. Queue all writes during offline; flush when connectivity restored
- [x] 309. Implement `NetInfo` listener for connectivity state changes

---

## 11. UI/UX & Components (~30 items)

### Shared Components

- [x] 310. `CatchCard.js` — catch summary card (photo, species, weight, date, location)
- [x] 311. `ScoreCircle.js` — animated circular score indicator (FishCast 0-100)
- [x] 312. `FactorBreakdown.js` — horizontal bar chart of 8 FishCast factors
- [x] 313. `SolunarTimeline.js` — 24-hour timeline with major/minor periods
- [x] 314. `TideChart.js` — tide height graph (24-hour curve)
- [x] 315. `WeatherCard.js` — current conditions summary
- [x] 316. `LayerPicker.js` — toggleable layer list with budget indicator
- [x] 317. `PaywallModal.js` — subscription paywall with tier comparison
- [x] 318. `SpeciesPicker.js` — searchable species selector

### Missing Components (To Build)

- [x] 319. `LoadingScreen.js` — splash/loading state with ProFish branding
- [x] 320. `EmptyState.js` — reusable empty list placeholder with illustration
- [x] 321. `ErrorBoundary.js` — global crash UI with "Retry" and "Report" buttons
- [x] 322. `OfflineBanner.js` — sticky top banner when network unavailable
- [x] 323. `UpgradePrompt.js` — inline upgrade nudge for tier-gated features
- [x] 324. `PhotoViewer.js` — full-screen catch photo viewer with pinch-to-zoom
- [x] 325. `NotificationBell.js` — header icon with unread count badge
- [x] 326. `SearchBar.js` — reusable search input with debounced query

### Design System

- [x] 327. Define color palette: primary (#0080FF), background (#0f0f23), surface (#1a1a2e), success (#4CAF50), warning (#FF9800), error (#F44336)
- [x] 328. Define typography scale: H1 (28px bold), H2 (22px semibold), Body (16px), Caption (12px)
- [x] 329. Implement dark mode as default; add optional light mode toggle
- [x] 330. Apply consistent spacing system (4px base grid: 4, 8, 12, 16, 24, 32, 48)
- [x] 331. Add haptic feedback on key interactions (catch save, purchase, score reveal)
- [x] 332. Add skeleton loading placeholders for all list views
- [x] 333. Implement pull-to-refresh on all data screens

### Platform Polish

- [x] 334. Handle safe area insets on all screens (notch, home indicator)
- [x] 335. Handle keyboard avoidance on all input screens (LogCatch, Profile)
- [ ] 336. Implement responsive layout for tablets (2-column grid)
- [ ] 337. Test accessibility: screen reader labels, minimum touch targets (44×44 pt)
- [ ] 338. Implement dynamic font scaling (respect system font size preference)
- [x] 339. Add launch screen / splash screen (iOS LaunchScreen.storyboard + Android splash)

---

## 12. Community & Social — Phase 2 (~25 items)

### Feed System

- [x] 340. Build `CommunityScreen.js` with preview card layout
- [x] 341. Implement feed data model: posts (catch shares, tips, questions)
- [x] 342. Create Firestore collection: `posts/{postId}` with author, content, media, location, species, likes, comments
- [x] 343. Implement infinite scroll feed with cursor-based pagination
- [x] 344. Implement "Share Catch" — auto-generate post from catch data
- [x] 345. Implement "Post Tip" — free-text with optional photo
- [x] 346. Implement "Ask Question" — tagged by species/technique

### Social Interactions

- [x] 347. Implement like/unlike on posts (optimistic UI)
- [x] 348. Implement comments thread on posts
- [x] 349. Implement follow/unfollow users
- [x] 350. Implement user profile view (their catches, posts, stats)
- [x] 351. Implement content reporting (spam, inappropriate)
- [ ] 352. Implement content moderation queue (Firebase Functions)

### Notifications

- [ ] 353. Integrate Firebase Cloud Messaging (FCM) for push notifications
- [ ] 354. Send notification on: new follower, comment on your post, like milestone (10, 50, 100)
- [ ] 355. Send FishCast alert push notification ("Great fishing at 6 AM — Score: 92!")
- [ ] 356. Implement in-app notification center (list of recent notifications)
- [ ] 357. Implement notification preferences (toggle per type)

### Leaderboards

- [ ] 358. Implement global leaderboard (most catches, largest catch, most species)
- [ ] 359. Implement regional leaderboard (per 12 regions)
- [ ] 360. Implement species-specific leaderboard (biggest bass, biggest tuna, etc.)
- [ ] 361. Implement friend leaderboard (among followed users)
- [ ] 362. Implement weekly/monthly/all-time filters
- [ ] 363. Implement anti-cheat: photo verification for leaderboard entries
- [ ] 364. Award badges for milestones (first catch, 100 catches, 10 species, etc.)

---

## 13. Tournaments — Phase 2 (~15 items)

- [ ] 365. Design tournament data model (name, species, rules, start/end, region, entry fee, prizes)
- [ ] 366. Create Firestore collection: `tournaments/{tournamentId}` with participants, catches, leaderboard
- [ ] 367. Build Tournament List screen (upcoming, active, completed)
- [ ] 368. Build Tournament Detail screen (rules, leaderboard, entry button)
- [ ] 369. Build Tournament Leaderboard (live updating via Firestore snapshots)
- [ ] 370. Implement tournament entry (free or Pro-tier gated)
- [ ] 371. Implement tournament catch submission (photo required, GPS required)
- [ ] 372. Implement catch verification queue (manual review for prize events)
- [ ] 373. Implement tournament notifications (start, 1-hour warning, results)
- [ ] 374. Implement weekly ProFish community tournaments (automated creation)
- [ ] 375. Implement team tournaments (Team tier, shared leaderboard)
- [ ] 376. Implement tournament history + stats (wins, placements, personal bests)
- [ ] 377. Implement tournament share cards (results graphic for social media)
- [ ] 378. Implement tournament sponsorship placements (monetization)
- [ ] 379. Limit tournament creation to Team/Guide tiers

---

## 14. Advanced Analytics — Phase 2 (~15 items)

- [x] 380. Build personal stats dashboard (total catches, species count, average weight)
- [x] 381. Build catch trends chart (catches per week/month over time)
- [x] 382. Build personal best records (heaviest/longest per species)
- [x] 383. Build species collection progress (X of 56 caught — "Pokédex" style)
- [x] 384. Build heatmap of personal catch locations
- [x] 385. Build time analysis (best hour, best day of week, best moon phase)
- [x] 386. Build bait effectiveness analysis (success rate by bait type per species)
- [ ] 387. Build conditions correlation (weight vs. pressure, temperature, tide)
- [ ] 388. Build catch rate trend (catches per trip over time)
- [ ] 389. Export analytics as PDF report (Guide tier — branded with logo)
- [ ] 390. Implement catch comparison (compare two catches side-by-side)
- [ ] 391. Build seasonal species calendar (when to target each species in user's region)
- [ ] 392. Build "Your Best Conditions" profile (ML-derived ideal fishing parameters)
- [ ] 393. Implement trip logging (group catches by fishing session with duration + location)
- [ ] 394. Build trip summary card (shareable graphic: species, total weight, conditions)

---

## 15. AI Features — Phase 3 (~15 items)

- [ ] 395. Integrate on-device species identification model (TensorFlow Lite / Core ML)
- [ ] 396. Build camera capture screen with bounding box overlay
- [ ] 397. Implement species ID confidence threshold (>80% = auto-fill, <80% = suggest top 3)
- [ ] 398. Train/fine-tune model on 56 target species (FishBase + iNaturalist images)
- [ ] 399. Implement fallback to cloud API for low-confidence IDs
- [ ] 400. Rate-limit AI IDs: Free = 5/day, Pro = unlimited
- [ ] 401. Implement AR catch measurement (camera-based length estimation using reference object)
- [ ] 402. Build AR overlay: species info panel over fish in camera view
- [ ] 403. Implement AI-powered fishing recommendations ("Based on conditions, try topwater bass at dusk")
- [ ] 404. Implement smart catch auto-fill (AI suggests weight estimate from photo)
- [ ] 405. Implement AI chatbot for fishing tips (GPT-powered, context-aware to location + conditions)
- [ ] 406. Implement predictive species distribution (ML model: "Mahi-mahi likely at these coordinates today")
- [ ] 407. Implement photo enhancement for catch photos (auto-crop, color correction, background blur)
- [ ] 408. Implement voice-to-catch logging ("Hey ProFish, log a 3-pound bass on crankbait")
- [ ] 409. Build AI model update pipeline (OTA model downloads via CodePush / Firebase)

---

## 16. Marketplace — Phase 3 (~10 items)

- [ ] 410. Design marketplace data model (listings: gear, guides, charters)
- [ ] 411. Build Marketplace tab/screen (browse gear, book guides, find charters)
- [ ] 412. Implement gear listings (used fishing equipment buy/sell)
- [ ] 413. Implement guide profiles (Guide tier users: bio, reviews, availability, rates)
- [ ] 414. Implement charter booking flow (date picker, group size, species target, payment)
- [ ] 415. Integrate Stripe Connect for marketplace payments (guide/charter payouts)
- [ ] 416. Implement review/rating system for guides and charters
- [ ] 417. Implement affiliate gear links (Amazon Associates, Tackle Warehouse)
- [ ] 418. Implement location-based search for nearby guides and charters
- [ ] 419. Implement branded guide reports (Guide tier — PDF with custom logo + catch stats)

---

## 17. Testing & Quality (~20 items)

### Unit Tests

- [ ] 420. Unit test `fishCastService` — verify weighted scoring output range (0-100)
- [ ] 421. Unit test `scorePressure()` — edge cases: 980, 1013, 1040 hPa
- [ ] 422. Unit test `solunarService` — verify moon phase accuracy against known dates
- [ ] 423. Unit test `catchService` — CRUD operations with mock AsyncStorage
- [ ] 424. Unit test `subscriptionService` — tier limits enforcement
- [ ] 425. Unit test `tideService` — haversine station finder returns nearest station
- [ ] 426. Unit test `layerRegistry` — budget calculation, canActivateLayer logic
- [ ] 427. Unit test `regionGatingService` — 12-region detection from coordinates

### Integration Tests

- [ ] 428. Integration test: Firebase Auth sign-in → Firestore write → read back
- [ ] 429. Integration test: CatchService → Firestore sync round-trip
- [ ] 430. Integration test: RevenueCat purchase flow → tier update → feature unlock
- [ ] 431. Integration test: Weather API → FishCast calculation → UI render
- [ ] 432. Integration test: i18n language switch → all screens re-render with new locale

### E2E Tests

- [ ] 433. E2E: Full catch logging flow (navigate → fill form → save → verify in list)
- [ ] 434. E2E: Map interaction (load map → toggle layers → tap marker → view popup)
- [ ] 435. E2E: Sign in with Google → verify profile → sign out
- [ ] 436. E2E: Paywall → mock purchase → verify Pro features unlocked

### Quality Gates

- [ ] 437. Configure Jest with `jest.config.js` (module aliases, transform, mocks)
- [ ] 438. Set up CI pipeline (GitHub Actions: lint → test → build → deploy)
- [ ] 439. Add pre-commit hook (lint + type-check via Husky)
- [ ] 440. Achieve 70%+ code coverage on services layer
- [ ] 441. Zero critical/high Sentry errors for 48 hours before release

---

## 18. App Store Preparation (~25 items)

### Apple App Store

- [ ] 442. Register Apple Developer account ($99/yr)
- [ ] 443. Create App ID and provisioning profiles (development + distribution)
- [ ] 444. Configure app icon (1024×1024 + all required sizes via asset catalog)
- [ ] 445. Create App Store screenshots (6.7" iPhone, 6.5" iPhone, 12.9" iPad) in all 24 languages
- [ ] 446. Write App Store description (short + long) in English + top 10 languages
- [ ] 447. Write App Store keywords (30 keywords max, localized per market)
- [ ] 448. Configure App Store categories (Sports, Weather)
- [ ] 449. Create promotional text and what's new text
- [ ] 450. Configure auto-renewable subscription products in App Store Connect
- [ ] 451. Submit for App Store Review (allow 3-5 days)
- [ ] 452. Prepare App Privacy labels (data collection disclosure)
- [ ] 453. Provide demo account credentials for review team

### Google Play Store

- [ ] 454. Register Google Play Developer account ($25 one-time)
- [ ] 455. Create Play Store listing (title, short desc, full desc)
- [ ] 456. Create feature graphic (1024×500) and screenshots (phone + tablet)
- [ ] 457. Configure content rating questionnaire
- [ ] 458. Configure data safety section (privacy disclosure)
- [ ] 459. Create subscription products in Play Console
- [ ] 460. Generate signed release APK/AAB (`./gradlew bundleRelease`)
- [ ] 461. Submit to internal testing track first → closed beta → production
- [ ] 462. Localize Play Store listing for all 24 languages
- [ ] 463. Configure pre-registration if desired

### Legal & Compliance

- [x] 464. Draft Privacy Policy (GDPR + CCPA compliant, hosted at profish.app/privacy)
- [ ] 465. Draft Terms of Service (hosted at profish.app/terms)
- [ ] 466. Implement GDPR data export and deletion (right to erasure)
- [ ] 467. Implement cookie/tracking consent modal (EU requirement)
- [ ] 468. File trademark for "ProFish" (USPTO + EUIPO)

---

## 19. Launch & Marketing (~15 items)

- [ ] 469. Create ProFish landing page (profish.app — app store links, features, pricing)
- [ ] 470. Create ProFish social media accounts (Instagram, TikTok, YouTube, Facebook, X)
- [ ] 471. Produce app Store preview video (30-second feature walkthrough)
- [ ] 472. Write press release for launch
- [ ] 473. Create ASO-optimized screenshots (lifestyle mockups with FishCast, Map, Catches)
- [ ] 474. Plan soft launch: 2 regions first (NA + EU) → monitor for 1 week → global rollout
- [ ] 475. Set up Firebase Analytics events (screen_view, catch_logged, fishcast_viewed, purchase_completed, layer_toggled)
- [ ] 476. Set up RevenueCat analytics dashboard (MRR, churn, trial conversion)
- [ ] 477. Set up Sentry alerts (crash-free rate < 99%, new error spike)
- [ ] 478. Create launch day monitoring dashboard (Grafana or Firebase dashboard)
- [ ] 479. Prepare customer support flow (in-app feedback form → email → Zendesk/Freshdesk)
- [ ] 480. Seed community with 20+ catch posts from beta testers
- [ ] 481. Contact fishing influencers for review/partnership (10 outreach targets)
- [ ] 482. Submit to fishing app review sites (OutdoorGearLab, Field & Stream, etc.)
- [ ] 483. Plan launch pricing promotion (first month 50% off Pro annual)

---

## 20. Post-Launch & Scale (~15 items)

- [ ] 484. Monitor crash-free rate (target: >99.5%)
- [ ] 485. Monitor API latency and error rates (Open-Meteo, WorldTides, NOAA)
- [ ] 486. Monitor Firestore usage and costs (read/write/storage quotas)
- [ ] 487. Process user feedback from reviews and support tickets (weekly triage)
- [ ] 488. Ship v1.1 hotfix release within 1 week of launch (critical bugs)
- [ ] 489. Ship v1.2 feature release within 4 weeks (top-requested features)
- [ ] 490. Scale trigger: Add EU AWS region when EU MAU > 5K
- [ ] 491. Scale trigger: Add APAC AWS region when APAC MAU > 3K
- [ ] 492. Scale trigger: Upgrade Mapbox plan when approaching 25K MAU
- [ ] 493. Implement A/B testing framework (Firebase Remote Config + Analytics)
- [ ] 494. Run paywall A/B test (pricing, trial length, feature gating)
- [ ] 495. Implement referral program (invite friend → both get 1 week Pro free)
- [ ] 496. Plan Phase 2 development kick-off based on user analytics
- [ ] 497. Implement automated weekly analytics report email (MAU, revenue, retention)
- [ ] 498. Evaluate expansion: Apple Watch companion, Android Wear, widget support

---

## Progress Summary

| Section                             | Total   | Done    | Remaining | %       |
| ----------------------------------- | ------- | ------- | --------- | ------- |
| 1. Project Setup & Infrastructure   | 32      | 27      | 5         | 84%     |
| 2. Core Architecture                | 25      | 25      | 0         | 100%    |
| 3. FishCast Engine                  | 38      | 36      | 2         | 95%     |
| 4. Interactive Map                  | 51      | 43      | 8         | 84%     |
| 5. Catch Logging                    | 35      | 35      | 0         | 100%    |
| 6. Species Database                 | 23      | 17      | 6         | 74%     |
| 7. Internationalization             | 40      | 37      | 3         | 93%     |
| 8. Subscriptions & Monetization     | 25      | 16      | 9         | 64%     |
| 9. Authentication & User Management | 20      | 20      | 0         | 100%    |
| 10. Offline & Data Sync             | 20      | 20      | 0         | 100%    |
| 11. UI/UX & Components              | 30      | 27      | 3         | 90%     |
| 12. Community & Social              | 25      | 12      | 13        | 48%     |
| 13. Tournaments                     | 15      | 0       | 15        | 0%      |
| 14. Advanced Analytics              | 15      | 7       | 8         | 47%     |
| 15. AI Features                     | 15      | 0       | 15        | 0%      |
| 16. Marketplace                     | 10      | 0       | 10        | 0%      |
| 17. Testing & Quality               | 22      | 0       | 22        | 0%      |
| 18. App Store Preparation           | 27      | 1       | 26        | 4%      |
| 19. Launch & Marketing              | 15      | 0       | 15        | 0%      |
| 20. Post-Launch & Scale             | 15      | 0       | 15        | 0%      |
| **TOTAL**                           | **498** | **323** | **175**   | **65%** |

---

_ProFish — "The goal is aggressive and clear — to be the best, largest, and the only one that counts."_
