'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { getAvailableTimeSlots, getNotices, postEvent } from '@/utils/request'
import { Calendar } from './Calendar';

import moment from 'moment-timezone';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from './LoadingSpinner';

import { TbChevronLeft } from "react-icons/tb";
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Link from 'next/link';

const steps = [
  {
    id: 'Стъпка 1',
    name: 'Избор на услуга',
  },
  {
    id: 'Стъпка 2',
    name: 'Избор на дата и час',
  },
  {
    id: 'Стъпка 3',
    name: 'Лични данни',
  },
  {
    id: 'Стъпка 4',
    name: 'Потвърждение',
  }
]

export default function Form(params: any) {
  const { toast } = useToast();

  const [previousStep, setPreviousStep] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const [location, setLocation] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [service, setService] = useState<any>(null)

  const [timeSlots, setTimeSlots] = useState<any>(null)
  const [startDt, setStartDt] = useState<any>(null)
  const [endDt, setEndDt] = useState<any>(null)
  // start date used in calendar component
  const [startDate, setStartDate] = useState<any>(new Date())
  const [notices, setNotices] = useState<any>(null)

  const [name, setName] = useState<any>(null)
  const [phone, setPhone] = useState<any>(null)
  const [email, setEmail] = useState<any>(null)

  const [errors, setErrors] = useState<any>({});

  const [shouldRefreshTimeSlots, setShouldRefreshTimeSlots] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [pointerEventsDisabled, setPointerEventsDisabled] = useState(false);
  const [progress, setProgress] = useState(25)

  const delta = currentStep - previousStep

  const business = params.business

  const next = async () => {
    const validateStep = () => {
      let errors: any = {};
      if (currentStep === 0) {
        if (!location) errors.location = 'Изберете локация';
        if (!employee) errors.employee = 'Изберете бръснар';
        if (!service) errors.service = 'Изберете услуга';
      } else if (currentStep === 2) {
        if (!name) errors.name = 'Името е задължително';
        if (!phone) errors.phone = 'Телефонният номер е задължителен';
        if (!email) errors.email = 'Имейлът е задължителен';
        if (!email.match('[A-Za-z0-9\\._%+\\-]+@[A-Za-z0-9\\.-]+\\.[A-Za-z]{2,}')) errors.email = 'Имейлът е невалиден';
      }
      setErrors(errors);
      return Object.keys(errors).length === 0;
    };

    if (!validateStep()) return;

    if (currentStep < steps.length - 1) {
      if (currentStep === 0) {
        await _getAvailableTimeSlots();
        await _getNotices();
      }
      let temp = currentStep;
      setPreviousStep(currentStep)
      setCurrentStep(step => step + 1)
      setProgress((temp+2) * (100 / steps.length));
    }

    if (currentStep === steps.length - 1) {
      await handleSubmit();
    }
  }

  const prev = () => {
    let temp = currentStep;
    if (currentStep > 0) {
      setPreviousStep(currentStep)
      setCurrentStep(step => step - 1)
      triggerValueReset(temp)
      setProgress(temp * (100 / steps.length));
    }
    if(temp === 1) {
      setShouldRefreshTimeSlots(false);
    }
  }

  const triggerValueReset = (step: number) => {
    if(step === 0) {
      setShouldRefreshTimeSlots(true);
    }
  }

  const _getAvailableTimeSlots = async () => {
    if (shouldRefreshTimeSlots) {
      setPointerEventsDisabled(true);
  
      const timeout = setTimeout(() => {
        setIsLoading(true);
      }, 500);
  
      try {
        const response = await getAvailableTimeSlots(business.calendar._id, employee, service);
        setTimeSlots(response);
      } catch (error: any) {
        toast({
          title: "Грешка",
          description: error.message,
          variant: "destructive",
        });
        prev();
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
        setPointerEventsDisabled(false);
      }
    }
  };  

  const _getNotices = async () => {
    const response = await getNotices(employee);
    setNotices(response);
  }

  const handleSubmit = async () => {
    setPointerEventsDisabled(true);
  
    const timeout = setTimeout(() => {
      setIsLoading(true);
    }, 500);
  
    try {
      const eventData = {
        calendarId: business.calendar._id,
        employeeId: employee,
        serviceId: service,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        startDt,
        endDt,
        name,
        email,
        phone,
      };
  
      await postEvent(eventData);
      
      setOriginalState();
  
      toast({
        title: "✅ Успешно записан час!",
        description: "Ще получите копие от резервацията на предоставения имейл",
      });
    } catch (error: any) {
      toast({
        title: "Грешка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
      setPointerEventsDisabled(false);
    }
  };  

  const setOriginalState = () => {
    setPreviousStep(0);
    setCurrentStep(0);

    setLocation(null);
    setEmployee(null);
    setService(null);

    setTimeSlots(null);
    setStartDt(null);
    setEndDt(null);
    setStartDate(new Date());

    setName(null);
    setEmail(null);
    setPhone(null);

    setErrors({});

    setShouldRefreshTimeSlots(false);

    setProgress(25);
  }

  return (
    <>
    {
      isLoading
      ? <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <LoadingSpinner className="text-white" size={36}/>
      </div>
      : null
    }
    <section className={`${pointerEventsDisabled ? 'pointer-events-none' : ''} inset-0 flex flex-col justify-between p-4`}>
      <div>
        <div className="flex items-center justify-start space-x-4 w-full py-3">
          {
            currentStep != 0
            ? <button className="bg-zinc-100 shadow-lg flex items-center rounded border border-zinc-300 p-1" onClick={prev}>
                <TbChevronLeft size={16} className="text-zinc-500" />
                <p className="text-xs pr-1">Назад</p>
              </button>
            : null
          }
          <span className="text-xl font-semibold text-zinc-800">{steps[currentStep].name}</span>
        </div>
        <Progress value={progress} className="w-[100%]" />
      </div>

      {/* Form */}
      <form className='mt-4'>
        {/* Step 1 */}
        {currentStep === 0 && (
          <motion.div
            initial={{ x: delta >= 0 ? '50%' : '-50%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
              {/* Location Selector */}
              <div className="sm:col-span-3 mt-4">
                <label
                  htmlFor="location"
                  className="block text-lg font-medium text-gray-700"
                >
                  Локация
                </label>
                <select
                  id="location"
                  onChange={(e) => {
                    const selectedLocation = e.target.value;
                    setLocation(selectedLocation);
                    setEmployee(null);
                    setService(null);
                    setErrors({ ...errors, location: null, employee: null, service: null });
                    triggerValueReset(0);
                  }}
                  value={location || ''}
                  className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-sky-600 focus:border-sky-600 sm:text-sm transition-all ease-in-out"
                >
                  {!location ? <option value="">Изберете локация</option> : null}
                  {business.locations.map((location: any) => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <span className="text-sm text-red-600">{errors.location}</span>
                )}
              </div>

              {/* Employee Selector */}
              <div className="sm:col-span-3 mt-4">
                <label
                  htmlFor="employee"
                  className="block text-lg font-medium text-gray-700"
                >
                  Бръснар
                </label>
                <select
                  id="employee"
                  onChange={(e) => {
                    const selectedEmployee = e.target.value;
                    setEmployee(selectedEmployee);
                    setService(null);
                    const employeeLocation = business.locations.find((loc: any) =>
                      loc.employees.includes(selectedEmployee)
                    )?._id;
                    setLocation(employeeLocation);
                    setErrors({ ...errors, employee: null, service: null, location: null });
                    triggerValueReset(0);
                  }}
                  value={employee || ''}
                  className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-sky-600 focus:border-sky-600 sm:text-sm transition-all ease-in-out"
                >
                  {!employee ? <option value="">Изберете бръснар</option> : null}
                  {location
                    ? business.locations
                  .find((loc: any) => loc._id === location)
                  ?.employees.map((employeeId: any) => {
                    const employee = business.employees.find(
                      (emp: any) => emp._id === employeeId
                    );
                    return (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    );
                  })
                    : business.employees.map((employee: any) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                      ))}
                </select>
                {errors.employee && (
                  <span className="text-sm text-red-600">{errors.employee}</span>
                )}
              </div>

              {/* Service Selector */}
              <div className="sm:col-span-3 mt-4">
              <label
                htmlFor="service"
                className="block text-lg font-medium text-gray-700"
              >
                Услуга
              </label>
              <select
                id="service"
                onChange={(e) => {
                  const selectedService = e.target.value;
                  setService(selectedService);
                  if (!selectedService) {
                    setLocation(null);
                    setEmployee(null);
                  } else {
                    if(!location || !employee) {
                      const barberWithService = business.employees.find((emp: any) =>
                        emp.services.includes(selectedService)
                        );
                        if (barberWithService) {
                          setEmployee(barberWithService._id);
                          const employeeLocation = business.locations.find((loc: any) =>
                            loc.employees.includes(barberWithService._id)
                          )?._id;
                          setLocation(employeeLocation);
                        }
                    } 
                  }
                  setErrors({ ...errors, service: null, employee: null, location: null });
                  triggerValueReset(0);
                }}
                value={service || ''}
                className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:ring-2 focus:ring-sky-600 focus:border-sky-600 sm:text-sm transition-all ease-in-out"
                >
                {!service ? <option value="">Изберете услуга</option> : null}
                {employee
                ? business.employees
                  .find((emp: any) => emp._id === employee)
                  ?.services.map((serviceId: any) => {
                    const service = business.services.find(
                    (srv: any) => srv._id === serviceId
                    );
                    return (
                    <option key={service._id} value={service._id}>
                      {service.name} - {service.price}{service.currency} ({service.priceEur.toString()} лв.)
                    </option>
                    );
                  })
                : business.services.map((service: any) => (
                  <option key={service._id} value={service._id}>
                    {service.name} - {service.price}{service.currency} ({service.priceEur.toString()} лв.)
                  </option>
                  ))}
              </select>
              {errors.service && (
                <span className="text-sm text-red-600">{errors.service}</span>
              )}
              </div>
          </motion.div>
        )}

        {/* Step 2 */}
        {currentStep === 1 && (
          <motion.div
            initial={{ x: delta >= 0 ? '50%' : '-50%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {
              notices && notices.length > 0
              ? <div className='mb-6'>
                  <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm'>
                    <div className='flex items-start space-x-3'>
                      <div className='flex-shrink-0'>
                        <svg className='h-5 w-5 text-amber-600' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                        </svg>
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-sm font-medium text-amber-800 mb-1'>Важна информация</h3>
                        <p className='text-sm text-amber-700 leading-relaxed'>{notices[0].message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              : null
            }
            {
              timeSlots && timeSlots.length > 0
              ? <div className='mt-10'>
                  <div className='w-full flex justify-center'>
                  <Calendar
                    timeSlots={timeSlots}
                    selected={startDate}
                    setSelected={setStartDate}
                    business={params.business}
                    setStartDt={setStartDt}
                    setEndDt={setEndDt} />
                    </div>
                    {
                      startDate
                      ? 
                      <div className='mt-6 grid grid-cols-2 gap-4'>
                          {timeSlots.filter((slot: any) => new Date(slot.start).toISOString().startsWith(new Date(startDate).toISOString().split('T')[0])).map((slot: any) => (
                            <button
                              key={slot.start + slot.end + Math.random().toString()}
                              onClick={() => {                          
                                setStartDt(slot.start);
                                setEndDt(slot.end);
                              }}
                              className={`rounded bg-zinc-100 py-2 border shadow-lg ${slot.start == startDt ? 'border-cyan-500 border-2 text-black font-bold' : 'text-zinc-800 border-zinc-300'}`}
                            >
                              {moment(slot.start).format('HH:mm')}
                            </button>
                          ))}
                        </div>
                      : null
                    }
                </div>
              : <div className="flex flex-row space-x-2 items-center mt-4">
                  <p className='text-zinc-800'>Няма намерени свободни часове за записване</p>
              </div>
            }
          </motion.div>
        )}

        {/* Step 3 */}
        {currentStep === 2 && (
          <motion.div
            initial={{ x: delta >= 0 ? '50%' : '-50%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className='mt-10'>
              <div className='sm:grid sm:grid-cols-2 sm:gap-x-6'>
                <div className='sm:col-span-1 mt-4'>
                  <label
                    htmlFor='name'
                    className="block text-lg font-medium text-gray-700"
                    >
                    Име
                  </label>
                  <input
                    type='text'
                    id='name'
                    value={name}
                    onChange={(e) => {setName(e.target.value); setErrors({ ...errors, name: null })}}
                    className="block w-full rounded border-zinc-300 bg-zinc-100 border px-2 py-1.5 text-zinc-900 shadow-sm focus:ring-sky-600 sm:text-sm"
                  />
                  {errors.name && (
                    <span className='text-sm text-red-600'>{errors.name}</span>
                  )}
                </div>
                <div className='sm:col-span-1 mt-4'>
                  <label
                    htmlFor='phone'
                    className="block text-lg font-medium text-gray-700"
                  >
                    Телефон
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    value={phone}
                    onChange={(e) => {setPhone(e.target.value); setErrors({ ...errors, phone: null })}}
                    className="block w-full rounded border-zinc-300 bg-zinc-100 border px-2 py-1.5 text-zinc-900 shadow-sm focus:ring-sky-600 md:text-md"
                  />
                  {errors.phone && (
                    <span className='text-sm text-red-600'>{errors.phone}</span>
                  )}
                </div>
                <div className='sm:col-span-1 mt-4'>
                  <label
                    htmlFor='email'
                    className="block text-lg font-medium text-gray-700"
                  >
                    Имейл
                  </label>
                  <input
                    type='email'
                    id='email'
                    value={email}
                    onChange={(e) => {setEmail(e.target.value); setErrors({ ...errors, email: null })}}
                    className="block w-full rounded border-zinc-300 bg-zinc-100 border px-2 py-1.5 text-zinc-900 shadow-sm focus:ring-sky-600 md:text-md"
                  />
                  {errors.email && (
                    <span className='text-sm text-red-600'>{errors.email}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4 */}
        {currentStep === 3 && (
          <motion.div
            initial={{ x: delta >= 0 ? '50%' : '-50%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className='mt-10'>
              <p>
                <strong>Локация:</strong> {business.locations.find((loc: any) => loc._id === location)?.name}
              </p>
              <p>
                <strong>Бръснар:</strong> {business.employees.find((emp: any) => emp._id === employee)?.name}
              </p>
              <p>
                <strong>Услуга:</strong> {business.services.find((srv: any) => srv._id === service)?.name}
              </p>
              <br/>
              <hr/>
              <br/>
              <p>
                <strong>Дата:</strong> {moment(startDt)
        .tz(moment.tz.guess())
        .format("DD/MM/YYYY")}
              </p>
              <p>
                <strong>Час:</strong> {moment(startDt)
        .tz(moment.tz.guess())
        .format("HH:mm")}
              </p>
              <p>
                <strong>Цена:</strong> {business.services.find((srv: any) => srv._id === service)?.price}{business.services.find((srv: any) => srv._id === service)?.currency} ({business.services.find((srv: any) => srv._id === service)?.priceEur.toString()} лв.)
              </p>
              <br/>
              <hr/>
              <br/>
              <p>
                <strong>Име:</strong> {name}
              </p>
              <p>
                <strong>Телефон:</strong> {phone}
              </p>
              <p>
                <strong>Имейл:</strong> {email}
              </p>
              {/*<p>
                <strong>Бележка:</strong> {watch('note')}
              </p>*/}
            </div>
          </motion.div>
        )}

        {/* Navigation buttons */}
        <div className='mt-6 justify-between'>
          {
            currentStep == steps.length - 1
            ? <p className='text-zinc-700 text-xs'>При записване на час се съгласявате с нашата <a href={`${business.privacyPolicyURL}`} target='_blank' className='text-blue-500'>Политика за поверителност</a></p>
            : null
          }
          {
            currentStep == 1 && (!startDt || !endDt)
            ? null
            : <button
                type='button'
                className='rounded w-full mt-6 bg-black py-3 px-4 text-md font-semibold text-white'
                onClick={next}
              >
                {currentStep === steps.length - 1 ? 'Потвърди и запиши час' : 'Напред'}
              </button>
          }
        </div>
      </form>
    </section>
    </>
  )
}
