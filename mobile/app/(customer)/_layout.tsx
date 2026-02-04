import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeProvider';

// Tab bar icon component
const TabIcon = ({ icon, focused, color }: { icon: string; focused: boolean; color: string }) => (
  <Text style={{ fontSize: focused ? 26 : 24, opacity: focused ? 1 : 0.6 }}>{icon}</Text>
);

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="book"
        options={{
          title: t('booking.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="✂️" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('appointments.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="📅" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="⚙️" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
