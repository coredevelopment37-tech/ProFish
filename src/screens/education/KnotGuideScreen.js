/**
 * KnotGuideScreen — Animated step-by-step knot tying diagrams
 * #525 — 20+ knots with animated diagrams
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

const { width } = Dimensions.get('window');

const KNOT_STEPS = {
  knot_palomar: {
    name: 'Palomar Knot',
    strength: '95%',
    bestFor: ['hooks', 'lures', 'swivels'],
    lineTypes: ['braid', 'mono', 'fluoro'],
    steps: [
      {
        step: 1,
        instruction:
          'Double about 6 inches of line and pass the loop through the eye of the hook.',
        diagram: '  ══╗\n  ══╝─── 🪝',
      },
      {
        step: 2,
        instruction:
          "Tie a loose overhand knot with the doubled line, don't tighten.",
        diagram: '  ╔══╗\n  ║  ║─── 🪝\n  ╚══╝',
      },
      {
        step: 3,
        instruction: 'Pass the loop over the hook completely.',
        diagram: '  ╔══╗\n  ║🪝║\n  ╚══╝',
      },
      {
        step: 4,
        instruction:
          'Moisten the knot and pull both ends to tighten. Trim the tag end.',
        diagram: '  ══╳═══ 🪝\n  ✂️ trim',
      },
    ],
  },
  knot_improved_clinch: {
    name: 'Improved Clinch Knot',
    strength: '90%',
    bestFor: ['hooks', 'lures', 'swivels'],
    lineTypes: ['mono', 'fluoro'],
    steps: [
      {
        step: 1,
        instruction:
          'Thread line through the eye of the hook. Pull 6 inches through.',
        diagram: '  ═══════─── 🪝',
      },
      {
        step: 2,
        instruction: 'Wrap the tag end around the standing line 5-7 times.',
        diagram: '  ═╱╲╱╲╱╲══─── 🪝',
      },
      {
        step: 3,
        instruction: 'Pass the tag end through the small loop near the eye.',
        diagram: '  ═╱╲╱╲╱╲══─── 🪝\n  └→ through loop',
      },
      {
        step: 4,
        instruction:
          'Then pass it back through the large loop you just created.',
        diagram: '  ═╱╲╱╲╱╲══─── 🪝\n  └→ through big loop',
      },
      {
        step: 5,
        instruction: 'Moisten and pull tight. Trim tag end.',
        diagram: '  ══╳═══ 🪝 ✂️',
      },
    ],
  },
  knot_uni: {
    name: 'Uni Knot',
    strength: '90%',
    bestFor: ['hooks', 'line-to-line', 'arbor'],
    lineTypes: ['mono', 'fluoro', 'braid'],
    steps: [
      {
        step: 1,
        instruction:
          'Run line through eye and lay tag alongside standing line.',
        diagram: '  ═══════─── 🪝\n  ═══════',
      },
      {
        step: 2,
        instruction: 'Make a loop by doubling back the tag end.',
        diagram: '  ╔═══╗\n  ║   ║─── 🪝\n  ═════',
      },
      {
        step: 3,
        instruction:
          'Wrap the tag end around both lines inside the loop 6 times.',
        diagram: '  ╔╱╲╱╲╱╲╗─── 🪝',
      },
      {
        step: 4,
        instruction:
          'Moisten and pull tag end to tighten coils. Slide knot to eye.',
        diagram: '  ══╳═══ 🪝 ✂️',
      },
    ],
  },
  knot_fg: {
    name: 'FG Knot',
    strength: '98%',
    bestFor: ['braid-to-leader'],
    lineTypes: ['braid + fluoro/mono'],
    steps: [
      {
        step: 1,
        instruction:
          'Tension the braid line (hold in teeth or use a pin). Lay leader across braid.',
        diagram: '  ─── braid ═══\n       │\n    leader',
      },
      {
        step: 2,
        instruction:
          'Wrap braid alternately over and under leader, 15-20 times.',
        diagram: '  ╱╲╱╲╱╲╱╲╱╲\n  leader through center',
      },
      {
        step: 3,
        instruction:
          "Pull leader tight — wraps should grip. Test it won't slip.",
        diagram: '  ╳╳╳╳╳╳╳╳╳╳╳\n  wraps locked',
      },
      {
        step: 4,
        instruction: 'Half-hitch braid over leader 5-6 times to lock.',
        diagram: '  ╳╳╳╳╳ ○○○○○\n  wraps + half hitches',
      },
      {
        step: 5,
        instruction: 'Alternate half-hitches on each side. Trim tags close.',
        diagram: '  ══╳╳╳○○○══ ✂️\n  slimmest knot possible',
      },
    ],
  },
  knot_alberto: {
    name: 'Alberto Knot',
    strength: '95%',
    bestFor: ['braid-to-leader'],
    lineTypes: ['braid + fluoro/mono'],
    steps: [
      {
        step: 1,
        instruction: 'Double the leader end to form a loop (6 inches).',
        diagram: '  ═══╗\n  ═══╝ (leader loop)',
      },
      {
        step: 2,
        instruction: 'Pass braid through leader loop, wrap 7 times going away.',
        diagram: '  ╱╱╱╱╱╱╱\n  ═══╗ braid wrapping out',
      },
      {
        step: 3,
        instruction: 'Then wrap 7 times back toward the loop.',
        diagram: '  ╱╱╱╱╱╱╱╲╲╲╲╲╲╲\n  ═══╗ wrapping back',
      },
      {
        step: 4,
        instruction:
          'Pass braid back through the loop (same side you entered).',
        diagram: '  wraps ═══╗\n  braid exits same side',
      },
      {
        step: 5,
        instruction: 'Moisten. Pull all 4 ends slowly. Trim close.',
        diagram: '  ══╳══ ✂️ slim profile',
      },
    ],
  },
  knot_blood: {
    name: 'Blood Knot',
    strength: '85%',
    bestFor: ['line-to-line', 'similar diameter'],
    lineTypes: ['mono', 'fluoro'],
    steps: [
      {
        step: 1,
        instruction: 'Overlap two line ends by 6 inches.',
        diagram: '  ═══════\n       ═══════',
      },
      {
        step: 2,
        instruction: 'Wrap one tag around the other line 5 times.',
        diagram: '  ═╱╲╱╲╱╲══\n       ═══════',
      },
      {
        step: 3,
        instruction: 'Repeat with the other tag in the opposite direction.',
        diagram: '  ═╱╲╱╲╱╲══\n  ══╱╲╱╲╱╲═',
      },
      {
        step: 4,
        instruction:
          'Pass both tag ends through the center gap in opposite directions.',
        diagram: '  →╱╲╱╲╱╲←\n  center opening',
      },
      {
        step: 5,
        instruction: 'Moisten, pull standing lines to tighten. Trim tags.',
        diagram: '  ═══╳═══ ✂️✂️',
      },
    ],
  },
  knot_loop: {
    name: 'Non-Slip Loop Knot',
    strength: '90%',
    bestFor: ['lures', 'topwater', 'jerkbaits'],
    lineTypes: ['mono', 'fluoro'],
    steps: [
      {
        step: 1,
        instruction: 'Tie a loose overhand knot 10 inches from the end.',
        diagram: '  ═══○═══ (loose)',
      },
      {
        step: 2,
        instruction:
          'Pass tag through hook eye, then back through the overhand loop.',
        diagram: '  ═══○═══ 🪝\n  tag → through loop',
      },
      {
        step: 3,
        instruction:
          'Wrap tag around standing line 4-5 times (above the overhand).',
        diagram: '  ═╱╲╱╲╱╲○═══ 🪝',
      },
      {
        step: 4,
        instruction:
          'Pass tag back through overhand knot (same side it exited).',
        diagram: '  tag back through ○',
      },
      {
        step: 5,
        instruction:
          'Moisten and tighten. Loop should hang freely from hook eye.',
        diagram: '  ═══╳──○──🪝\n  loop gives action',
      },
    ],
  },
  knot_snell: {
    name: 'Snell Knot',
    strength: '97%',
    bestFor: ['hooks', 'live bait', 'big game'],
    lineTypes: ['mono', 'fluoro'],
    steps: [
      {
        step: 1,
        instruction:
          'Thread line through hook eye. Run 6 inches along the shank.',
        diagram: '  ═══──🪝\n  line along shank',
      },
      {
        step: 2,
        instruction: 'Form a loop below the hook shank.',
        diagram: '  ═══╗\n  ═══╝──🪝 (loop under)',
      },
      {
        step: 3,
        instruction:
          'Wrap tag around shank and line 7-8 times, working toward the eye.',
        diagram: '  ╱╲╱╲╱╲╱╲──🪝\n  wrapping toward eye',
      },
      {
        step: 4,
        instruction: 'Hold wraps tight and pull standing line to close. Trim.',
        diagram: '  ══╳╳╳╳──🪝 ✂️\n  line exits top of eye',
      },
    ],
  },
};

function DiagramText({ text, styles }) {
  // Split on {hook} and {cut} markers and render AppIcon inline
  const parts = text.split(/(\{hook\}|\{cut\})/g);
  return (
    <Text style={styles.diagramText}>
      {parts.map((part, i) => {
        if (part === '{hook}') return <AppIcon key={i} name="anchor" size={14} color="#00D4AA" />;
        if (part === '{cut}') return <AppIcon key={i} name="scissors" size={14} color="#FF6666" />;
        return part;
      })}
    </Text>
  );
}

function KnotStepCard({ step, total, data, styles }) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step}</Text>
        </View>
        <Text style={styles.stepOf}>of {total}</Text>
      </View>
      <Text style={styles.stepInstruction}>{data.instruction}</Text>
      <View style={styles.diagramBox}>
        <DiagramText text={data.diagram} styles={styles} />
      </View>
    </View>
  );
}

export default function KnotGuideScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const knotId = route?.params?.knotId || 'knot_palomar';
  const knot = KNOT_STEPS[knotId];
  const [currentStep, setCurrentStep] = useState(0);

  if (!knot) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Knot guide not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          <AppIcon name="anchor" size={22} color="#fff" /> {knot.name}
        </Text>
      </View>

      {/* Knot info */}
      <View style={styles.infoRow}>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>Strength</Text>
          <Text style={styles.infoValue}>{knot.strength}</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>Line Types</Text>
          <Text style={styles.infoValue}>{knot.lineTypes.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.bestForRow}>
        <Text style={styles.bestForLabel}>Best for: </Text>
        {knot.bestFor.map(b => (
          <View key={b} style={styles.bestForChip}>
            <Text style={styles.bestForText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* Step content */}
      <ScrollView
        style={styles.stepsContainer}
        contentContainerStyle={styles.stepsContent}
      >
        {knot.steps.map((s, i) => (
          <KnotStepCard
            key={i}
            step={s.step}
            total={knot.steps.length}
            data={s}
            styles={styles}
          />
        ))}
      </ScrollView>

      {/* Step navigation */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]}
          onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.navStep}>
          {currentStep + 1} / {knot.steps.length}
        </Text>
        <TouchableOpacity
          style={[
            styles.navBtn,
            currentStep === knot.steps.length - 1 && styles.navBtnDisabled,
          ]}
          onPress={() =>
            currentStep < knot.steps.length - 1 &&
            setCurrentStep(currentStep + 1)
          }
        >
          <Text style={styles.navBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export { KNOT_STEPS };

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { fontSize: 16, color: colors.primary, marginBottom: 8 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
    infoRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 12,
    },
    infoPill: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoLabel: { fontSize: 11, color: colors.textTertiary, marginBottom: 4 },
    infoValue: { fontSize: 14, fontWeight: '700', color: colors.accent },
    bestForRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    bestForLabel: { fontSize: 13, color: colors.textTertiary },
    bestForChip: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 6,
      marginBottom: 4,
    },
    bestForText: { fontSize: 12, color: colors.primary },
    stepsContainer: { flex: 1 },
    stepsContent: { padding: 16, paddingBottom: 100 },
    stepCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepBadgeText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    stepOf: { fontSize: 12, color: colors.textTertiary, marginLeft: 8 },
    stepInstruction: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 12,
    },
    diagramBox: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    diagramText: {
      fontFamily: 'monospace',
      fontSize: 14,
      color: colors.accent,
      lineHeight: 20,
    },
    nav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      paddingTop: 12,
    },
    navBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: colors.primary,
      borderRadius: 20,
    },
    navBtnDisabled: { opacity: 0.3 },
    navBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
    navStep: { fontSize: 14, color: colors.textTertiary },
    errorText: {
      fontSize: 18,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: 100,
    },
  });
