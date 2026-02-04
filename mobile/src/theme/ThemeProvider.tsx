import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, createLightTheme, createDarkTheme, defaultPrimaryColor } from './colors';
import { spacing, borderRadius, shadows } from './spacing';
import { typography } from './typography';

interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  typography: typeof typography;
  isDark: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  setPrimaryColor: (color: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialPrimaryColor?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialPrimaryColor = defaultPrimaryColor,
}) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false); // Default to light
  const [primaryColor, setPrimaryColorState] = useState(initialPrimaryColor);

  // Create theme based on current settings
  const colors = isDark
    ? createDarkTheme(primaryColor)
    : createLightTheme(primaryColor);

  const theme: Theme = {
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
    isDark,
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, setPrimaryColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to just get theme colors
export const useColors = (): ThemeColors => {
  const { theme } = useTheme();
  return theme.colors;
};

// Hook to get specific theme values
export const useThemeValue = <K extends keyof Theme>(key: K): Theme[K] => {
  const { theme } = useTheme();
  return theme[key];
};
