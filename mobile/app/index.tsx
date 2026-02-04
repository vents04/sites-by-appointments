import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Index() {
  const { businessCode, role, isLoading } = useAuthStore();
  const { theme } = useTheme();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If no business code, show auth flow
  if (!businessCode) {
    return <Redirect href="/(auth)" />;
  }

  // If logged in as admin, go to admin app
  if (role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  // If logged in as customer, go to customer app
  return <Redirect href="/(customer)/book" />;
}
