/**
 * ProFish — Main App Component
 * Root component with all providers
 *
 * The world's best fishing app. 100+ countries. 24 languages. Day one.
 */

import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import './src/config/i18n'; // Initialize i18n before any component renders
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/store/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import crashReporter from './src/services/crashReporter';
import analyticsService from './src/services/analyticsService';

// ── Silence known third-party warnings ─────────────────
LogBox.ignoreLogs([
  '&platform',
  'platform',
  'Reading from `value`',
  '[Reanimated]',
]);

export default function App() {
  useEffect(() => {
    crashReporter.init();
    analyticsService.init();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
