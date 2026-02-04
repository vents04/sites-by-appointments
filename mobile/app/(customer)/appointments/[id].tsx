import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format, parseISO, isPast } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { Button, Card, LoadingSpinner } from '../../../src/components/ui';
import {
  getLocationById,
  getEmployeeById,
  getServiceById,
} from '../../../src/services/mock/mockApi';

export default function AppointmentDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appointments, cancelBooking, isLoading } = useAppointmentsStore();
  const { setLocation, setEmployee, setService } = useBookingStore();

  const { colors, spacing, typography } = theme;

  const appointment = appointments.find((apt) => apt._id === id);

  if (!appointment) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  const location = getLocationById(appointment.locationId);
  const employee = getEmployeeById(appointment.employeeId);
  const service = getServiceById(appointment.serviceId);
  const isUpcoming = !isPast(parseISO(appointment.start)) && appointment.status === 'confirmed';

  const handleBack = () => {
    router.back();
  };

  const handleAddToCalendar = async () => {
    // In a real app, this would use expo-calendar
    console.log('Add to calendar');
  };

  const handleCancel = () => {
    Alert.alert(
      t('appointments.cancelConfirmTitle'),
      t('appointments.cancelConfirmMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            await cancelBooking(appointment._id);
            router.back();
          },
        },
      ]
    );
  };

  const handleBookAgain = () => {
    setLocation(appointment.locationId);
    setEmployee(appointment.employeeId);
    setService(appointment.serviceId);
    router.replace('/(customer)/book');
  };

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'confirmed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={[typography.body, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.sm }]}>
          {t('appointments.detail.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + '20', alignSelf: 'flex-start' },
          ]}
        >
          <Text style={[typography.label, { color: getStatusColor() }]}>
            {t(`appointments.${appointment.status}`)}
          </Text>
        </View>

        {/* Appointment Details Card */}
        <Card variant="outlined" pressable={false} style={{ marginTop: spacing.lg }}>
          {/* Service */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionIcon}>{service?.icon || '✂️'}</Text>
            <View style={styles.sectionContent}>
              <Text style={[typography.h4, { color: colors.text }]}>{service?.name}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
                {t('booking.service.duration', { minutes: service?.durationMinutes })}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Date & Time */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionIcon}>📅</Text>
            <View style={styles.sectionContent}>
              <Text style={[typography.label, { color: colors.text }]}>
                {format(parseISO(appointment.start), 'EEEE, dd MMMM yyyy')}
              </Text>
              <Text style={[typography.body, { color: colors.primary, marginTop: 4 }]}>
                {format(parseISO(appointment.start), 'HH:mm')} -{' '}
                {format(parseISO(appointment.end), 'HH:mm')}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Location */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionIcon}>📍</Text>
            <View style={styles.sectionContent}>
              <Text style={[typography.label, { color: colors.text }]}>{location?.name}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
                {location?.addressName}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Employee */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionIcon}>👤</Text>
            <View style={styles.sectionContent}>
              <Text style={[typography.label, { color: colors.text }]}>{employee?.name}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Price */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionIcon}>💰</Text>
            <View style={styles.sectionContent}>
              <Text style={[typography.h4, { color: colors.primary }]}>
                {service?.priceFormatted}
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={[styles.actions, { marginTop: spacing.xl }]}>
          {isUpcoming && (
            <>
              <Button
                title={`📅 ${t('booking.success.addToCalendar')}`}
                variant="outline"
                onPress={handleAddToCalendar}
                fullWidth
                style={{ marginBottom: spacing.md }}
              />
              <Button
                title={`❌ ${t('appointments.cancel')}`}
                variant="danger"
                onPress={handleCancel}
                loading={isLoading}
                fullWidth
              />
            </>
          )}

          {!isUpcoming && appointment.status === 'completed' && (
            <Button
              title={t('appointments.bookAgain')}
              onPress={handleBookAgain}
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  backButton: {
    paddingVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  sectionIcon: {
    fontSize: 24,
    width: 40,
  },
  sectionContent: {
    flex: 1,
  },
  divider: {
    height: 1,
  },
  actions: {},
});
