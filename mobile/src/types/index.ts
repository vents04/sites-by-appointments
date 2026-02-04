// ============ BUSINESS ============
export interface Business {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
  };
  URLpostfix: string;
  slotTime: number;
  maximumDaysInFuture: number;
  minimumTimeSlotsInFuture: number;
  status: 'active' | 'inactive' | 'deleted';
  privacyPolicyURL?: string;
  branding: {
    primaryColor: string;
    logo?: string;
  };
  adminPassword?: string;
}

// ============ LOCATION ============
export interface Location {
  _id: string;
  name: string;
  addressName: string;
  lat: number;
  lon: number;
  phone: string;
  businessId: string;
  employees: string[];
  workingHours: WorkingHour[];
  status: 'active' | 'inactive' | 'deleted';
}

export interface WorkingHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string;
  close: string;
}

// ============ EMPLOYEE ============
export interface Employee {
  _id: string;
  name: string;
  teamupSubCalendarId?: number;
  businessId: string;
  services: string[];
  status: 'active' | 'inactive' | 'deleted';
  avatar?: string;
  vacation?: {
    start: string;
    end: string;
  };
}

// ============ SERVICE ============
export interface Service {
  _id: string;
  name: string;
  price: number;
  priceFormatted: string;
  currency: string;
  timeSlots: number;
  durationMinutes: number;
  businessId: string;
  status: 'active' | 'inactive' | 'deleted';
  icon?: string;
}

// ============ APPOINTMENT ============
export interface Appointment {
  _id: string;
  calendarId: string;
  locationId: string;
  employeeId: string;
  serviceId: string;
  start: string;
  end: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  createdBy: 'customer' | 'admin';
}

// ============ TIME SLOT ============
export interface TimeSlot {
  start: string;
  end: string;
  employeeId?: string;
}

// ============ USER PREFERENCES ============
export interface UserPreferences {
  lastLocationId?: string;
  lastEmployeeId?: string;
  lastServiceId?: string;
  personalData?: {
    name: string;
    phone: string;
    email: string;
  };
}

// ============ AUTH STATE ============
export interface AuthState {
  businessCode: string | null;
  role: 'customer' | 'admin' | null;
  business: Business | null;
  isLoading: boolean;
}

// ============ BOOKING STATE ============
export interface BookingState {
  locationId: string | null;
  employeeId: string | null;
  serviceId: string | null;
  date: string | null;
  timeSlot: TimeSlot | null;
  personalData: {
    name: string;
    phone: string;
    email: string;
  } | null;
  assignedEmployeeId: string | null;
}

// ============ CALENDAR ============
export interface Calendar {
  _id: string;
  businessId: string;
  integration: string;
  timezone: string;
  status: 'active' | 'inactive' | 'deleted';
}

// ============ SPECIAL CONSTANTS ============
export const ANYONE_EMPLOYEE_ID = 'ANYONE';
