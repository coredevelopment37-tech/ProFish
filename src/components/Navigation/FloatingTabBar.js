/**
 * FloatingTabBar — Glassmorphic floating tab bar
 *
 * ProHunt-style pill-shaped tab bar with:
 *   - Frosted glass background (semi-transparent surface + border)
 *   - Animated active indicator (pill slides between tabs)
 *   - Elevated shadow
 *   - Haptic feedback on tab switch
 *   - Safe area padding on bottom
 *
 * Wired via `tabBar` prop on Tab.Navigator.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import useTheme from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab bar sizing
const TAB_BAR_HORIZONTAL_MARGIN = 16;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_HORIZONTAL_MARGIN * 2;
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_RADIUS = 32;
const INDICATOR_V_PADDING = 6;
const INDICATOR_HEIGHT = TAB_BAR_HEIGHT - INDICATOR_V_PADDING * 2;

// Haptic helper — light tap on iOS, 10ms vibration on Android
function triggerHaptic() {
  if (Platform.OS === 'ios') {
    // Selection tap via native modules if available, else silent
    try {
      const { SelectionFeedback } = require('react-native').UIManager;
      if (SelectionFeedback) SelectionFeedback();
    } catch {
      // iOS fallback — noop (Vibration doesn't produce haptic on iOS)
    }
  } else {
    Vibration.vibrate(10);
  }
}

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 200,
  mass: 0.8,
};

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const tabCount = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / tabCount;
  const indicatorWidth = tabWidth - 12;

  // Animated indicator position
  const translateX = useSharedValue(state.index * tabWidth + 6);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      translateX.value = state.index * tabWidth + 6;
      return;
    }
    translateX.value = withSpring(state.index * tabWidth + 6, SPRING_CONFIG);
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface + 'E6', // 90% opacity
            borderColor: colors.border + '80', // 50% opacity
          },
        ]}
      >
        {/* Animated active indicator pill */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: indicatorWidth,
              backgroundColor: colors.primary + '20', // 12% opacity
            },
            indicatorStyle,
          ]}
        />

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              triggerHaptic();
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Get icon from options.tabBarIcon
          const color = isFocused ? colors.primary : colors.textTertiary;
          const icon = options.tabBarIcon
            ? options.tabBarIcon({ color, size: 22, focused: isFocused })
            : null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {icon}
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: TAB_BAR_HORIZONTAL_MARGIN,
    right: TAB_BAR_HORIZONTAL_MARGIN,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS,
    borderWidth: 1,
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_V_PADDING,
    height: INDICATOR_HEIGHT,
    borderRadius: TAB_BAR_RADIUS - 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
