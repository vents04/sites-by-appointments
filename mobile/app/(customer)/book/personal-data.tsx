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
import { useBookingStore } from '../../../src/stores/bookingStore';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { Button, Input, ProgressBar } from '../../../src/components/ui';

export default function PersonalDataScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { businessCode } = useAuthStore();
  const { personalData, setPersonalData, setCurrentStep, getProgress, prevStep } = useBookingStore();
  const { getPreferencesForBusiness, setPersonalData: savePersonalData } = useUserPreferencesStore();

  const preferences = businessCode ? getPreferencesForBusiness(businessCode) : {};
  const savedPersonalData = preferences.personalData;

  const [name, setName] = useState(personalData?.name || savedPersonalData?.name || '');
  const [phone, setPhone] = useState(personalData?.phone || savedPersonalData?.phone || '');
  const [email, setEmail] = useState(personalData?.email || savedPersonalData?.email || '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const { colors, spacing, typography } = theme;

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handleNext = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('booking.personalData.nameRequired');
    }
    if (!phone.trim()) {
      newErrors.phone = t('booking.personalData.phoneRequired');
    }
    if (!email.trim()) {
      newErrors.email = t('booking.personalData.emailRequired');
    } else if (!validateEmail(email.trim())) {
      newErrors.email = t('booking.personalData.emailInvalid');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };

      setPersonalData(data);

      // Save to preferences for future use
      if (businessCode) {
        savePersonalData(businessCode, data);
      }

      setCurrentStep(5);
      router.push('/(customer)/book/confirmation');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={[typography.body, { color: colors.primary }]}>← {t('common.back')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[typography.h4, { color: colors.text, marginTop: spacing.sm }]}>
            {t('booking.personalData.title')}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
            {t('booking.step', { current: 5, total: 6 })}
          </Text>
          <ProgressBar progress={getProgress()} style={{ marginTop: spacing.md }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.lg }}>
            <Input
              label={`${t('booking.personalData.name')} *`}
              placeholder={t('booking.personalData.namePlaceholder')}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              autoCapitalize="words"
            />

            <Input
              label={`${t('booking.personalData.phone')} *`}
              placeholder={t('booking.personalData.phonePlaceholder')}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <Input
              label={`${t('booking.personalData.email')} *`}
              placeholder={t('booking.personalData.emailPlaceholder')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { padding: spacing.lg, backgroundColor: colors.surface }]}>
          <Button
            title={t('common.next')}
            onPress={handleNext}
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
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
