import { create } from 'zustand';
import { TimeSlot, ANYONE_EMPLOYEE_ID } from '../types';

interface PersonalData {
  name: string;
  phone: string;
  email: string;
}

interface BookingState {
  // Booking data
  locationId: string | null;
  employeeId: string | null; // Can be ANYONE_EMPLOYEE_ID
  serviceId: string | null;
  date: string | null; // YYYY-MM-DD
  timeSlot: TimeSlot | null;
  personalData: PersonalData | null;
  assignedEmployeeId: string | null; // Resolved when "anyone" + time selected

  // UI state
  currentStep: number;
  totalSteps: number;
  privacyAccepted: boolean;

  // Actions
  setLocation: (locationId: string) => void;
  setEmployee: (employeeId: string) => void;
  setService: (serviceId: string) => void;
  setDate: (date: string) => void;
  setTimeSlot: (timeSlot: TimeSlot) => void;
  setPersonalData: (data: PersonalData) => void;
  setAssignedEmployee: (employeeId: string) => void;
  setCurrentStep: (step: number) => void;
  setTotalSteps: (steps: number) => void;
  setPrivacyAccepted: (accepted: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  // Computed
  isAnyoneSelected: () => boolean;
  getProgress: () => number;
}

const initialState = {
  locationId: null,
  employeeId: null,
  serviceId: null,
  date: null,
  timeSlot: null,
  personalData: null,
  assignedEmployeeId: null,
  currentStep: 0,
  totalSteps: 6,
  privacyAccepted: false,
};

export const useBookingStore = create<BookingState>()((set, get) => ({
  ...initialState,

  setLocation: (locationId) => set({ locationId }),
  setEmployee: (employeeId) => set({ employeeId, assignedEmployeeId: null }),
  setService: (serviceId) => set({ serviceId }),
  setDate: (date) => set({ date, timeSlot: null }),
  setTimeSlot: (timeSlot) => set({ timeSlot }),
  setPersonalData: (data) => set({ personalData: data }),
  setAssignedEmployee: (employeeId) => set({ assignedEmployeeId: employeeId }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setTotalSteps: (steps) => set({ totalSteps: steps }),
  setPrivacyAccepted: (accepted) => set({ privacyAccepted: accepted }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  reset: () => set(initialState),

  isAnyoneSelected: () => get().employeeId === ANYONE_EMPLOYEE_ID,

  getProgress: () => {
    const { currentStep, totalSteps } = get();
    return ((currentStep + 1) / totalSteps) * 100;
  },
}));
