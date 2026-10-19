import React from 'react';
import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from
  '@expo/vector-icons';

import HomeScreen from
  '../screens/main/HomeScreen';
import CommunitiesScreen from
  '../screens/main/CommunitiesScreen';
import DiscoverScreen from
  '../screens/main/DiscoverScreen';
import PaymentsScreen from
  '../screens/main/PaymentsScreen';
import ProfileScreen from
  '../screens/main/ProfileScreen';

import { light } from
  '../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../theme/fonts';

type Props = {
  onLogout: () => Promise<void> | void;
};

const Tab = createBottomTabNavigator();

export default function BottomTabs({
  onLogout,
}: Props) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:
          light.primary,
        tabBarInactiveTintColor:
          light.textSecondary,

        tabBarStyle: {
          backgroundColor: light.card,
          borderTopColor: light.border,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: fontSize.xs,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="chatbubbles"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="people"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="compass"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="wallet"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="person-circle"
              size={size}
              color={color}
            />
          ),
        }}
      >
        {() => (
          <ProfileScreen
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}