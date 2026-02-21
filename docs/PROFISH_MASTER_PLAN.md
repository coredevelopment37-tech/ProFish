# ProFish Master Plan v3.1 — "Lean Blitz"

## Mission
Build the world's best fishing app for 260M+ anglers. All countries, all 24 languages, day one.

## Budget: ~$5,000 (AI-Driven Development)

### Cost Breakdown
| Item | Cost |
|------|------|
| Apple Developer | $99/yr |
| Google Play | $25 (one-time) |
| AWS (us-east-1 single region) | $60-270/mo |
| WorldTides API | ~$100/mo |
| Mapbox (free tier 25K MAU) | $0 initially |
| Sentry (free tier) | $0 |
| Firebase (free tier) | $0 |
| RevenueCat (free tier < $2.5K MRR) | $0 |
| Domain + misc | ~$50 |
| **Total Year 1** | **~$3,000-5,000** |

## Phase 1: MVP Launch (Weeks 1-6)

### Core Features
1. **FishCast** — Weighted prediction algorithm (0-100 score)
   - Pressure (20%), Moon Phase (15%), Solunar (15%), Wind (12%)
   - Time of Day (12%), Tide (10%), Cloud Cover (8%), Precipitation (8%)
2. **Interactive Map** — Mapbox with 18 fishing layers + CPU budget system
3. **Catch Logging** — Species, weight, length, GPS, photo, bait, method, conditions
4. **Species Database** — 40+ species, 5 habitats, 12 regions
5. **24-Language i18n** — Gold/Silver/Bronze/Copper quality tiers
6. **Free/Pro Subscriptions** — RevenueCat, PPP-adjusted pricing

### Free Data Stack (Zero API Cost)
- **Open-Meteo** — Weather + marine forecasts (unlimited)
- **NOAA** — US tide predictions + nautical charts (free)
- **GEBCO** — Global bathymetry (open data)
- **Copernicus/Sentinel** — SST + chlorophyll (open data)
- **FishBase** — Species data (open)

### Architecture
- Single AWS region (us-east-1), CloudFront CDN global
- Firebase Auth (Google/Apple/Anonymous)
- Firestore + AsyncStorage offline-first
- React Native 0.83.1 (matching ProHunt for code sharing)

## Phase 2: Growth (Weeks 7-14)

### Features
- Social/Community feeds
- Tournament system
- Team/Guide subscription tiers ($149.99/yr, $249.99/yr)
- Advanced analytics (personal records, species heatmaps)
- Offline maps & data

### Scale Triggers
- Add EU region when EU MAU > 5K
- Add APAC region when APAC MAU > 3K
- Upgrade Mapbox when approaching 25K MAU

## Phase 3: Dominance (Weeks 15+)

### Features
- AI species identification (camera)
- Marketplace (gear, guides, charters)
- Branded guide reports
- Live tournament leaderboards
- AR catch measurement

## Subscription Model

| Tier | Price/yr | Catches/mo | Layers | FishCast | Offline |
|------|---------|-----------|--------|----------|---------|
| Free | $0 | 5 | 3 | Basic (today only) | No |
| Pro | $59.99 | Unlimited | 10 | Full (forecast) | Yes |
| Team | $149.99 | Unlimited | All | Full + shared | Yes |
| Guide | $249.99 | Unlimited | All | Full + client | Yes + branded |

## 24 Languages

### Gold Tier (full human-quality)
English, Swedish, Norwegian, German, French, Spanish, Portuguese (BR)

### Silver Tier (AI + review)
Arabic (RTL), Japanese, Korean, Finnish, Danish, Dutch, Italian

### Bronze Tier (AI-generated)
Polish, Czech, Turkish, Russian, Thai

### Copper Tier (AI-generated, community-improved)
Indonesian, Malay, Vietnamese, Hindi, Filipino

## 12 Target Regions
NA (North America), EU (Europe), NORDICS, GCC (Gulf), MENA (Middle East/North Africa),
SA (South America), CA (Central America), SEA (Southeast Asia), EA (East Asia),
SA_ASIA (South Asia), OC (Oceania), AF (Africa)

## Revenue Projections (Conservative)

| Month | MAU | Paid % | MRR |
|-------|-----|--------|-----|
| 3 | 1K | 3% | $150 |
| 6 | 5K | 4% | $1,000 |
| 12 | 25K | 5% | $6,250 |
| 18 | 100K | 6% | $30,000 |

## Key Differentiators vs Competition
1. **Global day-one** — Fishbrain/Fishidy are US/EU only
2. **Free data stack** — No expensive API dependencies
3. **FishCast algorithm** — Multi-factor weighted scoring, not just solunar
4. **24 languages** — Community-improvable translations
5. **ProHunt DNA** — Proven architecture, battle-tested patterns
6. **PPP pricing** — Fair pricing for every country

---
*"The goal is aggressive and clear — to be the best, largest, and the only one that counts."*
