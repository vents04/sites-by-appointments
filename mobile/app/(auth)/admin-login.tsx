import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/authStore';
import { Button, Input } from '../../src/components/ui';

export default function AdminLoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { loginAsAdmin, isLoading, error, clearError } = useAuthStore();

  const [businessCode, setBusinessCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { colors, spacing, typography } = theme;

  const handleSubmit = async () => {
    if (!businessCode.trim() || !password.trim()) {
      setLocalError(t('common.required'));
      return;
    }

    clearError();
    setLocalError('');

    const success = await loginAsAdmin(businessCode.trim(), password);
    if (success) {
      router.replace('/(admin)/dashboard');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const displayError = localError || (error ? t(error) : '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { padding: spacing.md }]}
        >
          <Text style={[typography.body, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryBackground },
              ]}
            >
              <Text style={styles.iconText}>🏢</Text>
            </View>
            <Text
              style={[
                typography.h3,
                { color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
              ]}
            >
              {t('auth.admin.title')}
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { marginTop: spacing['2xl'] }]}>
            <Input
              label={t('auth.admin.code')}
              placeholder={t('auth.entry.codePlaceholder')}
              value={businessCode}
              onChangeText={(text) => {
                setBusinessCode(text);
                setLocalError('');
                clearError();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <View style={{ marginTop: spacing.md }}>
              <Input
                label={t('auth.admin.password')}
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setLocalError('');
                  clearError();
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                error={displayError}
                rightIcon={
                  <Text style={{ color: colors.textMuted }}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
            </View>

            <Button
              title={t('auth.admin.login')}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              style={{ marginTop: spacing.xl }}
            />
          </View>
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
  backButton: {
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
  },
  form: {
    width: '100%',
  },
});
