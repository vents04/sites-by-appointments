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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { Button, Card, ProgressBar, LoadingSpinner } from '../../../src/components/ui';
import { getEmployeesByLocationId } from '../../../src/services/mock/mockApi';
import { Employee, ANYONE_EMPLOYEE_ID } from '../../../src/types';

export default function EmployeeSelectionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { businessCode } = useAuthStore();
  const { locationId, employeeId, setEmployee, setCurrentStep, getProgress, prevStep } = useBookingStore();
  const { getPreferencesForBusiness, setLastEmployee } = useUserPreferencesStore();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(employeeId);

  const { colors, spacing, typography } = theme;
  const preferences = businessCode ? getPreferencesForBusiness(businessCode) : {};

  useEffect(() => {
    loadEmployees();
  }, [locationId]);

  const loadEmployees = async () => {
    if (!locationId) {
      router.replace('/(customer)/book');
      return;
    }

    try {
      const data = await getEmployeesByLocationId(locationId);
      setEmployees(data);

      // Pre-select if only one employee
      if (data.length === 1) {
        setSelectedId(data[0]._id);
        setEmployee(data[0]._id);
        if (businessCode) {
          setLastEmployee(businessCode, data[0]._id);
        }
      } else if (preferences.lastEmployeeId && data.some(e => e._id === preferences.lastEmployeeId)) {
        // Pre-select last used employee
        setSelectedId(preferences.lastEmployeeId);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setEmployee(id);
    if (businessCode && id !== ANYONE_EMPLOYEE_ID) {
      setLastEmployee(businessCode, id);
    }
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handleNext = () => {
    if (selectedId) {
      setCurrentStep(2);
      router.push('/(customer)/book/service');
    }
  };

  if (loading) {
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
          {t('booking.employee.title')}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {t('booking.step', { current: 2, total: 6 })}
        </Text>
        <ProgressBar progress={getProgress()} style={{ marginTop: spacing.md }} />
      </View>

      {/* Employees List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* "Anyone available" option - always first */}
        <Card
          selected={selectedId === ANYONE_EMPLOYEE_ID}
          onPress={() => handleSelect(ANYONE_EMPLOYEE_ID)}
          style={{ marginBottom: spacing.md }}
        >
          <View style={styles.cardContent}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primaryBackground }]}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[typography.label, { color: colors.text }]}>
                {t('booking.employee.anyone')}
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginTop: spacing.xs },
                ]}
              >
                {t('booking.employee.anyoneDescription')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>

        {/* Employee list */}
        {employees.map((employee) => {
          const isSelected = selectedId === employee._id;
          const isLastSelected = preferences.lastEmployeeId === employee._id;
          const isOnVacation = employee.vacation && 
            new Date(employee.vacation.start) <= new Date() && 
            new Date(employee.vacation.end) >= new Date();

          return (
            <Card
              key={employee._id}
              selected={isSelected}
              onPress={() => !isOnVacation && handleSelect(employee._id)}
              disabled={isOnVacation}
              style={{ marginBottom: spacing.md, opacity: isOnVacation ? 0.5 : 1 }}
            >
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primaryBackground }]}>
                  <Ionicons name="person-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[typography.label, { color: colors.text }]}>
                    {employee.name}
                  </Text>
                  {isOnVacation && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                      <Ionicons name="airplane-outline" size={14} color={colors.warning} style={{ marginRight: 4 }} />
                      <Text style={[typography.caption, { color: colors.warning }]}>
                        В отпуск
                      </Text>
                    </View>
                  )}
                  {isLastSelected && !isOnVacation && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.primaryBackground, marginTop: spacing.sm },
                      ]}
                    >
                      <Text style={[typography.caption, { color: colors.primary }]}>
                        <Ionicons name="checkmark" size={12} color={colors.primary} /> {t('booking.location.lastSelected')}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { padding: spacing.lg, backgroundColor: colors.surface }]}>
        <Button
          title={t('common.next')}
          onPress={handleNext}
          disabled={!selectedId}
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
