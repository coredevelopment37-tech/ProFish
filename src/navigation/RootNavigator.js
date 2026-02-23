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
import useTheme from '../hooks/useTheme';
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

// Casting Simulator (#casting-sim)
const LazyCastingSimulator = lazyScreen(
  () => import('../screens/education/CastingSimulatorScreen'),
  'list',
);
const LazyCastingGame = lazyScreen(
  () => import('../screens/education/CastingGameScreen'),
  'detail',
);

// Night Fishing screens (#night-mode)
const LazyNightFishing = lazyScreen(
  () => import('../screens/night/NightFishingScreen'),
  'detail',
);
const LazyNightGear = lazyScreen(
  () => import('../screens/night/NightGearScreen'),
  'list',
);
const LazyNightSafety = lazyScreen(
  () => import('../screens/night/NightSafetyScreen'),
  'list',
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

// Tab bar icons — Lucide SVG icons (no emoji fallback)
import { Map as MapIcon, Fish, Target, Users, User, Circle } from 'lucide-react-native';
import FloatingTabBar from '../components/Navigation/FloatingTabBar';

const TAB_ICONS = {
  Map: MapIcon,
  Catches: Fish,
  FishCast: Target,
  Community: Users,
  Profile: User,
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
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarIcon: ({ color, size }) => {
          const IconComponent = TAB_ICONS[route.name] || Circle;
          return <IconComponent size={size} color={color} strokeWidth={2} />;
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
  const { colors } = useTheme();

  // Show loading while checking auth
  if (state.isLoading) {
    return (
      <View style={[loadStyles.container, { backgroundColor: colors.background }]}>
        <Fish size={64} color={colors.primary} strokeWidth={1.5} />
        <ActivityIndicator size="large" color={colors.primary} />
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
            name="CastingSimulator"
            component={LazyCastingSimulator}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="CastingGame"
            component={LazyCastingGame}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="NightFishing"
            component={LazyNightFishing}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="NightGear"
            component={LazyNightGear}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="NightSafety"
            component={LazyNightSafety}
            options={{ presentation: 'card' }}
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  logo: { fontSize: 64 },
});
