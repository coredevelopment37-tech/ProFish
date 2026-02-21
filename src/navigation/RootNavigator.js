/**
 * Root Navigator — ProFish
 * Auth flow → Main tabs with modals
 */

import React from 'react';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../store/AppContext';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import AuthScreen from '../screens/auth/AuthScreen';

// Main screens
import MapScreen from '../screens/main/MapScreen';
import CatchesScreen from '../screens/main/CatchesScreen';
import FishCastScreen from '../screens/main/FishCastScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import LogCatchScreen from '../screens/main/LogCatchScreen';
import SpeciesDetailScreen from '../screens/main/SpeciesDetailScreen';
import CatchDetailScreen from '../screens/main/CatchDetailScreen';
import CatchStatsScreen from '../screens/main/CatchStatsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import UserProfileScreen from '../screens/community/UserProfileScreen';

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
            name="LogCatch"
            component={LogCatchScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="SpeciesDetail"
            component={SpeciesDetailScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="CatchDetail"
            component={CatchDetailScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="CatchStats"
            component={CatchStatsScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ presentation: 'card' }}
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
