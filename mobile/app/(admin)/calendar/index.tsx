import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isSameDay } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { Card, LoadingSpinner } from '../../../src/components/ui';
import {
  getEmployeeById,
  getServiceById,
  getEmployeesByBusinessId,
} from '../../../src/services/mock/mockApi';
import { Employee } from '../../../src/types';

export default function AdminCalendarScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business } = useAuthStore();
  const { businessAppointments, fetchBusinessAppointments, isLoading } = useAppointmentsStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { colors, spacing, typography } = theme;

  useEffect(() => {
    if (business) {
      fetchBusinessAppointments(business._id);
      loadEmployees();
    }
  }, [business]);

  const loadEmployees = async () => {
    if (business) {
      const data = await getEmployeesByBusinessId(business._id);
      setEmployees(data);
    }
  };

  // Filter appointments for selected date and employee
  const dayAppointments = businessAppointments.filter((apt) => {
    const matchesDate = isSameDay(parseISO(apt.start), parseISO(selectedDate));
    const matchesEmployee = !selectedEmployeeId || apt.employeeId === selectedEmployeeId;
    return matchesDate && matchesEmployee && apt.status === 'confirmed';
  });

  // Create marked dates
  const markedDates: { [key: string]: any } = {};
  businessAppointments.forEach((apt) => {
    if (apt.status === 'confirmed') {
      const dateStr = format(parseISO(apt.start), 'yyyy-MM-dd');
      markedDates[dateStr] = {
        ...markedDates[dateStr],
        marked: true,
        dotColor: colors.primary,
      };
    }
  });
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: colors.primary,
  };

  // Generate time slots for the day view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (isLoading && businessAppointments.length === 0) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t('admin.calendar.title')}
        </Text>

        {/* Employee Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md }}
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: !selectedEmployeeId ? colors.primary : colors.surface,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedEmployeeId(null)}
          >
            <Text
              style={[
                typography.labelSmall,
                { color: !selectedEmployeeId ? colors.textOnPrimary : colors.primary },
              ]}
            >
              {t('admin.calendar.allEmployees')}
            </Text>
          </TouchableOpacity>
          {employees.map((emp) => (
            <TouchableOpacity
              key={emp._id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedEmployeeId === emp._id ? colors.primary : colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedEmployeeId(emp._id)}
            >
              <Text
                style={[
                  typography.labelSmall,
                  { color: selectedEmployeeId === emp._id ? colors.textOnPrimary : colors.primary },
                ]}
              >
                {emp.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={[styles.calendarContainer, { borderRadius: 12, overflow: 'hidden' }]}>
          <Calendar
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.textOnPrimary,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.disabled,
              dotColor: colors.primary,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
            }}
          />
        </View>

        {/* Day Schedule */}
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          {format(parseISO(selectedDate), 'EEEE, dd MMMM')}
        </Text>

        <View style={styles.scheduleContainer}>
          {timeSlots.map((time) => {
            const appointment = dayAppointments.find((apt) => {
              const aptTime = format(parseISO(apt.start), 'HH:mm');
              return aptTime === time;
            });

            return (
              <View key={time} style={styles.timeSlotRow}>
                <Text style={[typography.caption, { color: colors.textMuted, width: 50 }]}>
                  {time}
                </Text>
                {appointment ? (
                  <TouchableOpacity
                    style={[styles.appointmentBlock, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/(admin)/appointments/${appointment._id}`)}
                  >
                    <Text style={[typography.labelSmall, { color: colors.textOnPrimary }]}>
                      {appointment.customer.name}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textOnPrimary + 'CC' }]}>
                      {getServiceById(appointment.serviceId)?.name}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.emptySlot, { borderColor: colors.borderLight }]}
                    onPress={() => {
                      // Open quick booking modal
                      router.push('/(admin)/appointments/create');
                    }}
                  >
                    <Text style={[typography.caption, { color: colors.textMuted }]}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
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
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  calendarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleContainer: {
    gap: 4,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  appointmentBlock: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptySlot: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
