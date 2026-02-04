import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { useAppointmentsStore } from '../../../src/stores/appointmentsStore';
import { changeLanguage } from '../../../src/i18n';
import { Card } from '../../../src/components/ui';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business, businessCode, logout } = useAuthStore();
  const {
    language,
    pushNotificationsEnabled,
    reminderEnabled,
    setLanguage,
    setPushNotifications,
    setReminder,
    clearBusinessPreferences,
  } = useUserPreferencesStore();
  const { clearAppointments } = useAppointmentsStore();

  const { colors, spacing, typography } = theme;

  const handleLanguageChange = async () => {
    const newLanguage = language === 'bg' ? 'en' : 'bg';
    setLanguage(newLanguage);
    await changeLanguage(newLanguage);
  };

  const handleLeaveBusiness = () => {
    Alert.alert(
      t('settings.leaveConfirmTitle'),
      t('settings.leaveConfirmMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: () => {
            // Clear local data
            if (businessCode) {
              clearBusinessPreferences(businessCode);
            }
            clearAppointments();
            logout();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
          {t('settings.language')}
        </Text>
        <Card onPress={handleLanguageChange} style={{ marginBottom: spacing.xl }}>
          <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryBackground }]}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              {language === 'bg' ? 'Български' : 'English'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </View>
        </Card>

        {/* Notifications */}
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>
          {t('settings.notifications')}
        </Text>
        <Card pressable={false} style={{ marginBottom: spacing.xl }}>
          <View style={styles.settingRow}>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              {t('settings.pushNotifications')}
            </Text>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.settingRow}>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              {t('settings.reminder')}
            </Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Leave Business */}
        <Card onPress={handleLeaveBusiness} style={{ marginBottom: spacing.xl }}>
          <View style={styles.settingRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.error }]}>
                {t('settings.leaveBusiness')}
              </Text>
              {business && (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  ({business.name})
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Version */}
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
          ]}
        >
          {t('settings.version')}: 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
