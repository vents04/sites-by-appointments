import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business } from '../types';
import { getBusinessByCode, validateAdminCredentials } from '../services/mock/mockApi';

interface AuthState {
  // State
  businessCode: string | null;
  role: 'customer' | 'admin' | null;
  business: Business | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginAsCustomer: (code: string) => Promise<boolean>;
  loginAsAdmin: (code: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      businessCode: null,
      role: null,
      business: null,
      isLoading: false,
      error: null,

      // Login as customer
      loginAsCustomer: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          const business = await getBusinessByCode(code);
          if (business) {
            set({
              businessCode: code,
              role: 'customer',
              business,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: 'auth.entry.invalidCode',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'errors.unknownError',
            isLoading: false,
          });
          return false;
        }
      },

      // Login as admin
      loginAsAdmin: async (code: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await validateAdminCredentials(code, password);
          if (result.success && result.business) {
            set({
              businessCode: code,
              role: 'admin',
              business: result.business,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: 'auth.admin.invalidCredentials',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: 'errors.unknownError',
            isLoading: false,
          });
          return false;
        }
      },

      // Logout
      logout: () => {
        set({
          businessCode: null,
          role: null,
          business: null,
          error: null,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set loading
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'gobarber-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        businessCode: state.businessCode,
        role: state.role,
        business: state.business,
      }),
    }
  )
);
