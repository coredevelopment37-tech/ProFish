/**
 * Night Fishing Service — ProFish
 * World's first dedicated night fishing engine.
 * No competitor has ANY of this — this is our signature feature.
 *
 * Covers:
 *   - Night Score calculator (0–100)
 *   - Night species activity database (15+ species)
 *   - Smart gear checklist with connectivity (BLE / WiFi / SIM / None)
 *   - Light attraction planner
 *   - Night safety system
 *   - Flounder gigging mode
 *   - Night session logger
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NIGHT_SESSIONS_KEY = '@profish_night_sessions';
const NIGHT_PREFS_KEY = '@profish_night_prefs';
const SAFETY_CHECKIN_KEY = '@profish_night_safety';

// ─────────────────────────────────────────────────
// 1. NIGHT SPECIES DATABASE — 18 species
// ─────────────────────────────────────────────────

export const NIGHT_SPECIES = [
  {
    id: 'channel_catfish',
    name: 'Channel Catfish',
    emoji: '🐱',
    nightRating: 95,
    peakHours: '10:00 PM – 2:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Bottom rig with stink bait',
      'Chicken liver on circle hook',
      'Cut shad on slip sinker',
    ],
    bestBait: ['Chicken liver', 'Stink bait', 'Cut shad', 'Nightcrawlers'],
    lightPreference: 'dark',
    notes:
      'Catfish rely on smell and lateral line — total darkness is ideal. Stay near deep holes and channel bends.',
    waterTemp: { min: 55, max: 85, unit: 'F' },
  },
  {
    id: 'blue_catfish',
    name: 'Blue Catfish',
    emoji: '🐱',
    nightRating: 93,
    peakHours: '9:00 PM – 3:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Cut bait on bottom',
      'Drift fishing deep channels',
      'Anchored near dam tailraces',
    ],
    bestBait: ['Fresh cut skipjack', 'Shad', 'Herring'],
    lightPreference: 'dark',
    notes:
      'Blue cats hunt by scent and vibration. Fish the deepest holes you can find after dark.',
    waterTemp: { min: 50, max: 82, unit: 'F' },
  },
  {
    id: 'flathead_catfish',
    name: 'Flathead Catfish',
    emoji: '🐱',
    nightRating: 98,
    peakHours: '11:00 PM – 4:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Live bait on flat bottom',
      'Drift near submerged timber',
      'Set lines near rock ledges',
    ],
    bestBait: ['Live bluegill', 'Live shad', 'Live perch'],
    lightPreference: 'pitch_dark',
    notes:
      "Flatheads are THE night predator. They won't eat dead bait — must use live. Monsters come out after midnight.",
    waterTemp: { min: 60, max: 85, unit: 'F' },
  },
  {
    id: 'walleye',
    name: 'Walleye',
    emoji: '🐟',
    nightRating: 96,
    peakHours: '9:00 PM – 1:00 AM',
    bestMoonPhase: 'quarter_moon',
    techniques: [
      'Slow-roll crankbaits',
      'Jig + minnow on rocky points',
      'Slip bobber + leech near shore',
    ],
    bestBait: ['Live minnows', 'Leeches', 'Nightcrawlers', 'Crankbaits'],
    lightPreference: 'low_light',
    notes:
      'Walleye have tapetum lucidum (reflective eyes) — they SEE better than prey at night. This is their ambush time.',
    waterTemp: { min: 45, max: 72, unit: 'F' },
  },
  {
    id: 'crappie',
    name: 'Crappie',
    emoji: '🐠',
    nightRating: 88,
    peakHours: '8:00 PM – 12:00 AM',
    bestMoonPhase: 'any',
    techniques: [
      'Minnow under dock lights',
      'Jig vertical near submerged lights',
      'Spider rig with live bait',
    ],
    bestBait: ['Live minnows', 'Small jigs (1/16 oz)', 'Tube jigs'],
    lightPreference: 'attracted_to_light',
    notes:
      'Crappie stack up under lights. Green submersible lights are a game changer — drop one over the side and wait 30 min.',
    waterTemp: { min: 50, max: 75, unit: 'F' },
  },
  {
    id: 'largemouth_bass',
    name: 'Largemouth Bass',
    emoji: '🐟',
    nightRating: 85,
    peakHours: '9:00 PM – 12:00 AM',
    bestMoonPhase: 'full_moon',
    techniques: [
      'Black buzzbait along banks',
      'Dark spinnerbait slow-rolled',
      'Jig + chunk near docks',
    ],
    bestBait: [
      'Black buzzbait',
      'Dark-colored spinnerbaits',
      'Black/blue jigs',
      'Topwater frogs',
    ],
    lightPreference: 'moonlit',
    notes:
      'Use DARK lures (black, dark purple) — fish see silhouettes against the moonlit surface. Full moon nights are prime.',
    waterTemp: { min: 55, max: 85, unit: 'F' },
  },
  {
    id: 'striped_bass',
    name: 'Striped Bass',
    emoji: '🐟',
    nightRating: 92,
    peakHours: '10:00 PM – 2:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Topwater walking baits',
      'Live eels slow-drifted',
      'Chunk bait near bridge lights',
    ],
    bestBait: ['Live eels', 'Bunker chunks', 'Bucktail jigs', 'Topwater plugs'],
    lightPreference: 'bridge_lights',
    notes:
      'Stripers ambush baitfish pinned against bridge/dock lights. The shadow line is the strike zone.',
    waterTemp: { min: 50, max: 75, unit: 'F' },
  },
  {
    id: 'snook',
    name: 'Snook',
    emoji: '🐟',
    nightRating: 94,
    peakHours: '9:00 PM – 1:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Live bait drifted past dock lights',
      'Jerkbaits twitched in current',
      'Fly fishing with white streamers',
    ],
    bestBait: [
      'Live pilchards',
      'Live shrimp',
      'White paddle tails',
      'DOA shrimp',
    ],
    lightPreference: 'dock_lights',
    notes:
      'Snook set up in the shadow behind dock lights and ambush baitfish coming into the light. Cast PAST the light.',
    waterTemp: { min: 65, max: 85, unit: 'F' },
  },
  {
    id: 'flounder',
    name: 'Flounder (Gigging)',
    emoji: '🫓',
    nightRating: 90,
    peakHours: '9:00 PM – 2:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Wade gigging with LED light',
      'Boat gigging along flats',
      'Drift gigging with spotlight',
    ],
    bestBait: ['N/A — gigging only'],
    lightPreference: 'gigging_light',
    notes:
      'Flounder lay flat on sandy/muddy bottoms. Use powerful LED lights to spot them while wading. Calm, clear nights are best.',
    waterTemp: { min: 55, max: 80, unit: 'F' },
    gigMode: true,
  },
  {
    id: 'swordfish',
    name: 'Swordfish',
    emoji: '⚔️',
    nightRating: 99,
    peakHours: '8:00 PM – 4:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Deep drop with glow sticks',
      'Drift bait at 1600+ ft depth',
      'Electric reel deep drop',
    ],
    bestBait: ['Squid', 'Bonito belly strips', 'LED bait lights'],
    lightPreference: 'bait_lights',
    notes:
      'Swordfish rise from deep water to feed at night. Almost exclusively caught after dark. Attach glow sticks near bait.',
    waterTemp: { min: 60, max: 80, unit: 'F' },
  },
  {
    id: 'squid',
    name: 'Squid',
    emoji: '🦑',
    nightRating: 97,
    peakHours: '8:00 PM – 12:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Sabiki rigs under bright lights',
      'Squid jigs (egi) cast near lights',
      'Drop shot near pier lights',
    ],
    bestBait: ['Squid jigs (egi)', 'Sabiki rigs', 'Glow jigs'],
    lightPreference: 'bright_lights',
    notes:
      'Squid are phototactic — they swarm toward bright lights. Pier fishing with a bright lantern is legendary in Japan/Korea.',
    waterTemp: { min: 50, max: 70, unit: 'F' },
  },
  {
    id: 'brown_trout',
    name: 'Brown Trout',
    emoji: '🐟',
    nightRating: 88,
    peakHours: '10:00 PM – 2:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Mouse patterns on surface',
      'Dark streamer swings',
      'Large nymphs dead-drifted',
    ],
    bestBait: [
      'Mouse fly patterns',
      'Black woolly buggers',
      'Dark sculpins',
      'Large stonefly nymphs',
    ],
    lightPreference: 'pitch_dark',
    notes:
      'Trophy brown trout are almost exclusively nocturnal feeders. They hunt mice, frogs, and small fish on the surface at night.',
    waterTemp: { min: 40, max: 65, unit: 'F' },
  },
  {
    id: 'tarpon',
    name: 'Tarpon',
    emoji: '👑',
    nightRating: 91,
    peakHours: '10:00 PM – 3:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Live bait near bridge lights',
      'Drift bait through passes',
      'Fly fishing under lights',
    ],
    bestBait: ['Live mullet', 'Live crabs', 'Large streamers'],
    lightPreference: 'bridge_lights',
    notes:
      'Tarpon patrol bridge lights feeding on baitfish. The Florida Keys bridge fishing at night is world-famous.',
    waterTemp: { min: 72, max: 88, unit: 'F' },
  },
  {
    id: 'redfish',
    name: 'Redfish / Red Drum',
    emoji: '🔴',
    nightRating: 82,
    peakHours: '8:00 PM – 12:00 AM',
    bestMoonPhase: 'full_moon',
    techniques: [
      'Cut bait on bottom near jetties',
      'Topwater near marsh drains',
      'Live shrimp under popping cork',
    ],
    bestBait: ['Cut mullet', 'Live shrimp', 'Blue crab chunks'],
    lightPreference: 'moonlit',
    notes:
      'Redfish feed by feel and smell. Fish marsh drain outlets on falling tide at night — reds stack up there.',
    waterTemp: { min: 60, max: 85, unit: 'F' },
  },
  {
    id: 'carp',
    name: 'Carp',
    emoji: '🐟',
    nightRating: 86,
    peakHours: '9:00 PM – 3:00 AM',
    bestMoonPhase: 'any',
    techniques: [
      'Hair rig with boilies',
      'Pack bait (method feeder)',
      'Corn on sliding sinker',
    ],
    bestBait: ['Boilies', 'Sweetcorn', 'Bread', 'Dough balls'],
    lightPreference: 'dark',
    notes:
      'Carp are braver at night and feed in shallower water. European carp fishing is almost exclusively a night sport.',
    waterTemp: { min: 50, max: 80, unit: 'F' },
  },
  {
    id: 'bowfin',
    name: 'Bowfin',
    emoji: '🐲',
    nightRating: 80,
    peakHours: '9:00 PM – 1:00 AM',
    bestMoonPhase: 'any',
    techniques: [
      'Topwater near weed edges',
      'Live bait under float',
      'Cut bait on bottom',
    ],
    bestBait: ['Cut fish', 'Live minnows', 'Nightcrawlers'],
    lightPreference: 'dark',
    notes:
      'Bowfin are prehistoric apex predators that become more aggressive after dark. Handle with care — they bite!',
    waterTemp: { min: 55, max: 82, unit: 'F' },
  },
  {
    id: 'eel',
    name: 'Freshwater Eel',
    emoji: '🐍',
    nightRating: 95,
    peakHours: '10:00 PM – 4:00 AM',
    bestMoonPhase: 'new_moon',
    techniques: [
      'Nightcrawlers on bottom',
      'Cut fish on bank rod',
      'Small hook + worm near rocks',
    ],
    bestBait: ['Nightcrawlers', 'Cut fish', 'Small dead bait'],
    lightPreference: 'pitch_dark',
    notes:
      'Eels are almost exclusively nocturnal. They leave their rock shelters only after dark to hunt.',
    waterTemp: { min: 45, max: 75, unit: 'F' },
  },
  {
    id: 'zander',
    name: 'Zander (Pikeperch)',
    emoji: '🐟',
    nightRating: 94,
    peakHours: '9:00 PM – 1:00 AM',
    bestMoonPhase: 'quarter_moon',
    techniques: [
      'Soft plastic jig on bottom',
      'Slow trolling with crankbait',
      'Vertical jig near drop-offs',
    ],
    bestBait: ['Soft plastics', 'Live baitfish', 'Crankbaits'],
    lightPreference: 'low_light',
    notes:
      'Like walleye, zander have reflective eyes and dominate at night. The #1 night target in European freshwater.',
    waterTemp: { min: 42, max: 70, unit: 'F' },
  },
];

// ─────────────────────────────────────────────────
// 2. NIGHT GEAR CHECKLIST — 42 items with connectivity
// ─────────────────────────────────────────────────

/**
 * Connectivity types:
 *   'BLE'  — Bluetooth Low Energy (pairs with phone)
 *   'WiFi' — connects via local WiFi / hotspot
 *   'SIM'  — has its own cellular (SIM) connection
 *   'USB'  — wired connection
 *   'APP'  — standalone app on phone (no external hardware)
 *   'NONE' — no connectivity, passive gear
 *
 * category: essentials | lighting | electronics | safety |
 *           clothing | lures_bait | comfort | legal | gigging
 */

export const NIGHT_GEAR = [
  // ── LIGHTING (the core of night fishing) ──
  {
    id: 'ng_green_submersible',
    name: 'Green Submersible LED Light',
    emoji: '💚',
    category: 'lighting',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$30–$150',
    description:
      'Attracts plankton → baitfish → gamefish. Drop overboard and wait 30 min. The #1 night fishing tool.',
    brands: ['Amarine-made', 'Green Blob Outdoors', 'Illumisea', 'Hydro Glow'],
    powerSource: '12V boat battery or rechargeable',
    proTip:
      'Green light penetrates water best. Position upwind so the light field drifts toward your lines.',
  },
  {
    id: 'ng_uv_blacklight',
    name: 'UV/Blacklight Rod Tip Light',
    emoji: '🟣',
    category: 'lighting',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$15–$50',
    description:
      'Makes fluorescent fishing line glow without spooking fish. See your line in total darkness.',
    brands: ['Nocturnal Lights', 'UV Paqlite', 'Anglers LED'],
    powerSource: 'Battery (AA/AAA) or USB rechargeable',
    proTip:
      'Use fluorescent monofilament (Berkley Trilene) — it glows bright under UV. Braid does NOT glow.',
  },
  {
    id: 'ng_headlamp_red',
    name: 'Red-Light Headlamp',
    emoji: '🔴',
    category: 'lighting',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$20–$80',
    description:
      'Red light preserves night vision (takes 20–30 min to recover if you use white light). Must-have for night anglers.',
    brands: ['Petzl Actik Core', 'Black Diamond Spot', 'Nitecore NU25'],
    powerSource: 'Rechargeable (USB-C)',
    proTip:
      "NEVER use white light on the water unless emergency. Red light keeps your eyes adapted AND doesn't spook fish.",
  },
  {
    id: 'ng_dock_light',
    name: 'Portable Dock/Pier Light',
    emoji: '💡',
    category: 'lighting',
    connectivity: 'NONE',
    priority: 'recommended',
    priceRange: '$40–$120',
    description:
      'Portable version of permanent dock lights. Sets up an artificial feeding zone anywhere.',
    brands: ['GreenGlowDockLight', 'Hydro Glow', 'Berkley'],
    powerSource: '12V clip or rechargeable',
    proTip:
      'Position the light so the shadow line falls where your bait is. Predators lurk in the shadow.',
  },
  {
    id: 'ng_glowsticks',
    name: 'Chemical Glow Sticks (Rod Tip)',
    emoji: '✨',
    category: 'lighting',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$5–$15 (50-pack)',
    description:
      'Clip to rod tip as bite indicators. When the glow stick dips, set the hook!',
    brands: ['Starlite', 'Nite Ize', 'QualyQualy'],
    powerSource: 'Chemical (snap to activate)',
    proTip:
      'Green and yellow glow sticks are brightest. Attach with clear tape or glow stick holders.',
  },
  {
    id: 'ng_boat_nav_lights',
    name: 'Navigation Lights (Boat)',
    emoji: '🚢',
    category: 'lighting',
    connectivity: 'NONE',
    priority: 'legal_required',
    priceRange: '$20–$100',
    description:
      'Required by law on ALL vessels after sunset. Red (port), green (starboard), white (stern/masthead).',
    brands: ['Attwood', 'Hella', 'SeaSense'],
    powerSource: '12V boat electrical',
    proTip:
      'Carry a white all-around light as backup — if your lights fail, anchor and display the white light.',
  },

  // ── ELECTRONICS (Bluetooth / WiFi / SIM connected) ──
  {
    id: 'ng_bluetooth_sonar',
    name: 'Bluetooth Cast Sonar',
    emoji: '📡',
    category: 'electronics',
    connectivity: 'BLE',
    priority: 'recommended',
    priceRange: '$100–$300',
    description:
      'Castable fish finder that streams sonar data to your phone via Bluetooth. See fish in real-time at night.',
    brands: ['Deeper PRO+', 'Garmin Striker Cast', 'iBobber Pulse'],
    powerSource: 'Built-in rechargeable (USB)',
    bleProfile: 'GATT — custom sonar data streaming',
    appIntegration:
      'Receives depth, fish arches, bottom structure, water temp via BLE. Can overlay on ProFish map.',
    proTip:
      'Cast the sonar puck near your green light to see fish stacking up in real-time.',
  },
  {
    id: 'ng_bluetooth_bite_alarm',
    name: 'Bluetooth Bite Alarm',
    emoji: '🔔',
    category: 'electronics',
    connectivity: 'BLE',
    priority: 'essential',
    priceRange: '$30–$200',
    description:
      'Sends instant alert to your phone when a fish hits your line. Critical for multi-rod night setups.',
    brands: [
      'Prologic C-Series',
      'FOX Micron MXR+',
      'Delkim TXi-D',
      'Lixada Wireless',
    ],
    powerSource: 'Battery (CR2/9V)',
    bleProfile: 'BLE notification broadcast',
    appIntegration:
      'Push notification with rod number, intensity, run direction. Wake screen with vibrate + sound.',
    proTip:
      'Set different tones per rod so you know which one to grab in the dark without looking.',
  },
  {
    id: 'ng_smart_bobber',
    name: 'Smart Bluetooth Bobber',
    emoji: '🔵',
    category: 'electronics',
    connectivity: 'BLE',
    priority: 'optional',
    priceRange: '$40–$90',
    description:
      'LED bobber that sends bite alerts to phone + changes color on strike. See bites from 500+ ft away.',
    brands: ['iBobber', 'Deeper Nibble', 'ReelSonar'],
    powerSource: 'Rechargeable (micro-USB)',
    bleProfile: 'BLE bite detection + depth',
    appIntegration:
      'Bite notification, depth reading, water temp. Auto-logs strike time.',
    proTip:
      'The LED glow also attracts curious fish at night — double functionality.',
  },
  {
    id: 'ng_wifi_camera',
    name: 'Underwater WiFi Camera',
    emoji: '📹',
    category: 'electronics',
    connectivity: 'WiFi',
    priority: 'optional',
    priceRange: '$80–$400',
    description:
      'Live underwater video feed to your phone. Night vision models with IR LEDs see in total darkness.',
    brands: ['Eyoyo', 'Moocor', 'Aqua-Vu', 'GoFish Cam'],
    powerSource: 'Rechargeable battery (4–8 hr)',
    wifiSpec: '2.4GHz ad-hoc hotspot, 30m range',
    appIntegration:
      'Stream live video in ProFish. Record clips + screenshot to catch log. IR night vision mode.',
    proTip:
      'Position the camera near your green light to watch fish approach your bait in real-time. Incredible for learning.',
  },
  {
    id: 'ng_gps_tracker',
    name: 'Personal GPS Tracker (SOS)',
    emoji: '🆘',
    category: 'electronics',
    connectivity: 'SIM',
    priority: 'essential',
    priceRange: '$100–$350 + subscription',
    description:
      'Satellite/cellular SOS device. One-button emergency alert sends your GPS coordinates to rescue services.',
    brands: ['Garmin inReach Mini', 'SPOT Gen4', 'ACR Bivy Stick', 'ZOLEO'],
    powerSource: 'Rechargeable (weeks of standby)',
    simSpec: 'Iridium satellite network (global coverage, no cell needed)',
    appIntegration:
      'Share live tracking with buddies via ProFish. Auto check-in timer. SOS triggers emergency notification.',
    proTip:
      'This can literally save your life. If you fish alone at night — NEVER go without one.',
  },
  {
    id: 'ng_smart_watch',
    name: 'Fishing Smartwatch',
    emoji: '⌚',
    category: 'electronics',
    connectivity: 'BLE',
    priority: 'recommended',
    priceRange: '$200–$600',
    description:
      'Tide, solunar, barometer, GPS, and flashlight on your wrist. Some have night fishing modes.',
    brands: ['Garmin Instinct 2 Solar', 'Casio Pro Trek', 'Suunto Vertical'],
    powerSource: 'Rechargeable (solar option)',
    bleProfile: 'BLE sync with phone apps',
    appIntegration:
      'Sync FishCast alerts to watch. Quick-log catches via watch. Sunrise countdown on wrist.',
    proTip:
      'Garmin Instinct 2 has a built-in flashlight with red mode — perfect for night fishing.',
  },
  {
    id: 'ng_trolling_motor',
    name: 'GPS Trolling Motor (Spot-Lock)',
    emoji: '⚙️',
    category: 'electronics',
    connectivity: 'BLE',
    priority: 'optional',
    priceRange: '$1,500–$4,000',
    description:
      'GPS-anchored trolling motor holds your exact position at night. No anchor noise to spook fish.',
    brands: ['Minn Kota Ultrex', 'MotorGuide Xi5', 'Garmin Force'],
    powerSource: '24V/36V marine batteries',
    bleProfile: 'BLE remote control + GPS waypoints',
    appIntegration:
      'Save night spots as waypoints. Return to exact position on future sessions.',
    proTip:
      'Spot-Lock + green light = fish come to YOU. No need to move all night.',
  },
  {
    id: 'ng_power_bank',
    name: 'High-Capacity Power Bank',
    emoji: '🔋',
    category: 'electronics',
    connectivity: 'USB',
    priority: 'essential',
    priceRange: '$25–$80',
    description:
      'Keep your phone, lights, and Bluetooth gear charged all night. Get at least 20,000 mAh.',
    brands: ['Anker PowerCore', 'Goal Zero', 'Nitecore NB20000'],
    powerSource: 'USB-C input/output',
    proTip:
      'ProFish with GPS + sonar streaming drains battery fast. A 20K mAh bank gives you 3–4 full charges.',
  },

  // ── SAFETY ──
  {
    id: 'ng_life_jacket_auto',
    name: 'Auto-Inflate Life Jacket',
    emoji: '🦺',
    category: 'safety',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$60–$200',
    description:
      'Slim, wearable PFD that auto-inflates if you fall in. Night water is disorienting — this saves lives.',
    brands: ['Onyx M-24', 'Mustang MIT 70', 'Stearns 1271'],
    powerSource: 'CO2 cartridge (auto)',
    proTip:
      'Attach a strobe light to your PFD. If you go overboard at night, rescuers need to see you.',
  },
  {
    id: 'ng_strobe_light',
    name: 'Emergency Strobe / Signal Light',
    emoji: '🔦',
    category: 'safety',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$15–$40',
    description:
      'USCG-approved distress signal. Visible up to 5 nautical miles. Clip to PFD or keep in pocket.',
    brands: ['ACR C-Strobe', 'Weems & Plath', 'Orion'],
    powerSource: 'Battery (lasts 8+ hr)',
    proTip:
      'Keep one on your PFD and one in your tackle bag. Redundancy saves lives.',
  },
  {
    id: 'ng_whistle',
    name: 'Safety Whistle',
    emoji: '📢',
    category: 'safety',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$5–$15',
    description:
      'Sound carries better than light at night. 120dB whistle audible 1+ mile. Required by USCG on boats.',
    brands: ['Fox 40 Classic', 'Storm Safety Whistle', 'ACR WW-3'],
    powerSource: 'None (lung-powered)',
    proTip: 'Attach to your PFD zipper. Three short blasts = distress signal.',
  },
  {
    id: 'ng_first_aid',
    name: 'Waterproof First Aid Kit',
    emoji: '🏥',
    category: 'safety',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$15–$50',
    description:
      'Hook removal, cuts, stings, hypothermia blanket. Night injuries are harder to assess — be prepared.',
    brands: [
      'Adventure Medical Kits',
      'Surviveware',
      'Johnson & Johnson Marine',
    ],
    powerSource: 'N/A',
    proTip:
      'Include glow sticks in your kit — use them to illuminate the injury area without full white light.',
  },
  {
    id: 'ng_waterproof_phone_case',
    name: 'Waterproof Phone Case (IP68+)',
    emoji: '📱',
    category: 'safety',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$15–$40',
    description:
      'Your phone is your lifeline at night — GPS, flashlight, communication. Keep it waterproof.',
    brands: ['Catalyst', 'Ghostek Nautical', 'LifeProof FRĒ'],
    powerSource: 'N/A',
    proTip:
      'Test the case BEFORE going fishing. Submerge it with paper towels inside to check for leaks.',
  },
  {
    id: 'ng_buddy_radio',
    name: 'Walkie-Talkie / VHF Radio',
    emoji: '📻',
    category: 'safety',
    connectivity: 'SIM',
    priority: 'recommended',
    priceRange: '$30–$150',
    description:
      'Cell signal can be spotty on water at night. VHF Channel 16 is the universal distress frequency.',
    brands: ['Standard Horizon HX210', 'Cobra MR HH150', 'Motorola T800'],
    powerSource: 'Rechargeable or AA',
    proTip:
      'VHF marine radio is required on saltwater boats and monitored by Coast Guard 24/7.',
  },

  // ── CLOTHING ──
  {
    id: 'ng_reflective_jacket',
    name: 'Reflective/Hi-Vis Fishing Jacket',
    emoji: '🧥',
    category: 'clothing',
    connectivity: 'NONE',
    priority: 'recommended',
    priceRange: '$40–$120',
    description:
      "Other boats can't see you in the dark. Reflective tape on your jacket makes you visible in searchlights.",
    brands: ['Frogg Toggs', 'Grundéns', 'Simms'],
    powerSource: 'N/A',
    proTip: 'Add SOLAS-grade reflective tape to your PFD and tackle bag too.',
  },
  {
    id: 'ng_insulated_gloves',
    name: 'Insulated Fishing Gloves',
    emoji: '🧤',
    category: 'clothing',
    connectivity: 'NONE',
    priority: 'recommended',
    priceRange: '$15–$50',
    description:
      'Night temps drop fast. Fingerless gloves with flip mitts let you tie knots AND stay warm.',
    brands: ['Glacier Glove', 'Simms Windstopper', 'KastKing'],
    powerSource: 'N/A',
    proTip:
      'Keep a spare dry pair in a zip-lock bag. Wet gloves at night = misery.',
  },
  {
    id: 'ng_wading_boots_studded',
    name: 'Studded Wading Boots (Gigging)',
    emoji: '👢',
    category: 'clothing',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$80–$200',
    description:
      'For wade fishing/gigging at night. Studded soles prevent slipping on slick rocks and oyster beds.',
    brands: ['Korkers', 'Simms Tributary', 'Orvis Ultralight'],
    powerSource: 'N/A',
    proTip:
      'Stingrays shuffle! Drag your feet when wading at night — never step directly down.',
  },

  // ── LURES & BAIT ──
  {
    id: 'ng_glow_lures',
    name: 'Glow-in-Dark / UV Lures',
    emoji: '🌟',
    category: 'lures_bait',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$8–$30',
    description:
      'Charge with UV light then they glow underwater. Visible to fish in complete darkness.',
    brands: ['Z-Man GlowStikZ', 'Yo-Zuri Crystal Minnow', 'Luhr-Jensen'],
    powerSource: 'UV charge (30 sec under blacklight)',
    proTip:
      'Recharge lures every 15 min with your UV headlamp for maximum glow.',
  },
  {
    id: 'ng_dark_topwater',
    name: 'Dark-Colored Topwater Lures',
    emoji: '⬛',
    category: 'lures_bait',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$6–$20',
    description:
      'Black buzzbaits, dark frogs, black spinnerbaits. Fish see the dark silhouette against the lighter sky.',
    brands: [
      'Booyah Buzz',
      'Strike King Buzzbait',
      'River2Sea Whopper Plopper (black)',
    ],
    powerSource: 'N/A',
    proTip:
      'Counterintuitive: use DARK lures at night, not bright ones. The silhouette is what triggers strikes.',
  },
  {
    id: 'ng_rattle_lures',
    name: 'Rattle / Vibrating Lures',
    emoji: '🔊',
    category: 'lures_bait',
    connectivity: 'NONE',
    priority: 'recommended',
    priceRange: '$5–$15',
    description:
      'Internal rattles create noise/vibration that fish follow in zero visibility. Colorado blade spinnerbaits are best.',
    brands: ['Rat-L-Trap', 'Strike King Red Eye Shad', 'War Eagle Spinnerbait'],
    powerSource: 'N/A',
    proTip:
      'Colorado blades create more thump than willow blades — choose heavy vibration for night.',
  },
  {
    id: 'ng_scented_bait',
    name: 'Scented/Stink Baits',
    emoji: '👃',
    category: 'lures_bait',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$5–$20',
    description:
      "Scent is KING at night. Fish can't see bait clearly but they can smell it from hundreds of yards.",
    brands: [
      'Team Catfish',
      'Berkley Gulp!',
      "CJ's Catfish Punch Bait",
      'Pro-Cure',
    ],
    powerSource: 'N/A',
    proTip:
      'Apply scent spray even to artificial lures at night. Berkley Gulp! Alive spray works on everything.',
  },

  // ── COMFORT ──
  {
    id: 'ng_camp_chair',
    name: 'Reclining Bank Fishing Chair',
    emoji: '🪑',
    category: 'comfort',
    connectivity: 'NONE',
    priority: 'recommended',
    priceRange: '$30–$100',
    description:
      'Night fishing = patience. A reclining chair with rod holders lets you relax while waiting for bites.',
    brands: [
      'Earth Products Ultimate',
      'GCI Outdoor Freestyle Rocker',
      'KingCamp',
    ],
    powerSource: 'N/A',
    proTip:
      'Set up bite alarms on your rods so you can recline and still react to strikes.',
  },
  {
    id: 'ng_thermos',
    name: 'Insulated Thermos (Hot Drinks)',
    emoji: '☕',
    category: 'comfort',
    connectivity: 'NONE',
    priority: 'recommended',
    priceRange: '$15–$40',
    description:
      'Hot coffee or soup keeps morale high on cold nights. Insulated thermos keeps drinks hot 8+ hours.',
    brands: ['Stanley Classic', 'Yeti Rambler', 'Hydro Flask'],
    powerSource: 'N/A',
    proTip:
      'Pro catfishers swear by a thermos of chili on long night sessions.',
  },
  {
    id: 'ng_bug_repellent',
    name: 'Bug Repellent (Deet/Thermacell)',
    emoji: '🦟',
    category: 'comfort',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$10–$50',
    description:
      'Mosquitoes are 10x worse at night. A Thermacell creates a 15-ft bug-free zone — a game changer.',
    brands: ['Thermacell', 'Repel 100', 'Sawyer Permethrin (clothing)'],
    powerSource: 'Fuel cartridge (Thermacell) or spray',
    proTip:
      'Treat your clothes with Permethrin BEFORE the trip (good for 6 washes). Use Thermacell on the bank.',
  },

  // ── LEGAL ──
  {
    id: 'ng_fishing_license',
    name: 'Fishing License (Night Valid)',
    emoji: '📄',
    category: 'legal',
    connectivity: 'APP',
    priority: 'legal_required',
    priceRange: 'Varies by state/country',
    description:
      'Most licenses are valid 24/7 but some have night restrictions. Check IsItLegal in ProFish.',
    brands: [],
    powerSource: 'N/A',
    proTip:
      "Keep a digital copy AND a printed copy. Your phone might die — paper doesn't.",
  },
  {
    id: 'ng_gig_license',
    name: 'Gigging/Spearing Permit',
    emoji: '📜',
    category: 'legal',
    connectivity: 'APP',
    priority: 'legal_required',
    priceRange: 'Varies by state',
    description:
      'Flounder gigging requires a separate permit in many states. Check local regulations.',
    brands: [],
    powerSource: 'N/A',
    proTip:
      'Some states ban gigging of gamefish. Only flounder/suckers/rough fish may be legal. Always check.',
  },

  // ── GIGGING SPECIFIC ──
  {
    id: 'ng_gigging_light',
    name: 'High-Power Gigging LED Light',
    emoji: '🔆',
    category: 'gigging',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$50–$300',
    description:
      '10,000+ lumen LED light for wading. Illuminates the bottom clearly — spot flounder lying flat on sand.',
    brands: ['Swamp Eye Lights', 'Gigging Pro', 'Larson Electronics'],
    powerSource: '12V lithium battery (backpack or belt)',
    proTip:
      'LED over halogen — LEDs run cooler, lighter, longer. Get at least 8,000 lumens.',
  },
  {
    id: 'ng_gig_spear',
    name: 'Flounder Gig (Multi-Prong Spear)',
    emoji: '🔱',
    category: 'gigging',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$20–$80',
    description:
      '3–5 prong gig on telescoping handle. Strike quickly when you spot a flounder on the bottom.',
    brands: ['Frabill', 'Promar', 'Jay Fishing'],
    powerSource: 'N/A',
    proTip:
      "Aim BEHIND the head — that's where the widest part of the body is. Flounder are flat — adjust your angle.",
  },
  {
    id: 'ng_stringer_basket',
    name: 'Fish Stringer / Mesh Basket',
    emoji: '🧺',
    category: 'gigging',
    connectivity: 'NONE',
    priority: 'essential',
    priceRange: '$8–$25',
    description:
      'Carry your gigged flounder while wading. Clip to your belt loop or waders.',
    brands: ['Frabill', 'Promar', 'American Fishing Wire'],
    powerSource: 'N/A',
    proTip:
      "A floating mesh basket is better than a stringer — keeps fish fresh and doesn't drag while wading.",
  },
];

// ─────────────────────────────────────────────────
// 3. NIGHT SCORE CALCULATOR (0–100)
// ─────────────────────────────────────────────────

/**
 * Calculate a Night Fishing Score based on current conditions.
 * Factors: moon phase, cloud cover, wind, water temp, pressure trend, solunar.
 *
 * @param {Object} conditions
 * @param {number} conditions.moonIllumination   0–100 (% lit)
 * @param {string} conditions.moonPhase           'new'|'waxing_crescent'|'first_quarter'|'waxing_gibbous'|'full'|'waning_gibbous'|'last_quarter'|'waning_crescent'
 * @param {number} conditions.cloudCoverPercent   0–100
 * @param {number} conditions.windSpeedKmh        km/h
 * @param {number} conditions.waterTempF          °F
 * @param {number} conditions.pressureTrendMb     mb change last 3h (negative = dropping)
 * @param {boolean} conditions.isSolunarMajor     true if within a solunar major period
 * @param {boolean} conditions.isSolunarMinor     true if within a solunar minor period
 * @param {number} conditions.hoursAfterSunset    hours since sunset (0 = sunset)
 * @returns {{ score: number, rating: string, factors: Object[], bestSpecies: string[] }}
 */
export function calculateNightScore(conditions) {
  const {
    moonIllumination = 50,
    moonPhase = 'first_quarter',
    cloudCoverPercent = 50,
    windSpeedKmh = 10,
    waterTempF = 65,
    pressureTrendMb = 0,
    isSolunarMajor = false,
    isSolunarMinor = false,
    hoursAfterSunset = 2,
  } = conditions;

  let score = 50; // baseline
  const factors = [];

  // Moon illumination — sweet spot is 10–40% (enough light to see but not too bright)
  // For catfish/eel: 0% is best. For bass: 40–80% is best.
  // We use a general curve: lower is generally better for night fishing.
  if (moonIllumination < 10) {
    score += 15;
    factors.push({
      name: 'New Moon Darkness',
      impact: +15,
      desc: 'Pitch dark — predators dominate',
    });
  } else if (moonIllumination < 30) {
    score += 10;
    factors.push({
      name: 'Low Moonlight',
      impact: +10,
      desc: 'Low light favors night feeders',
    });
  } else if (moonIllumination < 50) {
    score += 5;
    factors.push({
      name: 'Moderate Moon',
      impact: +5,
      desc: 'Decent visibility for topwater',
    });
  } else if (moonIllumination < 80) {
    score += 0;
    factors.push({
      name: 'Bright Moon',
      impact: 0,
      desc: 'Some fish less active',
    });
  } else {
    score -= 5;
    factors.push({
      name: 'Full Moon Bright',
      impact: -5,
      desc: 'Very bright — some species retreat to depth',
    });
  }

  // Cloud cover — clouds block moonlight (darker = better for most night species)
  if (cloudCoverPercent > 80) {
    score += 10;
    factors.push({
      name: 'Overcast Sky',
      impact: +10,
      desc: 'Clouds block moonlight – maximum darkness',
    });
  } else if (cloudCoverPercent > 50) {
    score += 5;
    factors.push({
      name: 'Partly Cloudy',
      impact: +5,
      desc: 'Intermittent darkness',
    });
  }

  // Wind — calm nights are best for night fishing
  if (windSpeedKmh < 8) {
    score += 12;
    factors.push({
      name: 'Calm Night',
      impact: +12,
      desc: 'Still water — fish hear lures clearly',
    });
  } else if (windSpeedKmh < 16) {
    score += 5;
    factors.push({
      name: 'Light Breeze',
      impact: +5,
      desc: 'Slight ripple reduces spookiness',
    });
  } else if (windSpeedKmh > 30) {
    score -= 15;
    factors.push({
      name: 'High Wind',
      impact: -15,
      desc: 'Dangerous at night — consider staying home',
    });
  }

  // Water temperature — species-specific but general sweet spot 55–75°F
  if (waterTempF >= 55 && waterTempF <= 75) {
    score += 8;
    factors.push({
      name: 'Ideal Water Temp',
      impact: +8,
      desc: `${waterTempF}°F — peak activity range`,
    });
  } else if (waterTempF < 45) {
    score -= 10;
    factors.push({
      name: 'Cold Water',
      impact: -10,
      desc: `${waterTempF}°F — sluggish fish`,
    });
  } else if (waterTempF > 85) {
    score -= 5;
    factors.push({
      name: 'Warm Water',
      impact: -5,
      desc: `${waterTempF}°F — low oxygen, fish go deep`,
    });
  }

  // Pressure trend — dropping pressure = feeding frenzy
  if (pressureTrendMb < -2) {
    score += 12;
    factors.push({
      name: 'Falling Pressure',
      impact: +12,
      desc: 'Fish feed aggressively before fronts',
    });
  } else if (pressureTrendMb < -0.5) {
    score += 6;
    factors.push({
      name: 'Slight Pressure Drop',
      impact: +6,
      desc: 'Fish activity increasing',
    });
  } else if (pressureTrendMb > 3) {
    score -= 8;
    factors.push({
      name: 'Rising Pressure',
      impact: -8,
      desc: 'Post-front conditions — fish lockjaw',
    });
  }

  // Solunar — major/minor windows are peak feeding
  if (isSolunarMajor) {
    score += 15;
    factors.push({
      name: 'Solunar Major Period',
      impact: +15,
      desc: '2-hour peak feeding window!',
    });
  } else if (isSolunarMinor) {
    score += 8;
    factors.push({
      name: 'Solunar Minor Period',
      impact: +8,
      desc: '1-hour elevated activity',
    });
  }

  // Time after sunset curve — peak at 2–4 hours after sunset
  if (hoursAfterSunset >= 2 && hoursAfterSunset <= 4) {
    score += 8;
    factors.push({
      name: 'Prime Time Window',
      impact: +8,
      desc: '2–4 hrs after sunset — peak feed',
    });
  } else if (hoursAfterSunset >= 1 && hoursAfterSunset < 2) {
    score += 4;
    factors.push({
      name: 'Early Night',
      impact: +4,
      desc: 'Fish transitioning to night patterns',
    });
  } else if (hoursAfterSunset > 6) {
    score -= 3;
    factors.push({
      name: 'Late Night',
      impact: -3,
      desc: 'Activity slows after midnight for most species',
    });
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Rating
  let rating;
  if (score >= 85) rating = 'LEGENDARY';
  else if (score >= 70) rating = 'EXCELLENT';
  else if (score >= 55) rating = 'GOOD';
  else if (score >= 40) rating = 'FAIR';
  else rating = 'POOR';

  // Best species for current moon
  const bestSpecies = NIGHT_SPECIES.filter(s => {
    if (
      moonIllumination < 20 &&
      (s.lightPreference === 'pitch_dark' || s.lightPreference === 'dark')
    )
      return true;
    if (
      moonIllumination >= 20 &&
      moonIllumination < 60 &&
      (s.lightPreference === 'low_light' ||
        s.lightPreference === 'moonlit' ||
        s.lightPreference === 'dock_lights' ||
        s.lightPreference === 'bridge_lights')
    )
      return true;
    if (
      s.lightPreference === 'attracted_to_light' ||
      s.lightPreference === 'bright_lights' ||
      s.lightPreference === 'gigging_light' ||
      s.lightPreference === 'bait_lights'
    )
      return true;
    if (s.lightPreference === 'any') return true;
    return moonIllumination < 50; // fallback: most night species prefer darker
  })
    .sort((a, b) => b.nightRating - a.nightRating)
    .slice(0, 5)
    .map(s => s.name);

  return { score, rating, factors, bestSpecies };
}

// ─────────────────────────────────────────────────
// 4. NIGHT SESSION TRACKER
// ─────────────────────────────────────────────────

export async function startNightSession(locationName, targetSpecies) {
  const session = {
    id: `night_${Date.now()}`,
    startTime: new Date().toISOString(),
    endTime: null,
    locationName,
    targetSpecies,
    catches: [],
    gearUsed: [],
    moonPhase: null, // filled by caller
    nightScore: null, // filled by caller
    notes: '',
  };

  try {
    const existing = await AsyncStorage.getItem(NIGHT_SESSIONS_KEY);
    const sessions = existing ? JSON.parse(existing) : [];
    sessions.push(session);
    await AsyncStorage.setItem(NIGHT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    /* silent */
  }

  return session;
}

export async function endNightSession(sessionId, catches, notes) {
  try {
    const existing = await AsyncStorage.getItem(NIGHT_SESSIONS_KEY);
    if (!existing) return null;
    const sessions = JSON.parse(existing);
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx >= 0) {
      sessions[idx].endTime = new Date().toISOString();
      sessions[idx].catches = catches || [];
      sessions[idx].notes = notes || '';
      await AsyncStorage.setItem(NIGHT_SESSIONS_KEY, JSON.stringify(sessions));
      return sessions[idx];
    }
  } catch (e) {
    /* silent */
  }
  return null;
}

export async function getNightSessions() {
  try {
    const data = await AsyncStorage.getItem(NIGHT_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────────
// 5. SAFETY CHECK-IN SYSTEM
// ─────────────────────────────────────────────────

export const SAFETY_CHECKIN_INTERVALS = [
  { id: 'every_30', label: 'Every 30 min', ms: 30 * 60 * 1000 },
  { id: 'every_60', label: 'Every 60 min', ms: 60 * 60 * 1000 },
  { id: 'every_90', label: 'Every 90 min', ms: 90 * 60 * 1000 },
  { id: 'disabled', label: 'Disabled', ms: 0 },
];

export async function setSafetyCheckIn(intervalId, emergencyContact) {
  const config = {
    intervalId,
    emergencyContact,
    lastCheckIn: new Date().toISOString(),
    active: intervalId !== 'disabled',
  };
  await AsyncStorage.setItem(SAFETY_CHECKIN_KEY, JSON.stringify(config));
  return config;
}

export async function performCheckIn() {
  try {
    const data = await AsyncStorage.getItem(SAFETY_CHECKIN_KEY);
    if (!data) return null;
    const config = JSON.parse(data);
    config.lastCheckIn = new Date().toISOString();
    await AsyncStorage.setItem(SAFETY_CHECKIN_KEY, JSON.stringify(config));
    return config;
  } catch (e) {
    return null;
  }
}

// ─────────────────────────────────────────────────
// 6. LIGHT ATTRACTION PLANNER
// ─────────────────────────────────────────────────

export const LIGHT_GUIDE = {
  types: [
    {
      id: 'green_submersible',
      name: 'Green Submersible LED',
      color: '#00FF00',
      attractsPlankton: true,
      attractsBaitfish: true,
      attractsGamefish: false,
      chainReaction: 'Plankton → Baitfish → Gamefish follow in 20–45 min',
      bestFor: ['Crappie', 'Snook', 'Trout', 'Redfish', 'Squid'],
      setupTime: '30–45 min for full effect',
      placement:
        'Overboard, 2–4 ft depth. Upwind so light field drifts toward lines.',
      power: '12V (boat battery) or rechargeable lithium pack',
    },
    {
      id: 'white_submersible',
      name: 'White/Blue Submersible LED',
      color: '#00CCFF',
      attractsPlankton: true,
      attractsBaitfish: true,
      attractsGamefish: false,
      chainReaction:
        'Similar to green but attracts more bugs on surface. Green is preferred.',
      bestFor: ['Squid', 'Baitfish attraction'],
      setupTime: '30 min',
      placement:
        'Same as green. But attracts more surface insects — can be annoying.',
      power: '12V or rechargeable',
    },
    {
      id: 'dock_light',
      name: 'Dock/Pier Light (Overhead)',
      color: '#FFFF00',
      attractsPlankton: false,
      attractsBaitfish: true,
      attractsGamefish: true,
      chainReaction:
        'Creates light/shadow line. Predators lurk in shadow ambushing baitfish in light.',
      bestFor: ['Snook', 'Tarpon', 'Striped Bass', 'Flounder'],
      setupTime: 'Instant (find existing dock light)',
      placement:
        'Fish the shadow line, NOT the light. Cast past light and retrieve through the dark edge.',
      power: 'Existing infrastructure',
    },
    {
      id: 'uv_blacklight',
      name: 'UV/Blacklight (Rod Tip)',
      color: '#8B00FF',
      attractsPlankton: false,
      attractsBaitfish: false,
      attractsGamefish: false,
      chainReaction:
        'Does NOT attract fish — makes fluorescent line visible to angler only.',
      bestFor: ['Any species — angler visibility'],
      setupTime: 'Instant',
      placement:
        'Clip to rod holder or stake. Angle toward your line, NOT the water.',
      power: 'AA batteries or USB rechargeable',
    },
    {
      id: 'gigging_led',
      name: 'Gigging LED (High Power)',
      color: '#FFFFFF',
      attractsPlankton: false,
      attractsBaitfish: false,
      attractsGamefish: false,
      chainReaction:
        'Illuminates bottom for spotter. Flounder lie flat and blend — high lumens reveal them.',
      bestFor: ['Flounder gigging', 'Shrimping'],
      setupTime: 'Instant',
      placement:
        'Handheld or mount on wading staff. Angle toward bottom at 30–45°.',
      power: '12V lithium backpack battery (6–10 hr runtime)',
    },
  ],
  scienceExplainer:
    'Green light (wavelength ~520nm) penetrates water most efficiently. It attracts phytoplankton, which draws zooplankton, which brings baitfish, which brings gamefish. This food chain takes 20–45 minutes to establish. Green is 2–3x more effective than white or blue underwater.',
};

// ─────────────────────────────────────────────────
// 7. FLOUNDER GIGGING MODE
// ─────────────────────────────────────────────────

export const GIGGING_CONFIG = {
  bestConditions: {
    tide: 'Low outgoing (last 2 hours of falling tide)',
    water: 'Clear — visibility of at least 3 ft',
    wind: 'Calm (< 8 km/h) — wind stirs up sediment',
    moon: 'New moon or overcast (less ambient light = gigging light more effective)',
    temp: 'Water 60–80°F (flounder active)',
  },
  safetyRules: [
    'Always wear studded wading boots (oyster shells cut)',
    'Shuffle your feet (stingray shuffle) — NEVER step directly down',
    'Wade with a buddy — NEVER gig alone at night',
    'Carry a phone in waterproof case + whistle',
    "Know the tide schedule — don't get trapped by rising water",
    'Watch for jellyfish, sea snakes, and crabs',
    'Wear thick neoprene wading pants for protection',
  ],
  technique: {
    steps: [
      'Check tide chart — plan to gig during the last 2 hours of falling tide',
      'Enter water at a known sandy/muddy flat',
      'Walk slowly, sweeping your light across the bottom',
      'Look for the oval outline of a flounder — they bury themselves with only eyes showing',
      "When spotted, slowly lower the gig behind the fish's head",
      'Strike quickly and firmly — pin the flounder to the bottom',
      'Slide one hand under to secure, then put on stringer',
      'Move on — flounder often cluster in productive areas',
    ],
    whatToLookFor:
      'An oval shape, 2 small eyes on top, slight color difference from surrounding bottom. Once you spot your first one, your eyes "calibrate" and you\'ll start seeing them everywhere.',
  },
};

// ─────────────────────────────────────────────────
// 8. NIGHT FISHING EDUCATION LESSONS
// ─────────────────────────────────────────────────

export const NIGHT_LESSONS = [
  {
    id: 'night_101',
    title: 'Night Fishing 101: Getting Started',
    category: 'night_fishing',
    difficulty: 'beginner',
    duration: '8 min',
    emoji: '🌙',
    topics: [
      'Why fish at night',
      'Essential gear overview',
      'Safety basics',
      'Best species for beginners',
    ],
  },
  {
    id: 'night_lights',
    title: 'The Science of Underwater Lights',
    category: 'night_fishing',
    difficulty: 'intermediate',
    duration: '10 min',
    emoji: '💚',
    topics: [
      'Green vs white vs blue',
      'Food chain reaction',
      'Placement strategy',
      'DIY light rigs',
    ],
  },
  {
    id: 'night_moon_strategy',
    title: 'Moon Phase Strategy for Night Anglers',
    category: 'night_fishing',
    difficulty: 'intermediate',
    duration: '7 min',
    emoji: '🌑',
    topics: [
      'New moon vs full moon tactics',
      'Species preferences',
      'Cloud cover advantage',
      'Planning around moon calendar',
    ],
  },
  {
    id: 'night_catfish_mastery',
    title: 'Night Catfish Mastery',
    category: 'night_fishing',
    difficulty: 'intermediate',
    duration: '12 min',
    emoji: '🐱',
    topics: [
      'Channel vs Blue vs Flathead at night',
      'Best baits',
      'Location (holes, bends, tailraces)',
      'Multi-rod setups',
    ],
  },
  {
    id: 'night_topwater_bass',
    title: 'Topwater Bass After Dark',
    category: 'night_fishing',
    difficulty: 'advanced',
    duration: '10 min',
    emoji: '💥',
    topics: [
      'Black buzzbait technique',
      'Silhouette principle',
      'Full moon vs new moon',
      'Retrieve speed',
    ],
  },
  {
    id: 'night_walleye',
    title: 'Walleye: Born to Hunt at Night',
    category: 'night_fishing',
    difficulty: 'intermediate',
    duration: '9 min',
    emoji: '👁️',
    topics: [
      'Tapetum lucidum advantage',
      'Rocky point patterns',
      'Crankbait colors at night',
      'Current seams',
    ],
  },
  {
    id: 'night_dock_lights',
    title: 'Fishing Dock & Bridge Lights',
    category: 'night_fishing',
    difficulty: 'beginner',
    duration: '8 min',
    emoji: '🏗️',
    topics: [
      'The shadow line theory',
      'Target species',
      'Cast placement',
      'Etiquette around docks',
    ],
  },
  {
    id: 'night_gigging',
    title: 'Flounder Gigging: Complete Guide',
    category: 'night_fishing',
    difficulty: 'advanced',
    duration: '15 min',
    emoji: '🔱',
    topics: [
      'Equipment checklist',
      'Tide timing',
      'Spotting technique',
      'Wading safety',
      'Regulations',
    ],
  },
  {
    id: 'night_electronics',
    title: 'Night Electronics: Sonar, Cameras & Bluetooth',
    category: 'night_fishing',
    difficulty: 'intermediate',
    duration: '10 min',
    emoji: '📡',
    topics: [
      'Bluetooth sonar at night',
      'Underwater cameras with IR',
      'Bite alarms setup',
      'Phone battery management',
    ],
  },
  {
    id: 'night_safety_deep',
    title: 'Night Safety: Survive & Thrive',
    category: 'night_fishing',
    difficulty: 'beginner',
    duration: '12 min',
    emoji: '🆘',
    topics: [
      'PFD requirements',
      'Check-in systems',
      'Navigation lights law',
      'Hypothermia prevention',
      'Emergency GPS',
    ],
  },
  {
    id: 'night_squid_fishing',
    title: 'Squid Fishing Under Lights (Eging)',
    category: 'night_fishing',
    difficulty: 'intermediate',
    duration: '8 min',
    emoji: '🦑',
    topics: [
      'Japanese eging technique',
      'Light setup for squid',
      'Jig selection',
      'Best seasons and locations',
    ],
  },
  {
    id: 'night_carp_european',
    title: 'European Night Carp Fishing',
    category: 'night_fishing',
    difficulty: 'advanced',
    duration: '14 min',
    emoji: '🎣',
    topics: [
      'Bivvy setup',
      'Hair rig technique',
      'Bite alarm strategy',
      'Pre-baiting at night',
      'Session planning',
    ],
  },
];

// ─────────────────────────────────────────────────
// 9. CONNECTIVITY SUMMARY (for gear screen)
// ─────────────────────────────────────────────────

export function getConnectivitySummary() {
  const ble = NIGHT_GEAR.filter(g => g.connectivity === 'BLE');
  const wifi = NIGHT_GEAR.filter(g => g.connectivity === 'WiFi');
  const sim = NIGHT_GEAR.filter(g => g.connectivity === 'SIM');
  const usb = NIGHT_GEAR.filter(g => g.connectivity === 'USB');
  const app = NIGHT_GEAR.filter(g => g.connectivity === 'APP');
  const none = NIGHT_GEAR.filter(g => g.connectivity === 'NONE');

  return {
    bluetooth: {
      count: ble.length,
      items: ble.map(g => g.name),
      integration:
        'Direct BLE pairing with ProFish — real-time data streaming to app',
      protocol: 'Bluetooth Low Energy 5.0+ (GATT profiles)',
      range: '10–30m typical',
    },
    wifi: {
      count: wifi.length,
      items: wifi.map(g => g.name),
      integration:
        'WiFi Direct / ad-hoc hotspot — live video and data streaming',
      protocol: '2.4GHz 802.11n',
      range: '20–50m',
    },
    cellular: {
      count: sim.length,
      items: sim.map(g => g.name),
      integration:
        'Satellite/cellular SOS + live GPS tracking via ProFish buddy share',
      protocol: 'Iridium satellite / LTE-M',
      range: 'Global (satellite)',
    },
    usb: {
      count: usb.length,
      items: usb.map(g => g.name),
      integration: 'Wired charging for all connected devices',
    },
    appBased: {
      count: app.length,
      items: app.map(g => g.name),
      integration: 'Digital license verification in ProFish',
    },
    passive: {
      count: none.length,
      items: none.map(g => g.name),
      integration: 'Checklist tracking — check off as you pack',
    },
  };
}

export default {
  NIGHT_SPECIES,
  NIGHT_GEAR,
  NIGHT_LESSONS,
  LIGHT_GUIDE,
  GIGGING_CONFIG,
  SAFETY_CHECKIN_INTERVALS,
  calculateNightScore,
  startNightSession,
  endNightSession,
  getNightSessions,
  setSafetyCheckIn,
  performCheckIn,
  getConnectivitySummary,
};
