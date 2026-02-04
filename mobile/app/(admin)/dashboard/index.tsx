import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format, isToday, parseISO, isFuture } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { Card, Button, LoadingSpinner } from '../../../src/components/ui';
import {
  getEmployeeById,
  getServiceById,
} from '../../../src/services/mock/mockApi';

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business } = useAuthStore();
  const { businessAppointments, fetchBusinessAppointments, isLoading } = useAppointmentsStore();

  const [refreshing, setRefreshing] = useState(false);

  const { colors, spacing, typography } = theme;

  useEffect(() => {
    if (business) {
      fetchBusinessAppointments(business._id);
    }
  }, [business]);

  const onRefresh = async () => {
    if (business) {
      setRefreshing(true);
      await fetchBusinessAppointments(business._id);
      setRefreshing(false);
    }
  };

  // Calculate stats
  const todayAppointments = businessAppointments.filter(
    (apt) => isToday(parseISO(apt.start)) && apt.status === 'confirmed'
  );
  const cancelledToday = businessAppointments.filter(
    (apt) => isToday(parseISO(apt.start)) && apt.status === 'cancelled'
  );
  const upcomingToday = todayAppointments.filter((apt) => isFuture(parseISO(apt.start)));

  // Calculate expected revenue
  const expectedRevenue = todayAppointments.reduce((sum, apt) => {
    const service = getServiceById(apt.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  if (isLoading && businessAppointments.length === 0) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t('admin.dashboard.title')}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {format(new Date(), 'EEEE, dd MMMM yyyy')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card pressable={false} style={[styles.statCard, { backgroundColor: colors.primaryBackground }]}>
            <Text style={[typography.h2, { color: colors.primary }]}>{todayAppointments.length}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {t('admin.dashboard.bookingsToday')}
            </Text>
          </Card>
          <Card pressable={false} style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
            <Text style={[typography.h2, { color: colors.success }]}>{expectedRevenue}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {t('admin.dashboard.expectedRevenue')} лв.
            </Text>
          </Card>
        </View>

        <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
          <Card pressable={false} style={[styles.statCard, { backgroundColor: colors.info + '15' }]}>
            <Text style={[typography.h2, { color: colors.info }]}>{upcomingToday.length}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {t('admin.dashboard.availableSlots')}
            </Text>
          </Card>
          <Card pressable={false} style={[styles.statCard, { backgroundColor: colors.error + '15' }]}>
            <Text style={[typography.h2, { color: colors.error }]}>{cancelledToday.length}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {t('admin.dashboard.cancelledToday')}
            </Text>
          </Card>
        </View>

        {/* Upcoming Bookings */}
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          {t('admin.dashboard.upcomingBookings')}
        </Text>

        {upcomingToday.length === 0 ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Няма предстоящи резервации за днес
          </Text>
        ) : (
          upcomingToday.slice(0, 5).map((apt) => {
            const employee = getEmployeeById(apt.employeeId);
            const service = getServiceById(apt.serviceId);

            return (
              <Card
                key={apt._id}
                onPress={() => router.push(`/(admin)/appointments/${apt._id}`)}
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.appointmentRow}>
                  <View style={[styles.timeBox, { backgroundColor: colors.primaryBackground }]}>
                    <Text style={[typography.label, { color: colors.primary }]}>
                      {format(parseISO(apt.start), 'HH:mm')}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={[typography.label, { color: colors.text }]}>
                      {apt.customer.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="cut-outline" size={12} color={colors.textSecondary} />
                      <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                        {service?.name} • {employee?.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        {/* Quick Actions */}
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          {t('admin.dashboard.quickActions')}
        </Text>

        <View style={styles.actionsRow}>
          <Button
            title={t('admin.dashboard.blockTime')}
            variant="outline"
            size="sm"
            onPress={() => {}}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Button
            title={t('admin.dashboard.addBreak')}
            variant="outline"
            size="sm"
            onPress={() => {}}
            style={{ flex: 1 }}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
  },
});
