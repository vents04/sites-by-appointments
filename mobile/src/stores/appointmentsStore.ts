import { create } from 'zustand';
import { Appointment } from '../types';
import { 
  getAppointmentsByCustomerEmail, 
  getAppointmentsByBusinessId,
  createAppointment,
  cancelAppointment 
} from '../services/mock/mockApi';

interface AppointmentsState {
  // Customer appointments
  appointments: Appointment[];
  
  // Admin: all business appointments
  businessAppointments: Appointment[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Actions
  fetchCustomerAppointments: (email: string) => Promise<void>;
  fetchBusinessAppointments: (businessId: string) => Promise<void>;
  createBooking: (appointmentData: Omit<Appointment, '_id' | 'createdAt' | 'status'>) => Promise<Appointment | null>;
  cancelBooking: (appointmentId: string) => Promise<boolean>;
  addAppointment: (appointment: Appointment) => void;
  clearAppointments: () => void;
  clearError: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>()((set, get) => ({
  appointments: [],
  businessAppointments: [],
  isLoading: false,
  isCreating: false,
  error: null,

  fetchCustomerAppointments: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const appointments = await getAppointmentsByCustomerEmail(email);
      set({ appointments, isLoading: false });
    } catch (error) {
      set({ error: 'errors.unknownError', isLoading: false });
    }
  },

  fetchBusinessAppointments: async (businessId) => {
    set({ isLoading: true, error: null });
    try {
      const appointments = await getAppointmentsByBusinessId(businessId);
      set({ businessAppointments: appointments, isLoading: false });
    } catch (error) {
      set({ error: 'errors.unknownError', isLoading: false });
    }
  },

  createBooking: async (appointmentData) => {
    set({ isCreating: true, error: null });
    try {
      const newAppointment = await createAppointment(appointmentData);
      set((state) => ({
        appointments: [...state.appointments, newAppointment],
        businessAppointments: [...state.businessAppointments, newAppointment],
        isCreating: false,
      }));
      return newAppointment;
    } catch (error) {
      set({ error: 'errors.unknownError', isCreating: false });
      return null;
    }
  },

  cancelBooking: async (appointmentId) => {
    set({ isLoading: true, error: null });
    try {
      await cancelAppointment(appointmentId);
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        ),
        businessAppointments: state.businessAppointments.map((apt) =>
          apt._id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ error: 'errors.unknownError', isLoading: false });
      return false;
    }
  },

  addAppointment: (appointment) => {
    set((state) => ({
      appointments: [...state.appointments, appointment],
      businessAppointments: [...state.businessAppointments, appointment],
    }));
  },

  clearAppointments: () => {
    set({ appointments: [], businessAppointments: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
