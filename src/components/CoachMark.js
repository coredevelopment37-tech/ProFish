/**
 * CoachMark — Tooltip overlay component for first-use feature highlights
 * #508 — Renders a positioned tooltip with dismiss action
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  shouldShowCoachMark,
  dismissCoachMark,
} from '../services/coachMarkService';
import useTheme from '../hooks/useTheme';
import { AppIcon } from '../constants/icons';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * @param {string} markId — coach mark key (e.g. 'MAP_LAYERS')
 * @param {Object} [anchorStyle] — position overrides {top, left, right, bottom}
 * @param {React.ReactNode} children — the wrapped element
 */
export default function CoachMark({ markId, anchorStyle, children }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [mark, setMark] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    let cancelled = false;
    shouldShowCoachMark(markId).then(m => {
      if (m && !cancelled) {
        setMark(m);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [markId, opacity, translateY]);

  const handleDismiss = async () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await dismissCoachMark(markId);
      setMark(null);
    });
  };

  return (
    <View>
      {children}
      {mark && (
        <Animated.View
          style={[
            styles.tooltip,
            mark.position === 'top' ? styles.tooltipTop : styles.tooltipBottom,
            anchorStyle,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.tooltipContent}>
            <AppIcon name={mark.emoji} size={28} color={colors.primary} />
            <View style={styles.tooltipTextWrap}>
              <Text style={styles.tooltipTitle}>{mark.title}</Text>
              <Text style={styles.tooltipMessage}>{mark.message}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.dismissText}>Got it </Text>
              <AppIcon name="check" size={14} color={colors.text} />
            </View>
          </TouchableOpacity>
          {/* Arrow */}
          <View
            style={[
              styles.arrow,
              mark.position === 'top' ? styles.arrowBottom : styles.arrowTop,
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  tooltip: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: SCREEN_W - 32,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
  },
  tooltipTop: { bottom: '100%', marginBottom: 12 },
  tooltipBottom: { top: '100%', marginTop: 12 },
  tooltipContent: { flexDirection: 'row', alignItems: 'flex-start' },
  tooltipEmoji: { fontSize: 28, marginRight: 12 },
  tooltipTextWrap: { flex: 1 },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  tooltipMessage: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  dismissBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dismissText: { fontSize: 13, fontWeight: '600', color: colors.text },
  arrow: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    left: 30,
  },
  arrowTop: { top: -6, borderTopWidth: 1, borderLeftWidth: 1 },
  arrowBottom: { bottom: -6, borderBottomWidth: 1, borderRightWidth: 1 },
});
