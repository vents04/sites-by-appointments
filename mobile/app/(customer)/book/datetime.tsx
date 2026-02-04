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
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { Button, Card, ProgressBar, LoadingSpinner, EmptyState } from '../../../src/components/ui';
import { getAvailableTimeSlots, getAvailableDates } from '../../../src/services/mock/mockApi';
import { TimeSlot } from '../../../src/types';

export default function DateTimeSelectionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business } = useAuthStore();
  const { 
    locationId, 
    employeeId, 
    serviceId, 
    date, 
    timeSlot,
    setDate, 
    setTimeSlot, 
    setAssignedEmployee,
    setCurrentStep, 
    getProgress, 
    prevStep 
  } = useBookingStore();

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(date);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(timeSlot);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const { colors, spacing, typography } = theme;

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    if (!business || !locationId || !employeeId || !serviceId) {
      router.replace('/(customer)/book/service');
      return;
    }

    try {
      const dates = await getAvailableDates(
        business._id,
        locationId,
        employeeId,
        serviceId
      );
      setAvailableDates(dates);

      // Pre-select first available date
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Error loading dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const loadTimeSlots = async (dateStr: string) => {
    if (!business || !locationId || !employeeId || !serviceId) return;

    setLoadingSlots(true);
    setSelectedSlot(null);

    try {
      const slots = await getAvailableTimeSlots(
        business._id,
        locationId,
        employeeId,
        serviceId,
        dateStr
      );
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDate(dateStr);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setTimeSlot(slot);
    // If "anyone" was selected, save the assigned employee
    if (slot.employeeId) {
      setAssignedEmployee(slot.employeeId);
    }
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handleNext = () => {
    if (selectedDate && selectedSlot) {
      setCurrentStep(4);
      router.push('/(customer)/book/personal-data');
    }
  };

  // Create marked dates for calendar
  const markedDates: { [key: string]: any } = {};
  availableDates.forEach((d) => {
    markedDates[d] = {
      marked: true,
      dotColor: colors.primary,
    };
  });
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };
  }

  if (loadingDates) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

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
          {t('booking.datetime.title')}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {t('booking.step', { current: 4, total: 6 })}
        </Text>
        <ProgressBar progress={getProgress()} style={{ marginTop: spacing.md }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {availableDates.length === 0 ? (
          <EmptyState
            icon="📅"
            title={t('booking.datetime.noSlots')}
          />
        ) : (
          <>
            {/* Calendar */}
            <View style={[styles.calendarContainer, { borderRadius: 12, overflow: 'hidden' }]}>
              <Calendar
                onDayPress={(day: any) => {
                  if (availableDates.includes(day.dateString)) {
                    handleDateSelect(day.dateString);
                  }
                }}
                markedDates={markedDates}
                minDate={format(new Date(), 'yyyy-MM-dd')}
                theme={{
                  backgroundColor: colors.surface,
                  calendarBackground: colors.surface,
                  textSectionTitleColor: colors.textSecondary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.textOnPrimary,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.text,
                  textDisabledColor: colors.disabled,
                  dotColor: colors.primary,
                  arrowColor: colors.primary,
                  monthTextColor: colors.text,
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '500',
                }}
              />
            </View>

            {/* Time Slots */}
            {selectedDate && (
              <View style={{ marginTop: spacing.xl }}>
                <Text style={[typography.label, { color: colors.text, marginBottom: spacing.md }]}>
                  {t('booking.datetime.availableSlots', { 
                    date: format(parseISO(selectedDate), 'dd.MM.yyyy') 
                  })}
                </Text>

                {loadingSlots ? (
                  <LoadingSpinner message={t('common.loading')} />
                ) : timeSlots.length === 0 ? (
                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    {t('booking.datetime.noSlots')}
                  </Text>
                ) : (
                  <View style={styles.slotsGrid}>
                    {timeSlots.map((slot, index) => {
                      const isSelected = selectedSlot?.start === slot.start;
                      const timeStr = format(parseISO(slot.start), 'HH:mm');

                      return (
                        <TouchableOpacity
                          key={`${slot.start}-${index}`}
                          style={[
                            styles.slotButton,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.primary
                                : colors.border,
                              borderWidth: isSelected ? 2 : 1,
                            },
                          ]}
                          onPress={() => handleSlotSelect(slot)}
                        >
                          <Text
                            style={[
                              typography.label,
                              {
                                color: isSelected
                                  ? colors.textOnPrimary
                                  : colors.text,
                              },
                            ]}
                          >
                            {timeStr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { padding: spacing.lg, backgroundColor: colors.surface }]}>
        <Button
          title={t('common.next')}
          onPress={handleNext}
          disabled={!selectedDate || !selectedSlot}
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
  calendarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
