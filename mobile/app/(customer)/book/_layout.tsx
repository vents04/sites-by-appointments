import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeProvider';

export default function BookLayout() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="employee" />
      <Stack.Screen name="service" />
      <Stack.Screen name="datetime" />
      <Stack.Screen name="personal-data" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen 
        name="success" 
        options={{ 
          animation: 'fade',
          gestureEnabled: false,
        }} 
      />
    </Stack>
  );
}
