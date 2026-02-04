import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { Button, Input } from '../../src/components/ui';

export default function AuthEntryScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { loginAsCustomer, isLoading, error, clearError } = useAuthStore();

  const [businessCode, setBusinessCode] = useState('');
  const [localError, setLocalError] = useState('');

  const { colors, spacing, typography } = theme;

  const handleSubmit = async () => {
    if (!businessCode.trim()) {
      setLocalError(t('common.required'));
      return;
    }

    clearError();
    setLocalError('');

    const success = await loginAsCustomer(businessCode.trim());
    if (success) {
      router.replace('/(customer)/book');
    }
  };

  const handleBusinessPress = () => {
    router.push('/(auth)/admin-login');
  };

  const displayError = localError || (error ? t(error) : '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.logoText}>✂️</Text>
            </View>
            <Text style={[typography.h1, { color: colors.primary, marginTop: spacing.lg }]}>
              {t('auth.entry.title')}
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              {t('auth.entry.subtitle')}
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { marginTop: spacing['3xl'] }]}>
            <Input
              placeholder={t('auth.entry.codePlaceholder')}
              value={businessCode}
              onChangeText={(text) => {
                setBusinessCode(text);
                setLocalError('');
                clearError();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              error={displayError}
              editable={!isLoading}
            />

            <Button
              title={t('auth.entry.submit')}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </View>

          {/* Business link */}
          <TouchableOpacity
            onPress={handleBusinessPress}
            style={[styles.businessLink, { marginTop: spacing['2xl'] }]}
            disabled={isLoading}
          >
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textMuted, textDecorationLine: 'underline' },
              ]}
            >
              {t('auth.entry.iAmBusiness')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
  },
  form: {
    width: '100%',
  },
  businessLink: {
    alignItems: 'center',
    padding: 8,
  },
});
