import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format, parseISO, isPast } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { Card, EmptyState, LoadingSpinner, Button } from '../../../src/components/ui';
import {
  getLocationById,
  getEmployeeById,
  getServiceById,
} from '../../../src/services/mock/mockApi';
import { Appointment } from '../../../src/types';

type TabType = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { businessPreferences } = useUserPreferencesStore();
  const { appointments, fetchCustomerAppointments, isLoading } = useAppointmentsStore();
  const { setLocation, setEmployee, setService } = useBookingStore();

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const { colors, spacing, typography } = theme;

  // Get user email from preferences
  const allPreferences = Object.values(businessPreferences);
  const userEmail = allPreferences.find(p => p.personalData?.email)?.personalData?.email;

  useEffect(() => {
    if (userEmail) {
      fetchCustomerAppointments(userEmail);
    }
  }, [userEmail]);

  const onRefresh = async () => {
    if (userEmail) {
      setRefreshing(true);
      await fetchCustomerAppointments(userEmail);
      setRefreshing(false);
    }
  };

  // Filter appointments
  const upcomingAppointments = appointments.filter(
    (apt) => !isPast(parseISO(apt.start)) && apt.status === 'confirmed'
  );
  const pastAppointments = appointments.filter(
    (apt) => isPast(parseISO(apt.start)) || apt.status !== 'confirmed'
  );

  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const handleAppointmentPress = (appointment: Appointment) => {
    router.push(`/(customer)/appointments/${appointment._id}`);
  };

  const handleBookAgain = (appointment: Appointment) => {
    // Pre-fill booking with same selections
    setLocation(appointment.locationId);
    setEmployee(appointment.employeeId);
    setService(appointment.serviceId);
    router.push('/(customer)/book');
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const location = getLocationById(appointment.locationId);
    const employee = getEmployeeById(appointment.employeeId);
    const service = getServiceById(appointment.serviceId);
    const isUpcoming = !isPast(parseISO(appointment.start)) && appointment.status === 'confirmed';

    return (
      <Card
        key={appointment._id}
        onPress={() => handleAppointmentPress(appointment)}
        style={{ marginBottom: spacing.md }}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.serviceIcon}>{service?.icon || '✂️'}</Text>
            <View style={styles.cardHeaderInfo}>
              <Text style={[typography.label, { color: colors.text }]}>
                {service?.name}
              </Text>
              {appointment.status !== 'confirmed' && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        appointment.status === 'cancelled'
                          ? colors.error + '20'
                          : colors.success + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color:
                          appointment.status === 'cancelled'
                            ? colors.error
                            : colors.success,
                      },
                    ]}
                  >
                    {t(`appointments.${appointment.status}`)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.cardDetails, { marginTop: spacing.sm }]}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              📅 {format(parseISO(appointment.start), 'dd MMM yyyy, HH:mm')}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              📍 {location?.name}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              👤 {employee?.name}
            </Text>
          </View>

          {!isUpcoming && appointment.status === 'completed' && (
            <Button
              title={t('appointments.bookAgain')}
              variant="secondary"
              size="sm"
              onPress={() => handleBookAgain(appointment)}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      </Card>
    );
  };

  if (isLoading && appointments.length === 0) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t('appointments.title')}
        </Text>

        {/* Tabs */}
        <View style={[styles.tabs, { marginTop: spacing.lg }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'upcoming' ? colors.primary : 'transparent',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[
                typography.label,
                {
                  color: activeTab === 'upcoming' ? colors.textOnPrimary : colors.primary,
                },
              ]}
            >
              {t('appointments.upcoming')} ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'past' ? colors.primary : 'transparent',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setActiveTab('past')}
          >
            <Text
              style={[
                typography.label,
                {
                  color: activeTab === 'past' ? colors.textOnPrimary : colors.primary,
                },
              ]}
            >
              {t('appointments.past')} ({pastAppointments.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayAppointments.length === 0 ? (
          <EmptyState
            icon="📅"
            title={activeTab === 'upcoming' ? t('appointments.empty') : t('appointments.emptyPast')}
            actionLabel={activeTab === 'upcoming' ? t('booking.title') : undefined}
            onAction={activeTab === 'upcoming' ? () => router.push('/(customer)/book') : undefined}
          />
        ) : (
          displayAppointments.map(renderAppointmentCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardContent: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardDetails: {},
});
