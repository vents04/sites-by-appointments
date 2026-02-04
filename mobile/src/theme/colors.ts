// Base colors that don't change
export const baseColors = {
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gray scale
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Status colors
  success: {
    light: '#81C784',
    main: '#4CAF50',
    dark: '#388E3C',
  },
  warning: {
    light: '#FFB74D',
    main: '#FF9800',
    dark: '#F57C00',
  },
  error: {
    light: '#E57373',
    main: '#F44336',
    dark: '#D32F2F',
  },
  info: {
    light: '#64B5F6',
    main: '#2196F3',
    dark: '#1976D2',
  },
};

// Default primary color (neutral near-black)
export const defaultPrimaryColor = '#1A1A1A';

// Function to generate color variants from a primary color
export const generatePrimaryVariants = (primaryColor: string) => {
  // For neutral/black primary, use proper gray variants
  return {
    primary: primaryColor,
    primaryLight: '#404040', // Lighter gray
    primaryDark: '#0D0D0D', // Darker black
    primaryBackground: '#F5F5F5', // Light gray background
  };
};

// Theme interface
export interface ThemeColors {
  // Primary (dynamic based on business)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBackground: string;

  // Background
  background: string;
  surface: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;

  // Border
  border: string;
  borderLight: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Other
  disabled: string;
  placeholder: string;
  icon: string;
  iconMuted: string;
}

// Light theme
export const createLightTheme = (primaryColor: string = defaultPrimaryColor): ThemeColors => {
  const primaryVariants = generatePrimaryVariants(primaryColor);

  return {
    // Primary
    ...primaryVariants,

    // Background
    background: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Text
    text: baseColors.gray[900],
    textSecondary: baseColors.gray[700],
    textMuted: baseColors.gray[500],
    textOnPrimary: '#FFFFFF',

    // Border
    border: baseColors.gray[300],
    borderLight: baseColors.gray[200],

    // Status
    success: baseColors.success.main,
    warning: baseColors.warning.main,
    error: baseColors.error.main,
    info: baseColors.info.main,

    // Other
    disabled: baseColors.gray[400],
    placeholder: baseColors.gray[500],
    icon: baseColors.gray[700],
    iconMuted: baseColors.gray[500],
  };
};

// Dark theme - near pure black neutral design
export const createDarkTheme = (primaryColor: string = defaultPrimaryColor): ThemeColors => {
  const primaryVariants = generatePrimaryVariants(primaryColor);

  return {
    // Primary
    ...primaryVariants,

    // Background - near pure black
    background: '#0A0A0A',
    surface: '#141414',
    card: '#1C1C1C',

    // Text
    text: '#FAFAFA',
    textSecondary: '#B0B0B0',
    textMuted: '#707070',
    textOnPrimary: '#FFFFFF',

    // Border
    border: '#2A2A2A',
    borderLight: '#1F1F1F',

    // Status
    success: baseColors.success.light,
    warning: baseColors.warning.light,
    error: baseColors.error.light,
    info: baseColors.info.light,

    // Other
    disabled: '#404040',
    placeholder: '#606060',
    icon: '#909090',
    iconMuted: '#505050',
  };
};
