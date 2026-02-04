import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
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
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { Button, Card } from '../../../src/components/ui';
import {
  getLocationById,
  getEmployeeById,
  getServiceById,
} from '../../../src/services/mock/mockApi';

export default function SuccessScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { appointments } = useAppointmentsStore();
  const { business } = useAuthStore();
  const { reset: resetBooking } = useBookingStore();
  const [calendarAdded, setCalendarAdded] = useState(false);

  const { colors, spacing, typography } = theme;

  // Get the last created appointment
  const lastAppointment = appointments.length > 0 
    ? appointments[appointments.length - 1] 
    : null;

  // Get booking details
  const location = lastAppointment ? getLocationById(lastAppointment.locationId) : null;
  const employee = lastAppointment ? getEmployeeById(lastAppointment.employeeId) : null;
  const service = lastAppointment ? getServiceById(lastAppointment.serviceId) : null;

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const detailsTranslateY = useSharedValue(30);
  const checkmarkRotation = useSharedValue(0);

  useEffect(() => {
    // Animate in sequence
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    checkmarkRotation.value = withSequence(
      withDelay(200, withTiming(10, { duration: 100 })),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    opacity.value = withDelay(300, withSpring(1));
    detailsTranslateY.value = withDelay(400, withSpring(0, { damping: 15 }));
    confettiOpacity.value = withSequence(
      withDelay(200, withSpring(1)),
      withDelay(3000, withTiming(0.2, { duration: 1000 }))
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${checkmarkRotation.value}deg` },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: detailsTranslateY.value }],
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const handleAddToCalendar = async () => {
    if (!lastAppointment || !service) return;

    try {
      // Request calendar permission
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('booking.success.calendarPermissionTitle'),
          t('booking.success.calendarPermissionMessage')
        );
        return;
      }

      // Get default calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        cal => cal.allowsModifications && cal.source.name === (Platform.OS === 'ios' ? 'iCloud' : 'Default')
      ) || calendars.find(cal => cal.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert(t('booking.success.noCalendar'));
        return;
      }

      // Create calendar event
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: `${service.name} - ${business?.name || ''}`,
        startDate: new Date(lastAppointment.start),
        endDate: new Date(lastAppointment.end),
        location: location?.addressName,
        notes: `${t('booking.success.calendarNote')}\n${employee?.name || ''}`,
        alarms: [{ relativeOffset: -60 }], // Reminder 1 hour before
      });

      setCalendarAdded(true);
      Alert.alert(
        t('booking.success.calendarAddedTitle'),
        t('booking.success.calendarAddedMessage')
      );
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(t('common.error'), t('booking.success.calendarError'));
    }
  };

  const handleGoHome = () => {
    resetBooking();
    router.replace('/(customer)/book');
  };

  const handleViewAppointments = () => {
    resetBooking();
    router.replace('/(customer)/appointments');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Confetti icons */}
          <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
            <Ionicons name="sparkles" size={32} color={colors.warning} style={{ transform: [{ rotate: '-15deg' }] }} />
            <Ionicons name="star" size={28} color={colors.success} />
            <Ionicons name="sparkles" size={32} color={colors.warning} style={{ transform: [{ rotate: '15deg' }] }} />
          </Animated.View>

          {/* Success Icon */}
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={56} color="#FFFFFF" />
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
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
              ]}
            >
              {t('booking.success.subtitle')}
            </Text>
          </Animated.View>

          {/* Booking Details Card */}
          {lastAppointment && (
            <Animated.View style={[styles.detailsCard, contentAnimatedStyle]}>
              <Card variant="outlined" pressable={false}>
                <Text style={[typography.label, { color: colors.text, marginBottom: spacing.md }]}>
                  {t('booking.success.bookingDetails')}
                </Text>

                {/* Date & Time */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primaryBackground }]}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                      {t('booking.success.dateTime')}
                    </Text>
                    <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                      {format(parseISO(lastAppointment.start), 'EEEE, d MMMM yyyy')}
                    </Text>
                    <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
                      {format(parseISO(lastAppointment.start), 'HH:mm')}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                {/* Service */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primaryBackground }]}>
                    <Ionicons name="cut" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                      {t('booking.success.service')}
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      {service?.name}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.success, fontWeight: '600' }]}>
                      {service?.priceFormatted}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                {/* Employee */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primaryBackground }]}>
                    <Ionicons name="person" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                      {t('booking.success.specialist')}
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      {employee?.name}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                {/* Location */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primaryBackground }]}>
                    <Ionicons name="location" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                      {t('booking.success.location')}
                    </Text>
                    <Text style={[typography.body, { color: colors.text }]}>
                      {location?.name}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                      {location?.addressName}
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Email confirmation */}
          {lastAppointment?.customer?.email && (
            <Animated.View style={[styles.emailNote, contentAnimatedStyle]}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text style={[typography.bodySmall, { color: colors.textMuted, marginLeft: 6 }]}>
                {t('booking.success.emailSent')} {lastAppointment.customer.email}
              </Text>
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View style={[styles.actionsContainer, contentAnimatedStyle]}>
            <Button
              title={calendarAdded ? t('booking.success.addedToCalendar') : t('booking.success.addToCalendar')}
              variant="outline"
              onPress={handleAddToCalendar}
              disabled={calendarAdded}
              fullWidth
              icon={<Ionicons name={calendarAdded ? "checkmark-circle" : "calendar-outline"} size={20} color={calendarAdded ? colors.success : colors.primary} />}
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title={t('booking.success.viewAppointments')}
              variant="secondary"
              onPress={handleViewAppointments}
              fullWidth
              icon={<Ionicons name="list-outline" size={20} color={colors.primary} />}
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title={t('booking.success.goHome')}
              onPress={handleGoHome}
              fullWidth
              icon={<Ionicons name="home-outline" size={20} color={colors.textOnPrimary} />}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  confettiContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 20,
    gap: 30,
  },
  iconContainer: {
    marginBottom: 24,
    marginTop: 40,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsCard: {
    width: '100%',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  emailNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
  },
});
