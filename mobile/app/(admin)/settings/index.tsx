import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUserPreferencesStore } from '../../../src/stores/userPreferencesStore';
import { changeLanguage } from '../../../src/i18n';
import { Card } from '../../../src/components/ui';

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { business, logout } = useAuthStore();
  const { language, setLanguage } = useUserPreferencesStore();

  const { colors, spacing, typography } = theme;

  const handleLanguageChange = async () => {
    const newLanguage = language === 'bg' ? 'en' : 'bg';
    setLanguage(newLanguage);
    await changeLanguage(newLanguage);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      'Сигурни ли сте, че искате да излезете?',
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: () => {
            logout();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'business-outline' as const,
      title: t('admin.settings.businessInfo'),
      onPress: () => {},
    },
    {
      icon: 'time-outline' as const,
      title: t('admin.settings.workingHours'),
      onPress: () => {},
    },
    {
      icon: 'people-outline' as const,
      title: t('admin.settings.employees'),
      onPress: () => {},
    },
    {
      icon: 'color-palette-outline' as const,
      title: t('admin.settings.branding'),
      subtitle: 'Цветове, лого',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text }]}>
          {t('admin.settings.title')}
        </Text>
        {business && (
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {business.name}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <Card key={index} onPress={item.onPress} style={{ marginBottom: spacing.sm }}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.primaryBackground }]}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[typography.body, { color: colors.text }]}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </Card>
        ))}

        {/* Language */}
        <Text
          style={[
            typography.label,
            { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm },
          ]}
        >
          {t('settings.language')}
        </Text>
        <Card onPress={handleLanguageChange}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.primaryBackground }]}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              {language === 'bg' ? 'Български' : 'English'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </View>
        </Card>

        {/* Logout */}
        <Card
          onPress={handleLogout}
          style={{ marginTop: spacing.xl }}
        >
          <View style={styles.menuRow}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={[typography.body, { color: colors.error }]}>
              {t('settings.logout')}
            </Text>
          </View>
        </Card>

        {/* Version */}
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, textAlign: 'center', marginTop: spacing['2xl'] },
          ]}
        >
          {t('settings.version')}: 1.0.0 (Admin)
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
});
