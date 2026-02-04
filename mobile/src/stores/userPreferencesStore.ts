import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PersonalData {
  name: string;
  phone: string;
  email: string;
}

interface BusinessPreferences {
  lastLocationId?: string;
  lastEmployeeId?: string;
  lastServiceId?: string;
  personalData?: PersonalData;
}

interface UserPreferencesState {
  // Preferences per business (keyed by business code)
  businessPreferences: Record<string, BusinessPreferences>;

  // Language
  language: 'bg' | 'en';

  // Notification settings
  pushNotificationsEnabled: boolean;
  reminderEnabled: boolean;

  // Actions
  getPreferencesForBusiness: (businessCode: string) => BusinessPreferences;
  setLastLocation: (businessCode: string, locationId: string) => void;
  setLastEmployee: (businessCode: string, employeeId: string) => void;
  setLastService: (businessCode: string, serviceId: string) => void;
  setPersonalData: (businessCode: string, data: PersonalData) => void;
  clearBusinessPreferences: (businessCode: string) => void;
  setLanguage: (language: 'bg' | 'en') => void;
  setPushNotifications: (enabled: boolean) => void;
  setReminder: (enabled: boolean) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      businessPreferences: {},
      language: 'bg',
      pushNotificationsEnabled: true,
      reminderEnabled: true,

      getPreferencesForBusiness: (businessCode) => {
        return get().businessPreferences[businessCode] || {};
      },

      setLastLocation: (businessCode, locationId) => {
        set((state) => ({
          businessPreferences: {
            ...state.businessPreferences,
            [businessCode]: {
              ...state.businessPreferences[businessCode],
              lastLocationId: locationId,
            },
          },
        }));
      },

      setLastEmployee: (businessCode, employeeId) => {
        set((state) => ({
          businessPreferences: {
            ...state.businessPreferences,
            [businessCode]: {
              ...state.businessPreferences[businessCode],
              lastEmployeeId: employeeId,
            },
          },
        }));
      },

      setLastService: (businessCode, serviceId) => {
        set((state) => ({
          businessPreferences: {
            ...state.businessPreferences,
            [businessCode]: {
              ...state.businessPreferences[businessCode],
              lastServiceId: serviceId,
            },
          },
        }));
      },

      setPersonalData: (businessCode, data) => {
        set((state) => ({
          businessPreferences: {
            ...state.businessPreferences,
            [businessCode]: {
              ...state.businessPreferences[businessCode],
              personalData: data,
            },
          },
        }));
      },

      clearBusinessPreferences: (businessCode) => {
        set((state) => {
          const newPreferences = { ...state.businessPreferences };
          delete newPreferences[businessCode];
          return { businessPreferences: newPreferences };
        });
      },

      setLanguage: (language) => set({ language }),
      setPushNotifications: (enabled) => set({ pushNotificationsEnabled: enabled }),
      setReminder: (enabled) => set({ reminderEnabled: enabled }),
    }),
    {
      name: 'gobarber-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
