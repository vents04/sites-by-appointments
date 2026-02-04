import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { Button } from '../../../src/components/ui';

export default function SuccessScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { getPreferencesForBusiness, businessPreferences } = useUserPreferencesStore();

  const { colors, spacing, typography } = theme;

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate in
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    opacity.value = withDelay(200, withSpring(1));
    confettiOpacity.value = withSequence(
      withDelay(300, withSpring(1)),
      withDelay(2000, withSpring(0.3))
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const handleAddToCalendar = async () => {
    // In a real app, this would use expo-calendar to add the event
    // For now, just show a message
    console.log('Add to calendar pressed');
  };

  const handleGoHome = () => {
    router.replace('/(customer)/book');
  };

  // Get the email from saved preferences
  const allPreferences = Object.values(businessPreferences);
  const lastEmail = allPreferences.find(p => p.personalData?.email)?.personalData?.email || '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Confetti emoji */}
        <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
          <Text style={styles.confetti}>🎉</Text>
          <Text style={styles.confetti}>✨</Text>
          <Text style={styles.confetti}>🎊</Text>
        </Animated.View>

        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.success },
            ]}
          >
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.messageContainer, contentAnimatedStyle]}>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
            {t('booking.success.title')}
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            {t('booking.success.emailSent')}
          </Text>
          {lastEmail && (
            <Text
              style={[
                typography.body,
                { color: colors.primary, textAlign: 'center', fontWeight: '600' },
              ]}
            >
              {lastEmail}
            </Text>
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actionsContainer, contentAnimatedStyle]}>
          <Button
            title={`📅 ${t('booking.success.addToCalendar')}`}
            variant="outline"
            onPress={handleAddToCalendar}
            fullWidth
            style={{ marginBottom: spacing.md }}
          />
          <Button
            title={`🏠 ${t('booking.success.goHome')}`}
            onPress={handleGoHome}
            fullWidth
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confettiContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: '20%',
    gap: 20,
  },
  confetti: {
    fontSize: 48,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  actionsContainer: {
    width: '100%',
  },
});
