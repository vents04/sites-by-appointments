import React from 'react';
import { Stack } from 'expo-router';

export default function BookLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="employee" />
      <Stack.Screen name="service" />
      <Stack.Screen name="datetime" />
      <Stack.Screen name="personal-data" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
