/**
 * Root Navigator — ProFish
 * Bottom tabs: Map | Catches | FishCast | Community | Profile
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import MapScreen from '../screens/main/MapScreen';
import CatchesScreen from '../screens/main/CatchesScreen';
import FishCastScreen from '../screens/main/FishCastScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import LogCatchScreen from '../screens/main/LogCatchScreen';
import SpeciesDetailScreen from '../screens/main/SpeciesDetailScreen';

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
        name="FishCast"
        component={FishCastScreen}
        options={{ tabBarLabel: 'FishCast' }}
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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    </Stack.Navigator>
  );
}
