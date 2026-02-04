import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { Button, Card, ProgressBar } from '../../../src/components/ui';
import {
  getLocationById,
  getEmployeeById,
  getServiceById,
} from '../../../src/services/mock/mockApi';
import { ANYONE_EMPLOYEE_ID } from '../../../src/types';

export default function ConfirmationScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business } = useAuthStore();
  const {
    locationId,
    employeeId,
    serviceId,
    timeSlot,
    personalData,
    assignedEmployeeId,
    privacyAccepted,
    setPrivacyAccepted,
    getProgress,
    prevStep,
    reset,
  } = useBookingStore();
  const { createBooking, isCreating } = useAppointmentsStore();

  const { colors, spacing, typography } = theme;

  // Get display data
  const location = locationId ? getLocationById(locationId) : null;
  const displayEmployeeId = employeeId === ANYONE_EMPLOYEE_ID ? assignedEmployeeId : employeeId;
  const employee = displayEmployeeId ? getEmployeeById(displayEmployeeId) : null;
  const service = serviceId ? getServiceById(serviceId) : null;

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handlePrivacyPress = () => {
    if (business?.privacyPolicyURL) {
      Linking.openURL(business.privacyPolicyURL);
    }
  };

  const handleSubmit = async () => {
    if (!privacyAccepted || !timeSlot || !personalData || !locationId || !serviceId) {
      return;
    }

    const appointment = await createBooking({
      calendarId: 'cal_001', // Mock calendar ID
      locationId,
      employeeId: displayEmployeeId || employeeId || '',
      serviceId,
      start: timeSlot.start,
      end: timeSlot.end,
      customer: personalData,
      createdBy: 'customer',
    });

    if (appointment) {
      reset();
      router.replace('/(customer)/book/success');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={[typography.body, { color: colors.primary }]}>← {t('common.back')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.sm }]}>
          {t('booking.confirmation.title')}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {t('booking.step', { current: 6, total: 6 })}
        </Text>
        <ProgressBar progress={getProgress()} style={{ marginTop: spacing.md }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary Card */}
        <Card variant="outlined" pressable={false}>
          {/* Booking Details */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>📍</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {location?.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>👤</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {employeeId === ANYONE_EMPLOYEE_ID
                  ? `${employee?.name || ''} (${t('booking.employee.anyone')})`
                  : employee?.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>{service?.icon || '✂️'}</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {service?.name}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Date & Time */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>📅</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {timeSlot ? format(parseISO(timeSlot.start), 'dd MMMM yyyy') : ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>🕐</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {timeSlot ? format(parseISO(timeSlot.start), 'HH:mm') : ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>💰</Text>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '600', flex: 1 }]}>
                {service?.priceFormatted}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Personal Data */}
          <View style={styles.summarySection}>
            <Text style={[typography.body, { color: colors.text }]}>
              {personalData?.name}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
              {personalData?.phone}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              {personalData?.email}
            </Text>
          </View>
        </Card>

        {/* Privacy Policy Checkbox */}
        <TouchableOpacity
          style={[styles.checkboxRow, { marginTop: spacing.xl }]}
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: privacyAccepted ? colors.primary : colors.border,
                backgroundColor: privacyAccepted ? colors.primary : 'transparent',
              },
            ]}
          >
            {privacyAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[typography.bodySmall, { color: colors.text, flex: 1 }]}>
            {t('booking.confirmation.privacyPolicy').split('Политика')[0]}
            <Text
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              onPress={handlePrivacyPress}
            >
              Политика за поверителност
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { padding: spacing.lg, backgroundColor: colors.surface }]}>
        <Button
          title={t('booking.confirmation.submit')}
          onPress={handleSubmit}
          disabled={!privacyAccepted}
          loading={isCreating}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  summarySection: {
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryIcon: {
    fontSize: 20,
    width: 32,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
