/**
 * FishingSchoolScreen — Browsable education library
 * #524 — Video/article library by category
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { ScreenHeader } from '../../components/Common';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'bookOpen' },
  { id: 'knots', label: 'Knots', icon: 'anchor' },
  { id: 'techniques', label: 'Techniques', icon: 'fish' },
  { id: 'bait', label: 'Bait & Lures', icon: 'anchor' },
  { id: 'species', label: 'Species', icon: 'fish' },
  { id: 'seasonal', label: 'Seasonal', icon: 'leaf' },
  { id: 'gear', label: 'Gear', icon: 'package' },
  { id: 'safety', label: 'Safety', icon: 'shieldAlert' },
];

// #526 — Bait & Lure encyclopedia, #527 — Technique library, #528 — Seasonal guides
const LESSONS = [
  // Knot section (#525)
  {
    id: 'knot_palomar',
    title: 'Palomar Knot',
    desc: 'The strongest all-purpose knot. Works with braided and mono line.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_improved_clinch',
    title: 'Improved Clinch Knot',
    desc: 'Go-to knot for tying hooks, lures, and swivels.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '2 min',
    icon: 'anchor',
  },
  {
    id: 'knot_uni',
    title: 'Uni Knot',
    desc: 'Versatile knot for hooks, swivels, and line-to-line connections.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_loop',
    title: 'Loop Knot',
    desc: 'Gives lures more action. Essential for topwater and jerkbaits.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_blood',
    title: 'Blood Knot',
    desc: 'Best for joining two lines of similar diameter.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '4 min',
    icon: 'anchor',
  },
  {
    id: 'knot_alberto',
    title: 'Alberto Knot',
    desc: 'Best braid-to-leader connection. Slim profile passes through guides.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '4 min',
    icon: 'anchor',
  },
  {
    id: 'knot_fg',
    title: 'FG Knot',
    desc: 'Thinnest, strongest braid-to-fluoro connection. Competition standard.',
    category: 'knots',
    difficulty: 'advanced',
    duration: '6 min',
    icon: 'anchor',
  },
  {
    id: 'knot_snell',
    title: 'Snell Knot',
    desc: 'Direct line-to-hook connection. Superior hook sets for live bait.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '4 min',
    icon: 'anchor',
  },
  {
    id: 'knot_dropper',
    title: 'Dropper Loop',
    desc: 'Create a loop mid-line for multi-hook rigs.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_bimini',
    title: 'Bimini Twist',
    desc: 'Double-line knot for big game fishing. Essential for offshore.',
    category: 'knots',
    difficulty: 'advanced',
    duration: '5 min',
    icon: 'anchor',
  },
  {
    id: 'knot_surgeon',
    title: "Surgeon's Knot",
    desc: 'Quick line-to-line connection for different diameters.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '2 min',
    icon: 'anchor',
  },
  {
    id: 'knot_nail',
    title: 'Nail Knot',
    desc: 'Fly line to leader connection. Clean and strong.',
    category: 'knots',
    difficulty: 'advanced',
    duration: '5 min',
    icon: 'anchor',
  },
  {
    id: 'knot_rapala',
    title: 'Rapala Knot',
    desc: 'Non-slip loop knot. Gives lures maximum freedom of action.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_perfection',
    title: 'Perfection Loop',
    desc: 'Creates a small, strong loop at the end of leader/tippet.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_davy',
    title: 'Davy Knot',
    desc: 'Fastest knot to tie. Great for quick fly changes.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '1 min',
    icon: 'anchor',
  },
  {
    id: 'knot_crazy_alberto',
    title: 'Crazy Alberto',
    desc: 'Modified Alberto with extra wraps for heavy braid applications.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '4 min',
    icon: 'anchor',
  },
  {
    id: 'knot_spider_hitch',
    title: 'Spider Hitch',
    desc: 'Quick double-line knot. Alternative to Bimini Twist.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_trilene',
    title: 'Trilene Knot',
    desc: 'Double-loop clinch knot. Excellent with monofilament.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '2 min',
    icon: 'anchor',
  },
  {
    id: 'knot_double_uni',
    title: 'Double Uni Knot',
    desc: 'Line-to-line connection that works with all line types.',
    category: 'knots',
    difficulty: 'beginner',
    duration: '3 min',
    icon: 'anchor',
  },
  {
    id: 'knot_san_diego_jam',
    title: 'San Diego Jam Knot',
    desc: 'Strong hook/lure knot favored by West Coast anglers.',
    category: 'knots',
    difficulty: 'intermediate',
    duration: '3 min',
    icon: 'anchor',
  },

  // Casting Simulator — special interactive entry (#casting-sim)
  {
    id: 'casting_simulator',
    title: 'Casting Simulator',
    desc: 'Practice 10 real casting techniques! Overhead, fly, surf, skipping & more.',
    category: 'techniques',
    difficulty: 'beginner',
    duration: 'Interactive',
    icon: 'gamepad',
    isSimulator: true,
  },

  // Technique section (#527)
  {
    id: 'tech_texas_rig',
    title: 'Texas Rig Basics',
    desc: 'The most versatile bass rig. Weedless soft plastic presentation.',
    category: 'techniques',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'fish',
  },
  {
    id: 'tech_carolina_rig',
    title: 'Carolina Rig',
    desc: 'Cover water fast. Drag soft plastics along the bottom.',
    category: 'techniques',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: 'fish',
  },
  {
    id: 'tech_drop_shot',
    title: 'Drop Shot Technique',
    desc: 'Finesse presentation for pressured fish. Deadly on bass and walleye.',
    category: 'techniques',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'fish',
  },
  {
    id: 'tech_topwater',
    title: 'Topwater Fishing',
    desc: 'Buzzbaits, poppers, frogs. The most exciting way to catch bass.',
    category: 'techniques',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'fish',
  },
  {
    id: 'tech_jigging',
    title: 'Vertical Jigging',
    desc: 'Metal jigs for deep structure. Effective for walleye, bass, and saltwater.',
    category: 'techniques',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: 'fish',
  },
  {
    id: 'tech_fly_casting',
    title: 'Fly Casting Fundamentals',
    desc: 'Roll cast, overhead cast, double haul. Master the basics.',
    category: 'techniques',
    difficulty: 'intermediate',
    duration: '15 min',
    icon: 'fish',
  },
  {
    id: 'tech_trolling',
    title: 'Trolling Techniques',
    desc: 'Speed, depth, spread. Effective for salmon, walleye, and pelagics.',
    category: 'techniques',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'fish',
  },
  {
    id: 'tech_live_bait',
    title: 'Live Bait Rigging',
    desc: 'Hook placement, weight selection, presentation for live bait.',
    category: 'techniques',
    difficulty: 'beginner',
    duration: '6 min',
    icon: 'fish',
  },
  {
    id: 'tech_neko_rig',
    title: 'Neko Rig',
    desc: 'Weighted wacky rig. Nose-down action drives bass crazy.',
    category: 'techniques',
    difficulty: 'intermediate',
    duration: '6 min',
    icon: 'fish',
  },
  {
    id: 'tech_bottom_fishing',
    title: 'Bottom Fishing',
    desc: 'Sinker rigs for reef, wreck, and structure fishing. Snapper, grouper, cod.',
    category: 'techniques',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'fish',
  },
  {
    id: 'tech_slow_pitch',
    title: 'Slow Pitch Jigging',
    desc: 'Japanese technique for deep water. Lethal on snapper and amberjack.',
    category: 'techniques',
    difficulty: 'advanced',
    duration: '12 min',
    icon: 'fish',
  },
  {
    id: 'tech_sight_fishing',
    title: 'Sight Fishing',
    desc: 'Polarized glasses + stealth. Target visible fish in clear water.',
    category: 'techniques',
    difficulty: 'advanced',
    duration: '10 min',
    icon: 'fish',
  },

  // Bait & Lure section (#526)
  {
    id: 'bait_soft_plastics',
    title: 'Soft Plastics Guide',
    desc: 'Worms, creatures, swimbaits. When to use each style.',
    category: 'bait',
    difficulty: 'beginner',
    duration: '10 min',
    icon: 'anchor',
  },
  {
    id: 'bait_crankbaits',
    title: 'Crankbait Selection',
    desc: 'Shallow, medium, deep divers. Match the lip to the depth.',
    category: 'bait',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: 'anchor',
  },
  {
    id: 'bait_spinnerbaits',
    title: 'Spinnerbait Mastery',
    desc: 'Blade types, colors, retrieves. The search bait king.',
    category: 'bait',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'anchor',
  },
  {
    id: 'bait_jigs',
    title: 'Jig Fishing Complete',
    desc: 'Casting jigs, swim jigs, football jigs. Year-round producer.',
    category: 'bait',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'anchor',
  },
  {
    id: 'bait_topwater_lures',
    title: 'Topwater Lure Guide',
    desc: 'Poppers, walkers, prop baits, buzzbaits. When each shines.',
    category: 'bait',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'anchor',
  },
  {
    id: 'bait_live_bait_types',
    title: 'Live Bait Encyclopedia',
    desc: 'Minnows, worms, shrimp, crabs, leeches. Best uses for each.',
    category: 'bait',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'anchor',
  },
  {
    id: 'bait_fly_patterns',
    title: 'Essential Fly Patterns',
    desc: 'Dry flies, nymphs, streamers, poppers. Top 20 patterns to own.',
    category: 'bait',
    difficulty: 'intermediate',
    duration: '12 min',
    icon: 'anchor',
  },
  {
    id: 'bait_color_selection',
    title: 'Lure Color Science',
    desc: 'Water clarity × light × depth = color choice. Backed by research.',
    category: 'bait',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: 'anchor',
  },

  // Seasonal section (#528)
  {
    id: 'season_spring_bass',
    title: 'Spring Bass Patterns',
    desc: 'Pre-spawn staging, spawn beds, post-spawn feeding frenzy.',
    category: 'seasonal',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'flower',
  },
  {
    id: 'season_summer_offshore',
    title: 'Summer Offshore Guide',
    desc: 'Follow the bait. Thermoclines, weed lines, current breaks.',
    category: 'seasonal',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'sun',
  },
  {
    id: 'season_fall_fishing',
    title: 'Fall Fishing Strategies',
    desc: 'Follow the baitfish migration. Best patterns species by species.',
    category: 'seasonal',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'leaf',
  },
  {
    id: 'season_winter_fishing',
    title: 'Winter Fishing Tips',
    desc: 'Slow down, fish deep, downsize lures. Cold water tactics.',
    category: 'seasonal',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: 'snowflake',
  },
  {
    id: 'season_ice_fishing',
    title: 'Ice Fishing 101',
    desc: 'Ice safety, gear essentials, jigging techniques, tip-ups.',
    category: 'seasonal',
    difficulty: 'beginner',
    duration: '12 min',
    icon: 'snowflake',
  },
  {
    id: 'season_night_fishing',
    title: 'Night Fishing Tactics',
    desc: 'Black lights, glow lures, sound. Catfish, walleye, bass after dark.',
    category: 'seasonal',
    difficulty: 'intermediate',
    duration: '8 min',
    icon: 'moon',
  },

  // Species guides
  {
    id: 'species_bass_101',
    title: 'Bass Fishing 101',
    desc: 'Largemouth vs smallmouth. Habitat, feeding patterns, seasonal moves.',
    category: 'species',
    difficulty: 'beginner',
    duration: '10 min',
    icon: 'fish',
  },
  {
    id: 'species_trout_guide',
    title: 'Trout Fishing Complete',
    desc: 'Rainbow, brown, brook. River reading, matching the hatch, presentation.',
    category: 'species',
    difficulty: 'intermediate',
    duration: '12 min',
    icon: 'fish',
  },
  {
    id: 'species_walleye',
    title: 'Walleye Tactics',
    desc: 'Structure, jigging, trolling, live bait. The Midwest trophy fish.',
    category: 'species',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'fish',
  },
  {
    id: 'species_catfish',
    title: 'Catfishing Guide',
    desc: 'Channel, blue, flathead. Bait, rigs, bank vs boat strategies.',
    category: 'species',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'fish',
  },
  {
    id: 'species_redfish',
    title: 'Redfish & Reds',
    desc: 'Sight fishing, bull reds, slot reds. Inshore mastery.',
    category: 'species',
    difficulty: 'intermediate',
    duration: '10 min',
    icon: 'fish',
  },
  {
    id: 'species_tuna',
    title: 'Tuna Fishing Guide',
    desc: 'Yellowfin, bluefin, blackfin. Trolling, chunking, jigging offshore.',
    category: 'species',
    difficulty: 'advanced',
    duration: '12 min',
    icon: 'fish',
  },

  // Gear section
  {
    id: 'gear_rods_101',
    title: 'Fishing Rod Guide',
    desc: 'Power, action, length. How to pick the right rod for any technique.',
    category: 'gear',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'package',
  },
  {
    id: 'gear_reels_101',
    title: 'Fishing Reel Guide',
    desc: 'Spinning, baitcasting, fly. Gear ratio, drag, ball bearings explained.',
    category: 'gear',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'package',
  },
  {
    id: 'gear_line_types',
    title: 'Fishing Line Guide',
    desc: 'Mono, fluoro, braid. Strengths, weaknesses, when to use each.',
    category: 'gear',
    difficulty: 'beginner',
    duration: '6 min',
    icon: 'package',
  },
  {
    id: 'gear_electronics',
    title: 'Fish Finders 101',
    desc: 'Sonar, GPS, mapping. How to read your screen and find fish.',
    category: 'gear',
    difficulty: 'intermediate',
    duration: '12 min',
    icon: 'package',
  },

  // Safety
  {
    id: 'safety_boat',
    title: 'Boat Safety Essentials',
    desc: 'PFDs, weather checks, float plans, man overboard procedures.',
    category: 'safety',
    difficulty: 'beginner',
    duration: '8 min',
    icon: 'shieldAlert',
  },
  {
    id: 'safety_hook_removal',
    title: 'Hook Removal Guide',
    desc: 'String method, advance-and-cut, when to go to the ER.',
    category: 'safety',
    difficulty: 'beginner',
    duration: '4 min',
    icon: 'shieldAlert',
  },
  {
    id: 'safety_fish_handling',
    title: 'Proper Fish Handling',
    desc: 'Wet hands, lip grip, support the belly. Catch & release best practices.',
    category: 'safety',
    difficulty: 'beginner',
    duration: '5 min',
    icon: 'shieldAlert',
  },
  {
    id: 'safety_wading',
    title: 'Wading Safety',
    desc: 'Current awareness, felt vs rubber soles, wading staff, buddy system.',
    category: 'safety',
    difficulty: 'beginner',
    duration: '5 min',
    icon: 'shieldAlert',
  },
];

// #530 — Beginner → Advanced progression system
const SKILL_LEVELS = [
  {
    level: 1,
    name: 'Beginner',
    requirement: 0,
    badge: 'fish',
    desc: 'Just getting started',
  },
  {
    level: 2,
    name: 'Novice',
    requirement: 5,
    badge: 'fish',
    desc: 'Learning the basics',
  },
  {
    level: 3,
    name: 'Intermediate',
    requirement: 15,
    badge: 'target',
    desc: 'Solid fundamentals',
  },
  {
    level: 4,
    name: 'Advanced',
    requirement: 30,
    badge: 'trophy',
    desc: 'Skilled angler',
  },
  {
    level: 5,
    name: 'Expert',
    requirement: 50,
    badge: 'crown',
    desc: 'Master of the craft',
  },
  {
    level: 6,
    name: 'Pro Angler',
    requirement: 75,
    badge: 'star',
    desc: 'Elite level',
  },
];

function CategoryPill({ cat, selected, onPress, styles }) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillActive]}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <AppIcon name={cat.icon} size={14} color="#ccc" />
        <Text style={styles.pillText}>{cat.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function LessonCard({ lesson, onPress, styles }) {
  const diffColor =
    lesson.difficulty === 'beginner'
      ? '#00D4AA'
      : lesson.difficulty === 'intermediate'
      ? '#FFA500'
      : '#FF4444';

  return (
    <TouchableOpacity style={styles.lessonCard} onPress={onPress}>
      <View style={styles.lessonEmoji}>
        <AppIcon name={lesson.icon} size={28} color="#00D4AA" />
      </View>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonDesc} numberOfLines={2}>
          {lesson.desc}
        </Text>
        <View style={styles.lessonMeta}>
          <View
            style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}
          >
            <Text style={[styles.diffText, { color: diffColor }]}>
              {lesson.difficulty}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name="timer" size={12} color="#8899aa" />
            <Text style={styles.duration}>{lesson.duration}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FishingSchoolScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return LESSONS;
    return LESSONS.filter(l => l.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader
        variant="large"
        title="Fishing School"
        subtitle={`${filtered.length} lessons`}
        onBack={() => navigation.goBack()}
      />

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillContent}
      >
        {CATEGORIES.map(cat => (
          <CategoryPill
            key={cat.id}
            cat={cat}
            selected={selectedCategory === cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            styles={styles}
          />
        ))}
      </ScrollView>

      {/* Lesson list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LessonCard
            lesson={item}
            styles={styles}
            onPress={() => {
              if (item.isSimulator) {
                navigation.navigate('CastingSimulator');
              } else if (item.category === 'knots') {
                navigation.navigate('KnotGuide', { knotId: item.id });
              }
              // Other categories navigate to their respective detail screens
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export { LESSONS, SKILL_LEVELS, CATEGORIES };

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    pillRow: { maxHeight: 48, marginBottom: 8 },
    pillContent: { paddingHorizontal: 16, gap: 8 },
    pill: {
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    pillText: { fontSize: 13, color: colors.text },
    listContent: { padding: 16, paddingBottom: 100 },
    lessonCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lessonEmoji: {
      width: 40,
      marginRight: 12,
      marginTop: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lessonContent: { flex: 1 },
    lessonTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    lessonDesc: {
      fontSize: 13,
      color: colors.textTertiary,
      lineHeight: 18,
      marginBottom: 8,
    },
    lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    diffText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    duration: { fontSize: 12, color: colors.textTertiary },
  });
