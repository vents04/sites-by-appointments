import { 
  Business, 
  Location, 
  Employee, 
  Service, 
  Appointment, 
  TimeSlot,
  ANYONE_EMPLOYEE_ID 
} from '../../types';
import { 
  MOCK_BUSINESSES, 
  MOCK_LOCATIONS, 
  MOCK_EMPLOYEES, 
  MOCK_SERVICES, 
  MOCK_APPOINTMENTS,
  addMockAppointment,
  updateMockAppointmentStatus 
} from './mockData';
import { addDays, format, parse, isWithinInterval, isSameDay, setHours, setMinutes } from 'date-fns';

// Simulate network delay
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ BUSINESS API ============

export const getBusinessByCode = async (code: string): Promise<Business | null> => {
  await delay(800);
  const business = MOCK_BUSINESSES.find(
    (b) => b.URLpostfix.toLowerCase() === code.toLowerCase()
  );
  return business || null;
};

export const validateAdminCredentials = async (
  code: string,
  password: string
): Promise<{ success: boolean; business?: Business }> => {
  await delay(1000);
  const business = MOCK_BUSINESSES.find(
    (b) => b.URLpostfix.toLowerCase() === code.toLowerCase() && b.adminPassword === password
  );
  if (business) {
    return { success: true, business };
  }
  return { success: false };
};

export const updateBusinessBranding = async (
  businessId: string,
  branding: { primaryColor: string; logo?: string }
): Promise<Business | null> => {
  await delay(500);
  const index = MOCK_BUSINESSES.findIndex((b) => b._id === businessId);
  if (index !== -1) {
    MOCK_BUSINESSES[index] = {
      ...MOCK_BUSINESSES[index],
      branding: { ...MOCK_BUSINESSES[index].branding, ...branding },
    };
    return MOCK_BUSINESSES[index];
  }
  return null;
};

// ============ LOCATION API ============

export const getLocationsByBusinessId = async (businessId: string): Promise<Location[]> => {
  await delay(300);
  return MOCK_LOCATIONS.filter((l) => l.businessId === businessId && l.status === 'active');
};

// ============ EMPLOYEE API ============

export const getEmployeesByBusinessId = async (businessId: string): Promise<Employee[]> => {
  await delay(300);
  return MOCK_EMPLOYEES.filter((e) => e.businessId === businessId && e.status === 'active');
};

export const getEmployeesByLocationId = async (locationId: string): Promise<Employee[]> => {
  await delay(300);
  const location = MOCK_LOCATIONS.find((l) => l._id === locationId);
  if (!location) return [];
  return MOCK_EMPLOYEES.filter(
    (e) => location.employees.includes(e._id) && e.status === 'active'
  );
};

// ============ SERVICE API ============

export const getServicesByBusinessId = async (businessId: string): Promise<Service[]> => {
  await delay(300);
  return MOCK_SERVICES.filter((s) => s.businessId === businessId && s.status === 'active');
};

export const getServicesByEmployeeId = async (employeeId: string): Promise<Service[]> => {
  await delay(300);
  if (employeeId === ANYONE_EMPLOYEE_ID) {
    // Return all services for the business
    return MOCK_SERVICES.filter((s) => s.status === 'active');
  }
  const employee = MOCK_EMPLOYEES.find((e) => e._id === employeeId);
  if (!employee) return [];
  return MOCK_SERVICES.filter(
    (s) => employee.services.includes(s._id) && s.status === 'active'
  );
};

// ============ TIME SLOTS API ============

const getDayName = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const isEmployeeOnVacation = (employee: Employee, date: Date): boolean => {
  if (!employee.vacation) return false;
  const vacationStart = new Date(employee.vacation.start);
  const vacationEnd = new Date(employee.vacation.end);
  return isWithinInterval(date, { start: vacationStart, end: vacationEnd });
};

const generateTimeSlotsForEmployee = (
  employee: Employee,
  location: Location,
  service: Service,
  business: Business,
  date: Date
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayName = getDayName(date);
  
  // Check if employee is on vacation
  if (isEmployeeOnVacation(employee, date)) {
    return slots;
  }

  // Get working hours for this day
  const workingHour = location.workingHours.find((wh) => wh.day === dayName);
  if (!workingHour) return slots;

  // Parse working hours
  const [openHour, openMin] = workingHour.open.split(':').map(Number);
  const [closeHour, closeMin] = workingHour.close.split(':').map(Number);

  // Calculate slot duration
  const slotDurationMinutes = business.slotTime * service.timeSlots;

  // Get existing appointments for this employee on this date
  const existingAppointments = MOCK_APPOINTMENTS.filter(
    (apt) =>
      apt.employeeId === employee._id &&
      apt.status === 'confirmed' &&
      isSameDay(new Date(apt.start), date)
  );

  // Generate slots
  let currentTime = setMinutes(setHours(date, openHour), openMin);
  const endTime = setMinutes(setHours(date, closeHour), closeMin);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDurationMinutes * 60000);
    
    // Check if slot fits within working hours
    if (slotEnd > endTime) break;

    // Check if slot overlaps with existing appointments
    const isOccupied = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.start);
      const aptEnd = new Date(apt.end);
      return (
        (currentTime >= aptStart && currentTime < aptEnd) ||
        (slotEnd > aptStart && slotEnd <= aptEnd) ||
        (currentTime <= aptStart && slotEnd >= aptEnd)
      );
    });

    // Check minimum advance booking time
    const now = new Date();
    const minAdvanceTime = business.minimumTimeSlotsInFuture * business.slotTime * 60000;
    const isInFuture = currentTime.getTime() > now.getTime() + minAdvanceTime;

    if (!isOccupied && isInFuture) {
      slots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        employeeId: employee._id,
      });
    }

    // Move to next slot
    currentTime = new Date(currentTime.getTime() + business.slotTime * 60000);
  }

  return slots;
};

export const getAvailableTimeSlots = async (
  businessId: string,
  locationId: string,
  employeeId: string,
  serviceId: string,
  dateStr: string
): Promise<TimeSlot[]> => {
  await delay(600);

  const business = MOCK_BUSINESSES.find((b) => b._id === businessId);
  const location = MOCK_LOCATIONS.find((l) => l._id === locationId);
  const service = MOCK_SERVICES.find((s) => s._id === serviceId);

  if (!business || !location || !service) return [];

  const date = new Date(dateStr);
  let slots: TimeSlot[] = [];

  if (employeeId === ANYONE_EMPLOYEE_ID) {
    // Get slots from all employees at this location who offer this service
    const employees = MOCK_EMPLOYEES.filter(
      (e) =>
        location.employees.includes(e._id) &&
        e.services.includes(serviceId) &&
        e.status === 'active'
    );

    for (const employee of employees) {
      const employeeSlots = generateTimeSlotsForEmployee(
        employee,
        location,
        service,
        business,
        date
      );
      slots = [...slots, ...employeeSlots];
    }

    // Sort by time and remove duplicates (same time, different employee - keep first)
    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  } else {
    const employee = MOCK_EMPLOYEES.find((e) => e._id === employeeId);
    if (employee) {
      slots = generateTimeSlotsForEmployee(employee, location, service, business, date);
    }
  }

  return slots;
};

export const getAvailableDates = async (
  businessId: string,
  locationId: string,
  employeeId: string,
  serviceId: string
): Promise<string[]> => {
  await delay(400);

  const business = MOCK_BUSINESSES.find((b) => b._id === businessId);
  if (!business) return [];

  const availableDates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < business.maximumDaysInFuture; i++) {
    const date = addDays(today, i);
    const slots = await getAvailableTimeSlots(
      businessId,
      locationId,
      employeeId,
      serviceId,
      date.toISOString()
    );
    if (slots.length > 0) {
      availableDates.push(format(date, 'yyyy-MM-dd'));
    }
  }

  return availableDates;
};

// ============ APPOINTMENTS API ============

export const getAppointmentsByCustomerEmail = async (email: string): Promise<Appointment[]> => {
  await delay(500);
  return MOCK_APPOINTMENTS.filter(
    (apt) => apt.customer.email.toLowerCase() === email.toLowerCase()
  );
};

export const getAppointmentsByBusinessId = async (businessId: string): Promise<Appointment[]> => {
  await delay(500);
  const businessLocations = MOCK_LOCATIONS.filter((l) => l.businessId === businessId);
  const locationIds = businessLocations.map((l) => l._id);
  return MOCK_APPOINTMENTS.filter((apt) => locationIds.includes(apt.locationId));
};

export const createAppointment = async (
  data: Omit<Appointment, '_id' | 'createdAt' | 'status'>
): Promise<Appointment> => {
  await delay(1000);

  const newAppointment: Appointment = {
    ...data,
    _id: `apt_${Date.now()}`,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  addMockAppointment(newAppointment);
  return newAppointment;
};

export const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
  await delay(500);
  updateMockAppointmentStatus(appointmentId, 'cancelled');
  return true;
};

// ============ HELPERS ============

export const getLocationById = (locationId: string): Location | undefined => {
  return MOCK_LOCATIONS.find((l) => l._id === locationId);
};

export const getEmployeeById = (employeeId: string): Employee | undefined => {
  return MOCK_EMPLOYEES.find((e) => e._id === employeeId);
};

export const getServiceById = (serviceId: string): Service | undefined => {
  return MOCK_SERVICES.find((s) => s._id === serviceId);
};

export const getBusinessById = (businessId: string): Business | undefined => {
  return MOCK_BUSINESSES.find((b) => b._id === businessId);
};
