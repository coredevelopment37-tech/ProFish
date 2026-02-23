/**
 * ProFish Icon Registry — Centralized Lucide icon system
 *
 * Replaces all emoji-as-UI-icons with proper vector icons.
 * Uses lucide-react-native for consistent, scalable SVG icons.
 *
 * Usage:
 *   import { AppIcon } from '../constants/icons';
 *   <AppIcon name="fish" size={24} color={colors.text} />
 *
 * Or import specific Lucide icons directly:
 *   import { Fish, MapPin } from 'lucide-react-native';
 */

import React from 'react';
import {
  // Fish & Fishing
  Fish,
  Anchor,

  // Navigation & Location
  Map,
  MapPin,
  MapPinned,
  Compass,
  Globe,
  LocateFixed,
  Layers,

  // Targets & Scoring
  Target,
  Crosshair,
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Flame,
  Zap,
  Sparkles,

  // Data & Stats
  BarChart3,
  TrendingUp,
  TrendingDown,

  // Time & Calendar
  Clock,
  AlarmClock,
  Timer,
  Calendar,
  CalendarDays,

  // Notifications
  Bell,
  BellRing,

  // Search & Filter
  Search,
  Filter,

  // Actions
  X,
  Check,
  CheckCircle2,
  CircleCheck,
  Pencil,
  Trash2,
  Share2,
  Download,
  Upload,
  Camera,
  Plus,
  Minus,
  Save,
  RefreshCw,
  RotateCw,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,

  // Social
  Heart,
  MessageCircle,
  Users,
  User,
  UserPlus,

  // Settings & System
  Settings,
  Lock,
  AlertTriangle,
  AlertCircle,
  Ban,
  Info,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Shield,

  // Content & Education
  Lightbulb,
  BookOpen,
  GraduationCap,
  Gamepad2,
  FileText,
  ClipboardList,
  ScrollText,
  Link2,
  Mail,

  // Activities
  Rocket,
  PartyPopper,
  Gift,
  Flag,

  // Nature & Environment
  TreePine,
  Trees,
  Leaf,
  Mountain,
  Flower2,

  // Vessels
  Sailboat,
  Ship,

  // Safety & Emergency
  Phone,
  Radio,
  LifeBuoy,

  // Tech
  Smartphone,
  Bluetooth,
  Wifi,
  WifiOff,
  Satellite,
  SatelliteDish,
  Plug,
  Battery,
  Bot,

  // Commerce
  ShoppingCart,
  Package,

  // Measurement & Tools
  Ruler,
  Scale,
  Scissors,
  Wrench,
  Flashlight,
  Bug,

  // Gestures & Feedback
  ThumbsUp,

  // Science
  Dna,

  // Misc
  Swords,
  Infinity,
  Circle,
  CircleDot,
  Footprints,

  // Weather & Conditions
  Thermometer,
  Wind,
  Waves,
  Moon,
  MoonStar,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  Snowflake,
  Droplets,
  Droplet,
  Sunrise,
  Sunset,

  // Navigation UI
  Eye,
  EyeOff,
  Glasses,
  CircleDashed,
} from 'lucide-react-native';

// ── Icon Map ───────────────────────────────────────
// Maps semantic names (used in code) to Lucide components.
// Keeps the rest of the codebase decoupled from the icon library.
const ICON_MAP = {
  // ── Fish & Fishing ──
  fish: Fish,
  fishHook: Anchor,
  anchor: Anchor,

  // ── Navigation & Location ──
  map: Map,
  mapPin: MapPin,
  mapPinned: MapPinned,
  compass: Compass,
  globe: Globe,
  locateFixed: LocateFixed,
  layers: Layers,

  // ── Targets & Scoring ──
  target: Target,
  crosshair: Crosshair,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  crown: Crown,
  star: Star,
  flame: Flame,
  zap: Zap,
  sparkles: Sparkles,

  // ── Data & Stats ──
  barChart: BarChart3,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,

  // ── Time & Calendar ──
  clock: Clock,
  alarmClock: AlarmClock,
  timer: Timer,
  calendar: Calendar,
  calendarDays: CalendarDays,

  // ── Notifications ──
  bell: Bell,
  bellRing: BellRing,

  // ── Search ──
  search: Search,
  filter: Filter,

  // ── Actions ──
  close: X,
  x: X,
  check: Check,
  checkCircle: CheckCircle2,
  circleCheck: CircleCheck,
  edit: Pencil,
  trash: Trash2,
  share: Share2,
  download: Download,
  upload: Upload,
  camera: Camera,
  plus: Plus,
  minus: Minus,
  save: Save,
  refresh: RefreshCw,
  rotate: RotateCw,
  play: Play,
  stop: Square,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  arrowRight: ArrowRight,
  externalLink: ExternalLink,

  // ── Social ──
  heart: Heart,
  messageCircle: MessageCircle,
  users: Users,
  user: User,
  userPlus: UserPlus,

  // ── Settings & System ──
  settings: Settings,
  lock: Lock,
  alertTriangle: AlertTriangle,
  alertCircle: AlertCircle,
  ban: Ban,
  info: Info,
  helpCircle: HelpCircle,
  shield: Shield,
  shieldCheck: ShieldCheck,
  shieldAlert: ShieldAlert,

  // ── Content & Education ──
  lightbulb: Lightbulb,
  bookOpen: BookOpen,
  graduationCap: GraduationCap,
  gamepad: Gamepad2,
  fileText: FileText,
  clipboard: ClipboardList,
  scrollText: ScrollText,
  link: Link2,
  mail: Mail,

  // ── Activities ──
  rocket: Rocket,
  partyPopper: PartyPopper,
  gift: Gift,
  flag: Flag,

  // ── Nature & Environment ──
  treePine: TreePine,
  trees: Trees,
  leaf: Leaf,
  mountain: Mountain,
  flower: Flower2,
  freshwater: TreePine,
  saltwater: Waves,
  brackish: Leaf,

  // ── Vessels ──
  sailboat: Sailboat,
  ship: Ship,

  // ── Safety & Emergency ──
  phone: Phone,
  radio: Radio,
  lifebuoy: LifeBuoy,

  // ── Tech ──
  smartphone: Smartphone,
  bluetooth: Bluetooth,
  wifi: Wifi,
  wifiOff: WifiOff,
  satellite: Satellite,
  satelliteDish: SatelliteDish,
  plug: Plug,
  battery: Battery,
  bot: Bot,

  // ── Commerce ──
  shoppingCart: ShoppingCart,
  package: Package,
  backpack: Package,

  // ── Measurement & Tools ──
  ruler: Ruler,
  scale: Scale,
  scissors: Scissors,
  wrench: Wrench,
  flashlight: Flashlight,
  bug: Bug,

  // ── Feedback ──
  thumbsUp: ThumbsUp,

  // ── Science ──
  dna: Dna,

  // ── Misc ──
  swords: Swords,
  infinity: Infinity,
  circle: Circle,
  circleDot: CircleDot,
  circleDashed: CircleDashed,
  footprints: Footprints,
  eye: Eye,
  eyeOff: EyeOff,
  glasses: Glasses,

  // ── Weather ──
  thermometer: Thermometer,
  wind: Wind,
  waves: Waves,
  moon: Moon,
  moonStar: MoonStar,
  cloud: Cloud,
  cloudRain: CloudRain,
  cloudSnow: CloudSnow,
  cloudLightning: CloudLightning,
  sun: Sun,
  cloudSun: CloudSun,
  cloudFog: CloudFog,
  cloudDrizzle: CloudDrizzle,
  snowflake: Snowflake,
  droplets: Droplets,
  droplet: Droplet,
  sunrise: Sunrise,
  sunset: Sunset,
};

// ── AppIcon Component ──────────────────────────────
/**
 * Universal icon component for the entire app.
 *
 * @param {string}  name        - Semantic icon name (key from ICON_MAP)
 * @param {number}  size        - Icon size in px (default 24)
 * @param {string}  color       - Icon color (default '#FFFFFF')
 * @param {number}  strokeWidth - Stroke width (default 2)
 */
export function AppIcon({
  name,
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
  style,
  ...props
}) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) {
    if (__DEV__) {
      console.warn(`[AppIcon] Unknown icon name: "${name}"`);
    }
    return null;
  }
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      {...props}
    />
  );
}

// ── Weather Code Map ───────────────────────────────
// Maps WMO weather codes to icon names (replaces emoji weather map)
export const WEATHER_ICON_MAP = {
  0: 'sun',           // Clear sky
  1: 'cloudSun',      // Mainly clear
  2: 'cloudSun',      // Partly cloudy
  3: 'cloud',         // Overcast
  45: 'cloudFog',     // Fog
  48: 'cloudFog',     // Depositing rime fog
  51: 'cloudDrizzle', // Light drizzle
  53: 'cloudDrizzle', // Moderate drizzle
  55: 'cloudDrizzle', // Dense drizzle
  56: 'cloudDrizzle', // Freezing drizzle (light)
  57: 'cloudDrizzle', // Freezing drizzle (dense)
  61: 'cloudRain',    // Slight rain
  63: 'cloudRain',    // Moderate rain
  65: 'cloudRain',    // Heavy rain
  66: 'cloudRain',    // Freezing rain (light)
  67: 'cloudRain',    // Freezing rain (heavy)
  71: 'cloudSnow',    // Slight snow
  73: 'cloudSnow',    // Moderate snow
  75: 'cloudSnow',    // Heavy snow
  77: 'snowflake',    // Snow grains
  80: 'cloudRain',    // Slight rain showers
  81: 'cloudRain',    // Moderate rain showers
  82: 'cloudRain',    // Violent rain showers
  85: 'cloudSnow',    // Slight snow showers
  86: 'cloudSnow',    // Heavy snow showers
  95: 'cloudLightning', // Thunderstorm
  96: 'cloudLightning', // Thunderstorm w/ slight hail
  99: 'cloudLightning', // Thunderstorm w/ heavy hail
};

// ── Score Icon Map ─────────────────────────────────
// Maps score ranges to icon names (replaces emoji score indicators)
export const SCORE_ICON_MAP = {
  outstanding: 'flame',    // ≥85
  veryGood: 'fish',        // ≥70
  decent: 'thumbsUp',     // ≥55
  fair: 'minus',           // ≥40
  poor: 'moon',            // <40
};

export function getScoreIcon(score) {
  if (score >= 85) return 'flame';
  if (score >= 70) return 'fish';
  if (score >= 55) return 'thumbsUp';
  if (score >= 40) return 'minus';
  return 'moon';
}

// ── Notification Type Icons ────────────────────────
export const NOTIFICATION_ICON_MAP = {
  follower: 'user',
  comment: 'messageCircle',
  like: 'heart',
  fishcast: 'target',
  leaderboard: 'trophy',
  system: 'bell',
};

// ── Factor Icons ───────────────────────────────────
export const FACTOR_ICON_MAP = {
  pressure: 'thermometer',
  moonPhase: 'moon',
  solunarPeriod: 'target',
  wind: 'wind',
  timeOfDay: 'clock',
  tideState: 'waves',
  cloudCover: 'cloud',
  precipitation: 'cloudRain',
};

// ── Water Type Icons ───────────────────────────────
export const WATER_TYPE_ICON_MAP = {
  freshwater: 'treePine',
  Freshwater: 'treePine',
  saltwater: 'waves',
  Saltwater: 'waves',
  brackish: 'leaf',
  Brackish: 'leaf',
};

// Re-export commonly used icons for direct import
export {
  Fish,
  Map,
  MapPin,
  Target,
  Trophy,
  Users,
  User,
  Bell,
  Settings,
  Search,
  Heart,
  Flame,
  Star,
  Check,
  X,
  Camera,
  Waves,
  Moon,
  Anchor,
  Scale,
  Ruler,
  Compass,
  Globe,
  Lightbulb,
  BookOpen,
  AlertTriangle,
  Gift,
  Crown,
  Medal,
  Award,
  Trash2,
  Share2,
  Pencil,
  BarChart3,
  Clock,
  Calendar,
  Download,
  Thermometer,
  Wind,
  Shield,
  Rocket,
  Lock,
  Ban,
  CircleCheck,
  HelpCircle,
  MessageCircle,
};
