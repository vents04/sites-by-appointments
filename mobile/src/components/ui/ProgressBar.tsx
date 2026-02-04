import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
  animated = true,
  style,
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius } = theme;

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: animated
        ? withTiming(`${clampedProgress}%`, {
            duration: 300,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          })
        : `${clampedProgress}%`,
    };
  }, [clampedProgress, animated]);

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.borderLight,
          borderRadius: borderRadius.full,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.full,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});
