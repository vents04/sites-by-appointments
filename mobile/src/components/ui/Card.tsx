import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  selected?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  pressable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  selected = false,
  variant = 'default',
  padding = 'md',
  pressable = true,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, shadows } = theme;

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'lg':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  const getBackgroundColor = () => {
    if (selected) return colors.primaryBackground;
    return colors.card;
  };

  const getBorderColor = () => {
    if (selected) return colors.primary;
    if (variant === 'outlined') return colors.border;
    return 'transparent';
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: borderRadius.lg,
    padding: getPadding(),
    borderWidth: selected || variant === 'outlined' ? 2 : 0,
    borderColor: getBorderColor(),
    ...(variant === 'elevated' ? shadows.md : {}),
  };

  if (pressable) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[cardStyle, style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};
