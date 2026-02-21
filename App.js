/**
 * ProFish — Main App Component
 * Root component with all providers
 *
 * The world's best fishing app. 100+ countries. 24 languages. Day one.
 */

import React, { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import './src/config/i18n'; // Initialize i18n before any component renders
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/store/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import crashReporter from './src/services/crashReporter';
import analyticsService from './src/services/analyticsService';

// ── Silence known third-party warnings ─────────────────
LogBox.ignoreLogs([
  '&platform',
  'platform',
  'Reading from `value`',
  '[Reanimated]',
]);

// ── Deep linking configuration ──────────────────────
const linking = {
  prefixes: ['profish://', 'https://profish.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Map: 'map',
          Catches: 'catches',
          FishCast: 'fishcast',
          Community: 'community',
          Profile: 'profile',
        },
      },
      LogCatch: 'log',
      CatchDetail: 'catch/:id',
      SpeciesDetail: 'species/:speciesId',
    },
  },
};

export default function App() {
  const navigationRef = useRef(null);
  const routeNameRef = useRef(null);

  useEffect(() => {
    crashReporter.init();
    analyticsService.init();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <AppProvider>
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              onReady={() => {
                routeNameRef.current =
                  navigationRef.current?.getCurrentRoute()?.name;
              }}
              onStateChange={() => {
                const previousRouteName = routeNameRef.current;
                const currentRouteName =
                  navigationRef.current?.getCurrentRoute()?.name;
                if (
                  previousRouteName !== currentRouteName &&
                  currentRouteName
                ) {
                  analyticsService.logEvent('screen_view', {
                    screen_name: currentRouteName,
                  });
                }
                routeNameRef.current = currentRouteName;
              }}
            >
              <OfflineBanner />
              <RootNavigator />
            </NavigationContainer>
          </AppProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
