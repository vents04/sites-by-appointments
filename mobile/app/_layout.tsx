import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { useAuthStore } from '../src/stores/authStore';
import { initializeLanguage } from '../src/i18n';
import '../src/i18n'; // Initialize i18n

export default function RootLayout() {
  const { business } = useAuthStore();

  useEffect(() => {
    // Initialize language from storage
    initializeLanguage();
  }, []);

  // Get primary color from business branding if available
  const primaryColor = business?.branding?.primaryColor;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialPrimaryColor={primaryColor}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(admin)" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
