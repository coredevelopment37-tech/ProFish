/**
 * Root Navigator — ProFish
 * Auth flow → Main tabs with modals
 * #501 — Lazy loading via React.lazy() + Suspense for non-tab screens
 */

import React from 'react';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../store/AppContext';
import lazyScreen from '../components/LazyScreen';

// Auth screens (eagerly loaded — first impression)
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import AuthScreen from '../screens/auth/AuthScreen';

// Main tab screens (eagerly loaded — always visible)
import MapScreen from '../screens/main/MapScreen';
import CatchesScreen from '../screens/main/CatchesScreen';
import FishCastScreen from '../screens/main/FishCastScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Lazy-loaded screens — only loaded when navigated to (#501)
const LazyLogCatch = lazyScreen(
  () => import('../screens/main/LogCatchScreen'),
  'form',
);
const LazySpeciesDetail = lazyScreen(
  () => import('../screens/main/SpeciesDetailScreen'),
  'detail',
);
const LazyCatchDetail = lazyScreen(
  () => import('../screens/main/CatchDetailScreen'),
  'detail',
);
const LazyCatchStats = lazyScreen(
  () => import('../screens/main/CatchStatsScreen'),
  'detail',
);
const LazySettings = lazyScreen(
  () => import('../screens/main/SettingsScreen'),
  'list',
);
const LazyUserProfile = lazyScreen(
  () => import('../screens/community/UserProfileScreen'),
  'profile',
);
const LazyLeaderboard = lazyScreen(
  () => import('../screens/main/LeaderboardScreen'),
  'list',
);
const LazyNotificationCenter = lazyScreen(
  () => import('../screens/main/NotificationCenterScreen'),
  'list',
);
const LazyNotificationPrefs = lazyScreen(
  () => import('../screens/main/NotificationPrefsScreen'),
  'list',
);
const LazyCatchComparison = lazyScreen(
  () => import('../screens/main/CatchComparisonScreen'),
  'detail',
);
const LazySeasonalCalendar = lazyScreen(
  () => import('../screens/main/SeasonalCalendarScreen'),
  'detail',
);
const LazyTournamentList = lazyScreen(
  () => import('../screens/main/TournamentListScreen'),
  'list',
);
const LazyTournamentDetail = lazyScreen(
  () => import('../screens/main/TournamentDetailScreen'),
  'detail',
);
const LazyTournamentStats = lazyScreen(
  () => import('../screens/main/TournamentStatsScreen'),
  'detail',
);
const LazyOfflineMap = lazyScreen(
  () => import('../screens/main/OfflineMapScreen'),
  'map',
);
const LazyMarketplace = lazyScreen(
  () => import('../screens/main/MarketplaceScreen'),
  'list',
);
const LazyOnboarding = lazyScreen(
  () => import('../screens/onboarding/OnboardingScreen'),
  'detail',
);
const LazyFishingSchool = lazyScreen(
  () => import('../screens/education/FishingSchoolScreen'),
  'list',
);
const LazyKnotGuide = lazyScreen(
  () => import('../screens/education/KnotGuideScreen'),
  'detail',
);
const LazyTripPlanner = lazyScreen(
  () => import('../screens/planner/TripPlannerScreen'),
  'form',
);
const LazyBucketList = lazyScreen(
  () => import('../screens/tools/BucketListScreen'),
  'list',
);
const LazyMoonCalendar = lazyScreen(
  () => import('../screens/tools/MoonCalendarScreen'),
  'detail',
);
const LazyIsItLegal = lazyScreen(
  () => import('../screens/regulations/IsItLegalScreen'),
  'detail',
);
const LazyFishIdQuiz = lazyScreen(
  () => import('../screens/education/FishIdQuizScreen'),
  'detail',
);

// Paywall — wraps PaywallModal as a navigable screen (#fix-paywall)
import PaywallModal from '../components/PaywallModal';
function PaywallScreen({ navigation, route }) {
  return (
    <PaywallModal
      visible={true}
      onClose={() => navigation.goBack()}
      feature={route.params?.feature}
    />
  );
}

// Icons — graceful fallback if native module not linked yet
let Icon = null;
try {
  Icon = require('react-native-vector-icons/MaterialCommunityIcons').default;
} catch (e) {}

function TabIcon({ name, emoji, color, size }) {
  if (Icon) return <Icon name={name} size={size} color={color} />;
  return <Text style={{ fontSize: size - 4, color }}>{emoji}</Text>;
}

const TAB_ICONS = {
  Map: { name: 'map', emoji: '🗺️' },
  Catches: { name: 'fish', emoji: '🐟' },
  FishCast: { name: 'weather-partly-snowy-rainy', emoji: '🎯' },
  Community: { name: 'account-group', emoji: '👥' },
  Profile: { name: 'account-circle', emoji: '👤' },
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Auth" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0080FF',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
          paddingBottom: 4,
          height: 56,
        },
        tabBarIcon: ({ color, size }) => {
          const icon = TAB_ICONS[route.name] || { name: 'circle', emoji: '●' };
          return (
            <TabIcon
              name={icon.name}
              emoji={icon.emoji}
              color={color}
              size={size}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="FishCast"
        component={FishCastScreen}
        options={{ tabBarLabel: 'FishCast' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="Catches"
        component={CatchesScreen}
        options={{ tabBarLabel: 'Catches' }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: 'Community' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { state } = useApp();

  // Show loading while checking auth
  if (state.isLoading) {
    return (
      <View style={loadStyles.container}>
        <Text style={loadStyles.logo}>🐟</Text>
        <ActivityIndicator size="large" color="#0080FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state.isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Onboarding"
            component={LazyOnboarding}
            options={{ presentation: 'modal', gestureEnabled: false }}
          />
          <Stack.Screen
            name="LogCatch"
            component={LazyLogCatch}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="SpeciesDetail"
            component={LazySpeciesDetail}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="CatchDetail"
            component={LazyCatchDetail}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="CatchStats"
            component={LazyCatchStats}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Settings"
            component={LazySettings}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={LazyUserProfile}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LazyLeaderboard}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="NotificationCenter"
            component={LazyNotificationCenter}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="NotificationPrefs"
            component={LazyNotificationPrefs}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="CatchComparison"
            component={LazyCatchComparison}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="SeasonalCalendar"
            component={LazySeasonalCalendar}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="TournamentList"
            component={LazyTournamentList}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="TournamentDetail"
            component={LazyTournamentDetail}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="TournamentStats"
            component={LazyTournamentStats}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="OfflineMap"
            component={LazyOfflineMap}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Marketplace"
            component={LazyMarketplace}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="FishingSchool"
            component={LazyFishingSchool}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="KnotGuide"
            component={LazyKnotGuide}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="TripPlanner"
            component={LazyTripPlanner}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="BucketList"
            component={LazyBucketList}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="MoonCalendar"
            component={LazyMoonCalendar}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="IsItLegal"
            component={LazyIsItLegal}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="FishIdQuiz"
            component={LazyFishIdQuiz}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'transparentModal', headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen name="AuthFlow" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  logo: { fontSize: 64 },
});
