import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { Card, Button, Input, LoadingSpinner, EmptyState } from '../../../src/components/ui';
import {
  getEmployeeById,
  getServiceById,
} from '../../../src/services/mock/mockApi';
import { Appointment } from '../../../src/types';

type TabType = 'today' | 'upcoming' | 'past';

export default function AdminAppointmentsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business } = useAuthStore();
  const { businessAppointments, fetchBusinessAppointments, cancelBooking, isLoading } = useAppointmentsStore();

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter appointments
  const filterAppointments = (): Appointment[] => {
    let filtered = businessAppointments;

    // Filter by tab
    switch (activeTab) {
      case 'today':
        filtered = filtered.filter((apt) => isToday(parseISO(apt.start)));
        break;
      case 'upcoming':
        filtered = filtered.filter(
          (apt) => isFuture(parseISO(apt.start)) && apt.status === 'confirmed'
        );
        break;
      case 'past':
        filtered = filtered.filter(
          (apt) => isPast(parseISO(apt.start)) || apt.status !== 'confirmed'
        );
        break;
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.customer.name.toLowerCase().includes(query) ||
          apt.customer.phone.includes(query) ||
          apt.customer.email.toLowerCase().includes(query)
      );
    }

    // Sort by date
    return filtered.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  };

  const displayAppointments = filterAppointments();

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleCancel = async (id: string) => {
    await cancelBooking(id);
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const employee = getEmployeeById(appointment.employeeId);
    const service = getServiceById(appointment.serviceId);
    const isUpcoming = isFuture(parseISO(appointment.start)) && appointment.status === 'confirmed';

    return (
      <Card
        key={appointment._id}
        onPress={() => router.push(`/(admin)/appointments/${appointment._id}`)}
        style={{ marginBottom: spacing.md }}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[typography.label, { color: colors.text }]}>
                {appointment.customer.name}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                📱 {appointment.customer.phone}
              </Text>
            </View>
            {appointment.status !== 'confirmed' && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      appointment.status === 'cancelled' ? colors.error + '20' : colors.success + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: appointment.status === 'cancelled' ? colors.error : colors.success,
                    },
                  ]}
                >
                  {t(`appointments.${appointment.status}`)}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.cardDetails, { marginTop: spacing.sm }]}>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {service?.icon} {service?.name} • {format(parseISO(appointment.start), 'HH:mm')}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              👤 {employee?.name}
            </Text>
          </View>

          {isUpcoming && (
            <View style={[styles.actions, { marginTop: spacing.md }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                onPress={() => handleCall(appointment.customer.phone)}
              >
                <Text style={[typography.labelSmall, { color: colors.success }]}>
                  📞 {t('admin.appointments.call')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
                onPress={() => router.push(`/(admin)/appointments/${appointment._id}`)}
              >
                <Text style={[typography.labelSmall, { color: colors.info }]}>
                  ✏️ {t('common.edit')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                onPress={() => handleCancel(appointment._id)}
              >
                <Text style={[typography.labelSmall, { color: colors.error }]}>
                  ❌ {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading && businessAppointments.length === 0) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t('admin.appointments.title')}
        </Text>

        {/* Search */}
        <View style={{ marginTop: spacing.md }}>
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Text>🔍</Text>}
          />
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { marginTop: spacing.md }]}>
          {(['today', 'upcoming', 'past'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  typography.labelSmall,
                  {
                    color: activeTab === tab ? colors.textOnPrimary : colors.primary,
                  },
                ]}
              >
                {t(`admin.appointments.${tab === 'today' ? 'today' : tab === 'upcoming' ? 'title' : 'title'}`)}
                {tab === 'today' && ` (${businessAppointments.filter((a) => isToday(parseISO(a.start))).length})`}
              </Text>
            </TouchableOpacity>
          ))}
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
            icon="📋"
            title="Няма намерени резервации"
          />
        ) : (
          displayAppointments.map(renderAppointmentCard)
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(admin)/appointments/create')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  cardContent: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardDetails: {},
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
  },
});
