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
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useBookingStore } from '../../../src/stores/bookingStore';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { Button, Card, ProgressBar, LoadingSpinner } from '../../../src/components/ui';
import { getServicesByEmployeeId } from '../../../src/services/mock/mockApi';
import { Service, ANYONE_EMPLOYEE_ID } from '../../../src/types';

export default function ServiceSelectionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business, businessCode } = useAuthStore();
  const { employeeId, serviceId, setService, setCurrentStep, getProgress, prevStep } = useBookingStore();
  const { getPreferencesForBusiness, setLastService } = useUserPreferencesStore();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(serviceId);

  const { colors, spacing, typography } = theme;
  const preferences = businessCode ? getPreferencesForBusiness(businessCode) : {};

  useEffect(() => {
    loadServices();
  }, [employeeId]);

  const loadServices = async () => {
    if (!employeeId) {
      router.replace('/(customer)/book/employee');
      return;
    }

    try {
      // If "anyone" selected, get all services for the business
      const data = await getServicesByEmployeeId(employeeId);
      setServices(data);

      // Auto-skip if only one service
      if (data.length === 1) {
        handleSelect(data[0]._id, true);
        return;
      }

      // Pre-select last used service
      if (preferences.lastServiceId && data.some(s => s._id === preferences.lastServiceId)) {
        setSelectedId(preferences.lastServiceId);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string, autoSkip = false) => {
    setSelectedId(id);
    setService(id);
    if (businessCode) {
      setLastService(businessCode, id);
    }

    if (autoSkip) {
      router.push('/(customer)/book/datetime');
    }
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handleNext = () => {
    if (selectedId) {
      setCurrentStep(3);
      router.push('/(customer)/book/datetime');
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
          {t('booking.service.title')}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {t('booking.step', { current: 3, total: 6 })}
        </Text>
        <ProgressBar progress={getProgress()} style={{ marginTop: spacing.md }} />
      </View>

      {/* Services List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {services.map((service) => {
          const isSelected = selectedId === service._id;
          const isLastSelected = preferences.lastServiceId === service._id;

          return (
            <Card
              key={service._id}
              selected={isSelected}
              onPress={() => handleSelect(service._id)}
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <Text style={styles.iconText}>{service.icon || '✂️'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[typography.label, { color: colors.text }]}>
                    {service.name}
                  </Text>
                  <View style={styles.serviceDetails}>
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {service.priceFormatted}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                      {' • '}
                      {t('booking.service.duration', { minutes: service.durationMinutes })}
                    </Text>
                  </View>
                  {isLastSelected && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.primaryBackground, marginTop: spacing.sm },
                      ]}
                    >
                      <Text style={[typography.caption, { color: colors.primary }]}>
                        ✓ {t('booking.location.lastSelected')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.textMuted }}>▶</Text>
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
    marginRight: 12,
  },
  iconText: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
