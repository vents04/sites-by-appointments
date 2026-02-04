import { Business, Location, Employee, Service, Appointment } from '../../types';

// ============ MOCK BUSINESSES ============
export const MOCK_BUSINESSES: Business[] = [
  {
    _id: 'biz_001',
    name: 'Elegant Hair Studio',
    description: 'Premium hair styling services in the heart of Sofia',
    URLpostfix: 'elegant-hair',
    slotTime: 15,
    maximumDaysInFuture: 30,
    minimumTimeSlotsInFuture: 4,
    status: 'active',
    phone: '+359 888 123 456',
    email: 'contact@eleganthair.com',
    website: 'https://eleganthair.com',
    privacyPolicyURL: 'https://eleganthair.com/privacy',
    branding: {
      primaryColor: '#00ACC2', // Cyan/teal from web
      logo: 'https://via.placeholder.com/200x200/00ACC2/FFFFFF?text=EH',
    },
    adminPassword: 'admin123',
  },
  {
    _id: 'biz_002',
    name: 'Downtown Barbers',
    description: 'Classic barbershop experience with modern twist',
    URLpostfix: 'downtown-barbers',
    slotTime: 20,
    maximumDaysInFuture: 14,
    minimumTimeSlotsInFuture: 2,
    status: 'active',
    phone: '+359 888 456 789',
    email: 'info@downtownbarbers.com',
    website: 'https://downtownbarbers.com',
    privacyPolicyURL: 'https://downtownbarbers.com/privacy',
    branding: {
      primaryColor: '#D4AF37', // Gold
      logo: 'https://via.placeholder.com/200x200/D4AF37/FFFFFF?text=DB',
    },
    adminPassword: 'admin456',
  },
];

// ============ MOCK LOCATIONS ============
export const MOCK_LOCATIONS: Location[] = [
  // Elegant Hair - 2 locations
  {
    _id: 'loc_001',
    name: 'Център',
    addressName: 'ул. "Витоша" 123, София',
    lat: 42.6977,
    lon: 23.3219,
    phone: '+359 888 111 222',
    businessId: 'biz_001',
    employees: ['emp_001', 'emp_002'],
    workingHours: [
      { day: 'monday', open: '09:00', close: '18:00' },
      { day: 'tuesday', open: '09:00', close: '18:00' },
      { day: 'wednesday', open: '09:00', close: '18:00' },
      { day: 'thursday', open: '09:00', close: '18:00' },
      { day: 'friday', open: '09:00', close: '17:00' },
      { day: 'saturday', open: '10:00', close: '14:00' },
    ],
    status: 'active',
  },
  {
    _id: 'loc_002',
    name: 'Мол Парадайс',
    addressName: 'Мол Парадайс Център, етаж 2',
    lat: 42.6567,
    lon: 23.289,
    phone: '+359 888 333 444',
    businessId: 'biz_001',
    employees: ['emp_003'],
    workingHours: [
      { day: 'monday', open: '10:00', close: '21:00' },
      { day: 'tuesday', open: '10:00', close: '21:00' },
      { day: 'wednesday', open: '10:00', close: '21:00' },
      { day: 'thursday', open: '10:00', close: '21:00' },
      { day: 'friday', open: '10:00', close: '21:00' },
      { day: 'saturday', open: '10:00', close: '21:00' },
      { day: 'sunday', open: '10:00', close: '20:00' },
    ],
    status: 'active',
  },
  // Downtown Barbers - 1 location (auto-skip)
  {
    _id: 'loc_003',
    name: 'Главен салон',
    addressName: 'ул. "Граф Игнатиев" 45, София',
    lat: 42.7,
    lon: 23.33,
    phone: '+359 888 555 666',
    businessId: 'biz_002',
    employees: ['emp_004'],
    workingHours: [
      { day: 'tuesday', open: '09:00', close: '18:00' },
      { day: 'wednesday', open: '09:00', close: '18:00' },
      { day: 'thursday', open: '09:00', close: '18:00' },
      { day: 'friday', open: '09:00', close: '18:00' },
      { day: 'saturday', open: '09:00', close: '15:00' },
    ],
    status: 'active',
  },
];

// ============ MOCK EMPLOYEES ============
export const MOCK_EMPLOYEES: Employee[] = [
  // Elegant Hair employees
  {
    _id: 'emp_001',
    name: 'Иван Стилист',
    businessId: 'biz_001',
    services: ['svc_001', 'svc_002', 'svc_003'],
    status: 'active',
    avatar: 'https://via.placeholder.com/100x100/00ACC2/FFFFFF?text=IS',
  },
  {
    _id: 'emp_002',
    name: 'Мария Колорист',
    businessId: 'biz_001',
    services: ['svc_001', 'svc_004', 'svc_005'],
    status: 'active',
    avatar: 'https://via.placeholder.com/100x100/00ACC2/FFFFFF?text=MK',
  },
  {
    _id: 'emp_003',
    name: 'Петър Универсал',
    businessId: 'biz_001',
    services: ['svc_001', 'svc_002', 'svc_003', 'svc_004'],
    status: 'active',
    avatar: 'https://via.placeholder.com/100x100/00ACC2/FFFFFF?text=PU',
    // On vacation - edge case testing
    vacation: {
      start: '2026-02-10',
      end: '2026-02-17',
    },
  },
  // Downtown Barbers - single employee (auto-skip)
  {
    _id: 'emp_004',
    name: 'Георги Класик',
    businessId: 'biz_002',
    services: ['svc_006'],
    status: 'active',
    avatar: 'https://via.placeholder.com/100x100/D4AF37/FFFFFF?text=GK',
  },
];

// ============ MOCK SERVICES ============
export const MOCK_SERVICES: Service[] = [
  // Elegant Hair services
  {
    _id: 'svc_001',
    name: 'Подстригване',
    price: 25,
    priceFormatted: '25.00 лв.',
    currency: 'BGN',
    timeSlots: 2,
    durationMinutes: 30,
    businessId: 'biz_001',
    status: 'active',
    icon: '✂️',
  },
  {
    _id: 'svc_002',
    name: 'Подстригване + Брада',
    price: 35,
    priceFormatted: '35.00 лв.',
    currency: 'BGN',
    timeSlots: 3,
    durationMinutes: 45,
    businessId: 'biz_001',
    status: 'active',
    icon: '💈',
  },
  {
    _id: 'svc_003',
    name: 'Детско подстригване',
    price: 15,
    priceFormatted: '15.00 лв.',
    currency: 'BGN',
    timeSlots: 2,
    durationMinutes: 30,
    businessId: 'biz_001',
    status: 'active',
    icon: '👦',
  },
  {
    _id: 'svc_004',
    name: 'Боядисване',
    price: 60,
    priceFormatted: '60.00 лв.',
    currency: 'BGN',
    timeSlots: 6,
    durationMinutes: 90,
    businessId: 'biz_001',
    status: 'active',
    icon: '🎨',
  },
  {
    _id: 'svc_005',
    name: 'Кичури',
    price: 80,
    priceFormatted: '80.00 лв.',
    currency: 'BGN',
    timeSlots: 8,
    durationMinutes: 120,
    businessId: 'biz_001',
    status: 'active',
    icon: '✨',
  },
  // Downtown Barbers - single service (auto-skip)
  {
    _id: 'svc_006',
    name: 'Класическо подстригване',
    price: 20,
    priceFormatted: '20.00 лв.',
    currency: 'BGN',
    timeSlots: 2,
    durationMinutes: 40,
    businessId: 'biz_002',
    status: 'active',
    icon: '💇',
  },
];

// ============ MOCK APPOINTMENTS ============
// Generate dates relative to today
const today = new Date();
const formatDate = (date: Date) => date.toISOString();

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const setTime = (date: Date, hours: number, minutes: number) => {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export let MOCK_APPOINTMENTS: Appointment[] = [
  // Upcoming appointments
  {
    _id: 'apt_001',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_001',
    serviceId: 'svc_001',
    start: formatDate(setTime(addDays(today, 3), 10, 0)),
    end: formatDate(setTime(addDays(today, 3), 10, 30)),
    customer: {
      name: 'Иван Иванов',
      phone: '+359 888 123 456',
      email: 'ivan@email.com',
    },
    status: 'confirmed',
    createdAt: formatDate(addDays(today, -2)),
    createdBy: 'customer',
  },
  {
    _id: 'apt_002',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_002',
    serviceId: 'svc_004',
    start: formatDate(setTime(addDays(today, 3), 10, 30)),
    end: formatDate(setTime(addDays(today, 3), 12, 0)),
    customer: {
      name: 'Мария Петрова',
      phone: '+359 888 456 789',
      email: 'maria@email.com',
    },
    status: 'confirmed',
    createdAt: formatDate(addDays(today, -1)),
    createdBy: 'admin',
  },
  {
    _id: 'apt_003',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_001',
    serviceId: 'svc_002',
    start: formatDate(setTime(addDays(today, 5), 14, 0)),
    end: formatDate(setTime(addDays(today, 5), 14, 45)),
    customer: {
      name: 'Георги Димитров',
      phone: '+359 888 789 012',
      email: 'georgi@email.com',
    },
    status: 'confirmed',
    createdAt: formatDate(today),
    createdBy: 'customer',
  },
  // Past appointments
  {
    _id: 'apt_004',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_001',
    serviceId: 'svc_002',
    start: formatDate(setTime(addDays(today, -10), 14, 0)),
    end: formatDate(setTime(addDays(today, -10), 14, 45)),
    customer: {
      name: 'Иван Иванов',
      phone: '+359 888 123 456',
      email: 'ivan@email.com',
    },
    status: 'completed',
    createdAt: formatDate(addDays(today, -15)),
    createdBy: 'customer',
  },
  {
    _id: 'apt_005',
    calendarId: 'cal_001',
    locationId: 'loc_002',
    employeeId: 'emp_003',
    serviceId: 'svc_004',
    start: formatDate(setTime(addDays(today, -5), 11, 0)),
    end: formatDate(setTime(addDays(today, -5), 12, 30)),
    customer: {
      name: 'Елена Тодорова',
      phone: '+359 888 111 222',
      email: 'elena@email.com',
    },
    status: 'completed',
    createdAt: formatDate(addDays(today, -7)),
    createdBy: 'customer',
  },
  // Cancelled appointment
  {
    _id: 'apt_006',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_002',
    serviceId: 'svc_005',
    start: formatDate(setTime(addDays(today, -3), 15, 0)),
    end: formatDate(setTime(addDays(today, -3), 17, 0)),
    customer: {
      name: 'Стефан Николов',
      phone: '+359 888 333 444',
      email: 'stefan@email.com',
    },
    status: 'cancelled',
    createdAt: formatDate(addDays(today, -8)),
    createdBy: 'customer',
  },
];

// Function to add appointment (for testing)
export const addMockAppointment = (appointment: Appointment) => {
  MOCK_APPOINTMENTS = [...MOCK_APPOINTMENTS, appointment];
};

// Function to update appointment status
export const updateMockAppointmentStatus = (
  appointmentId: string,
  status: Appointment['status']
) => {
  MOCK_APPOINTMENTS = MOCK_APPOINTMENTS.map((apt) =>
    apt._id === appointmentId ? { ...apt, status } : apt
  );
};
