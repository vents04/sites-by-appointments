import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  return (
    <View style={styles.container}>
      {iconName ? (
        <Ionicons 
          name={iconName} 
          size={64} 
          color={colors.textMuted} 
          style={{ marginBottom: spacing.md }} 
        />
      ) : icon ? (
        <Text style={[styles.icon, { marginBottom: spacing.md }]}>{icon}</Text>
      ) : null}
      <Text
        style={[
          typography.h4,
          { color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
        ]}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: spacing.lg,
            },
          ]}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
  },
});
