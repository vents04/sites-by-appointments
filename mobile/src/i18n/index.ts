import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import bg from './bg.json';
import en from './en.json';

const LANGUAGE_KEY = '@gobarber_language';

const resources = {
  bg: { translation: bg },
  en: { translation: en },
};

// Get stored language or use device language, default to Bulgarian
const getInitialLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (storedLanguage && (storedLanguage === 'bg' || storedLanguage === 'en')) {
      return storedLanguage;
    }
    // Check device language
    const deviceLocale = Localization.getLocales()[0]?.languageCode;
    if (deviceLocale === 'en') {
      return 'en';
    }
    // Default to Bulgarian
    return 'bg';
  } catch {
    return 'bg';
  }
};

// Initialize with Bulgarian as default, will be updated when app loads
i18n.use(initReactI18next).init({
  resources,
  lng: 'bg', // Default language
  fallbackLng: 'bg',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Function to change language and persist
export const changeLanguage = async (language: 'bg' | 'en') => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
};

// Function to initialize language from storage
export const initializeLanguage = async () => {
  const language = await getInitialLanguage();
  await i18n.changeLanguage(language);
};

export default i18n;
