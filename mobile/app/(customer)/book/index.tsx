import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { getLocationsByBusinessId } from '../../../src/services/mock/mockApi';
import { Location } from '../../../src/types';

export default function LocationSelectionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business, businessCode } = useAuthStore();
  const { locationId, setLocation, setCurrentStep, getProgress } = useBookingStore();
  const { getPreferencesForBusiness, setLastLocation } = useUserPreferencesStore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(locationId);

  const { colors, spacing, typography } = theme;
  const preferences = businessCode ? getPreferencesForBusiness(businessCode) : {};

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    if (!business) return;
    try {
      const data = await getLocationsByBusinessId(business._id);
      setLocations(data);
      
      // Pre-select if only one location
      if (data.length === 1) {
        setSelectedId(data[0]._id);
        setLocation(data[0]._id);
        if (businessCode) {
          setLastLocation(businessCode, data[0]._id);
        }
      } else if (preferences.lastLocationId && data.some(l => l._id === preferences.lastLocationId)) {
        // Pre-select last used location
        setSelectedId(preferences.lastLocationId);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setLocation(id);
    if (businessCode) {
      setLastLocation(businessCode, id);
    }
  };

  const handleNext = () => {
    if (selectedId) {
      setCurrentStep(1);
      router.push('/(customer)/book/employee');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message={t('common.loading')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h4, { color: colors.text }]}>
          {t('booking.location.title')}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {t('booking.step', { current: 1, total: 6 })}
        </Text>
        <ProgressBar progress={getProgress()} style={{ marginTop: spacing.md }} />
      </View>

      {/* Locations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {locations.map((location) => {
          const isSelected = selectedId === location._id;
          const isLastSelected = preferences.lastLocationId === location._id;

          return (
            <Card
              key={location._id}
              selected={isSelected}
              onPress={() => handleSelect(location._id)}
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primaryBackground, borderRadius: 8, padding: 8 }]}>
                  <Ionicons name="location-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[typography.label, { color: colors.text }]}>
                    {location.name}
                  </Text>
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.textSecondary, marginTop: spacing.xs },
                    ]}
                  >
                    {location.addressName}
                  </Text>
                  {isLastSelected && (
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
