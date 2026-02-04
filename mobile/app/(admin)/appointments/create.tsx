import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { Button, Input, Card } from '../../../src/components/ui';
import {
  getLocationsByBusinessId,
  getEmployeesByLocationId,
  getServicesByEmployeeId,
} from '../../../src/services/mock/mockApi';
import { Location, Employee, Service } from '../../../src/types';

export default function CreateAppointmentScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business } = useAuthStore();
  const { createBooking, isCreating } = useAppointmentsStore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const { colors, spacing, typography } = theme;

  useEffect(() => {
    if (business) {
      loadLocations();
    }
  }, [business]);

  useEffect(() => {
    if (selectedLocationId) {
      loadEmployees();
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadServices();
    }
  }, [selectedEmployeeId]);

  const loadLocations = async () => {
    if (business) {
      const data = await getLocationsByBusinessId(business._id);
      setLocations(data);
      if (data.length === 1) {
        setSelectedLocationId(data[0]._id);
      }
    }
  };

  const loadEmployees = async () => {
    if (selectedLocationId) {
      const data = await getEmployeesByLocationId(selectedLocationId);
      setEmployees(data);
      setSelectedEmployeeId(null);
      setServices([]);
      setSelectedServiceId(null);
    }
  };

  const loadServices = async () => {
    if (selectedEmployeeId) {
      const data = await getServicesByEmployeeId(selectedEmployeeId);
      setServices(data);
      setSelectedServiceId(null);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleCreate = async () => {
    if (!selectedLocationId || !selectedEmployeeId || !selectedServiceId) {
      return;
    }

    const service = services.find((s) => s._id === selectedServiceId);
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + (service?.durationMinutes || 30) * 60 * 1000);

    const appointment = await createBooking({
      calendarId: 'cal_001',
      locationId: selectedLocationId,
      employeeId: selectedEmployeeId,
      serviceId: selectedServiceId,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      customer: {
        name: customerName || 'Walk-in',
        phone: customerPhone || '-',
        email: customerEmail || '-',
      },
      createdBy: 'admin',
    });

    if (appointment) {
      router.back();
    }
  };

  const isFormValid =
    selectedLocationId &&
    selectedEmployeeId &&
    selectedServiceId &&
    customerName.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={[typography.body, { color: colors.primary }]}>✕ Затвори</Text>
            </TouchableOpacity>
          </View>
          <Text style={[typography.h4, { color: colors.text, marginTop: spacing.md }]}>
            {t('admin.appointments.create')}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer Info */}
          <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {t('admin.appointments.customer')}
          </Text>
          <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
            <Input
              label={`${t('booking.personalData.name')} *`}
              placeholder={t('booking.personalData.namePlaceholder')}
              value={customerName}
              onChangeText={setCustomerName}
            />
            <Input
              label={t('booking.personalData.phone')}
              placeholder={t('booking.personalData.phonePlaceholder')}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
            <Input
              label={t('booking.personalData.email')}
              placeholder={t('booking.personalData.emailPlaceholder')}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Location Selection */}
          <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {t('booking.location.title')}
          </Text>
          <View style={[styles.selectionGrid, { marginBottom: spacing.lg }]}>
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc._id}
                style={[
                  styles.selectionChip,
                  {
                    backgroundColor:
                      selectedLocationId === loc._id ? colors.primary : colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedLocationId(loc._id)}
              >
                <Text
                  style={[
                    typography.labelSmall,
                    {
                      color:
                        selectedLocationId === loc._id ? colors.textOnPrimary : colors.primary,
                    },
                  ]}
                >
                  {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Employee Selection */}
          {selectedLocationId && (
            <>
              <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                {t('booking.employee.title')}
              </Text>
              <View style={[styles.selectionGrid, { marginBottom: spacing.lg }]}>
                {employees.map((emp) => (
                  <TouchableOpacity
                    key={emp._id}
                    style={[
                      styles.selectionChip,
                      {
                        backgroundColor:
                          selectedEmployeeId === emp._id ? colors.primary : colors.surface,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedEmployeeId(emp._id)}
                  >
                    <Text
                      style={[
                        typography.labelSmall,
                        {
                          color:
                            selectedEmployeeId === emp._id ? colors.textOnPrimary : colors.primary,
                        },
                      ]}
                    >
                      {emp.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Service Selection */}
          {selectedEmployeeId && (
            <>
              <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                {t('booking.service.title')}
              </Text>
              <View style={[styles.selectionGrid, { marginBottom: spacing.lg }]}>
                {services.map((svc) => (
                  <TouchableOpacity
                    key={svc._id}
                    style={[
                      styles.selectionChip,
                      {
                        backgroundColor:
                          selectedServiceId === svc._id ? colors.primary : colors.surface,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedServiceId(svc._id)}
                  >
                    <Text
                      style={[
                        typography.labelSmall,
                        {
                          color:
                            selectedServiceId === svc._id ? colors.textOnPrimary : colors.primary,
                        },
                      ]}
                    >
                      {svc.icon} {svc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { padding: spacing.lg, backgroundColor: colors.surface }]}>
          <Button
            title={t('admin.appointments.create')}
            onPress={handleCreate}
            disabled={!isFormValid}
            loading={isCreating}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
