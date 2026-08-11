const express = require('express');
const { HTTP_STATUS_CODES, DATABASE_MODELS, COLLECTIONS } = require('../global');
const { default: mongoose } = require('mongoose');
const router = express.Router();
const moment = require("moment-timezone");
const DbService = require('../services/db.service');
const CalendarService = require('../services/calendar.service');
const ResponseError = require('../errors/responseError');
const { eventPostValidation } = require('../validation/hapi');
const TeamupService = require('../services/teamup.service');
const EmailService = require('../services/email.service');
const PersonalData = require('../db/models/PersonalData.model');

router.post('/', async (req, res, next) => {
    const { error } = eventPostValidation(req.body);
    if(error) return next(new ResponseError(error.details[0].message, HTTP_STATUS_CODES.BAD_REQUEST));

    try {
        const calendar = await DbService.getOne(COLLECTIONS.CALENDARS, { _id: new mongoose.Types.ObjectId(req.body.calendarId) });
        if(!calendar) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(calendar.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(calendar.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));

        const business = await DbService.getById(COLLECTIONS.BUSINESSES, calendar.businessId);
        if(!business) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(business.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(business.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));

        const service = await DbService.getById(COLLECTIONS.SERVICES, req.body.serviceId);
        if(!service) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(service.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));
        if(service.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(service.businessId.toString() !== calendar.businessId.toString()) return next(new ResponseError("errors.invalid_business", HTTP_STATUS_CODES.CONFLICT));

        const employee = await DbService.getById(COLLECTIONS.EMPLOYEES, req.body.employeeId);
        if(!employee) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(employee.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));
        if(employee.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(employee.businessId.toString() !== calendar.businessId.toString()) return next(new ResponseError("errors.invalid_business", HTTP_STATUS_CODES.CONFLICT));

        if(!employee.services.map((_id) => {return _id.toString()}).includes(service._id.toString())) return next(new ResponseError("errors.invalid_service", HTTP_STATUS_CODES.CONFLICT));

        // compare the duration in minutes of service.timeSlots with the difference between startDt and endDt. keep in mind that business.slotTime is the minutes duration for one slot
        const serviceDuration = service.timeSlots * business.slotTime;
        const startDt = new Date(req.body.startDt);
        const endDt = new Date(req.body.endDt);
        const duration = (endDt.getTime() - startDt.getTime()) / 60000;
        if(duration !== serviceDuration) return next(new ResponseError("errors.invalid_duration", HTTP_STATUS_CODES.CONFLICT));


        const isTimeSlotAvailableAndValid = await CalendarService.checkTimeSlotValidityAndAvailability(calendar._id, req.body.startDt, req.body.endDt, employee.teamupSubCalendarId);
        if(!isTimeSlotAvailableAndValid) return next(new ResponseError("errors.invalid_time_slot_or_unavailable", HTTP_STATUS_CODES.CONFLICT));

        req.body.startDt = moment(req.body.startDt).tz(req.body.timezone).format("YYYY-MM-DDTHH:mm:ssZ"); 
        req.body.endDt = moment(req.body.endDt).tz(req.body.timezone).format("YYYY-MM-DDTHH:mm:ssZ");

        const newEvent = {
            calendarId: calendar._id,
            teamupSubCalendarIds: [employee.teamupSubCalendarId],
            start: req.body.startDt,
            end: req.body.endDt,
            allDay: false,
        };
        
        // teamup service create event
        const teamupEvent = await TeamupService.createEvent(
            calendar.teamupSecretCalendarKey, 
            calendar.teamupApiKey, 
            [employee.teamupSubCalendarId],
            `${req.body.name} - ${service.name}`,
            `<p><b>Имейл:</b> ${req.body.email}</p><p><b>Телефонен номер:</b> ${req.body.phone}</p>`,
            req.body.startDt,
            req.body.endDt,
        );
        if(!teamupEvent) return next(new ResponseError("errors.teamup_event_creation_failed", HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));

        // create event in db
        newEvent.teamupEventId = teamupEvent.id;
        await DbService.create(COLLECTIONS.EVENTS, newEvent);

        res.status(HTTP_STATUS_CODES.CREATED).send(newEvent);

        // send email to customer
        const customerEmail = req.body.email;
        const emailSubject = `Вашият час за ${service.name} е потвърден`;
        const emailMessage = `
            Здравейте ${req.body.name},<br/>
            това са детайлите за вашия час:<br/>
            - Услуга: ${service.name}<br/>
            - Служител: ${employee.name}<br/>
            - Цена: ${service.price}${service.currency}<br/>
            - Дата: ${moment(startDt).tz(req.body.timezone).format("YYYY-MM-DD")}<br/>
            - Час: ${moment(startDt).tz(req.body.timezone).format("HH:mm")}<br/>
            - Продължителност: ${duration} ${duration == 1 ? 'минута': 'минути'}<br/>
        `;

        const location = await DbService.getOne(COLLECTIONS.LOCATIONS, {employees: {"$in": [new mongoose.Types.ObjectId(employee._id), employee._id]}})
        if(location && location.phone) business.phone = location.phone
        await EmailService.sendEmail(business, customerEmail, emailSubject, emailMessage);

        const personalData = new PersonalData({
            email: req.body.email,
            phone: req.body.phone,
            name: req.body.name
        });

        await DbService.create(COLLECTIONS.PERSONAL_DATA, personalData);

        return;
    } catch(err) {
        return next(new ResponseError("errors.internal_server_error", HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

router.get('/available', async (req, res, next) => {
    try {
        const calendarId = new mongoose.Types.ObjectId(req.query.calendarId);
        const employeeId = new mongoose.Types.ObjectId(req.query.employeeId);
        const serviceId = new mongoose.Types.ObjectId(req.query.serviceId);
        if(!calendarId) return next(new ResponseError("errors.invalid_id", HTTP_STATUS_CODES.BAD_REQUEST));
        if(!employeeId) return next(new ResponseError("errors.invalid_id", HTTP_STATUS_CODES.BAD_REQUEST));
        if(!serviceId) return next(new ResponseError("errors.invalid_id", HTTP_STATUS_CODES.BAD_REQUEST));

        const calendar = await DbService.getById(COLLECTIONS.CALENDARS, calendarId);
        if(!calendar) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(calendar.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(calendar.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));

        const business = await DbService.getById(COLLECTIONS.BUSINESSES, calendar.businessId);
        if(!business) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(business.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(business.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));

        const service = await DbService.getById(COLLECTIONS.SERVICES, serviceId);
        if(!service) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(service.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));
        if(service.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(service.businessId.toString() !== calendar.businessId.toString()) return next(new ResponseError("errors.invalid_business", HTTP_STATUS_CODES.CONFLICT));

        const employee = await DbService.getById(COLLECTIONS.EMPLOYEES, employeeId);
        if(!employee) return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(employee.status !== 'active') return next(new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT));
        if(employee.status === 'deleted') return next(new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND));
        if(employee.businessId.toString() !== calendar.businessId.toString()) return next(new ResponseError("errors.invalid_business", HTTP_STATUS_CODES.CONFLICT));

        if(!employee.services.map(serviceId => serviceId.toString()).includes(service._id.toString())) return next(new ResponseError("errors.invalid_service", HTTP_STATUS_CODES.CONFLICT));

        const serviceDuration = service.timeSlots * business.slotTime;
        const availableTimeSlots = await CalendarService.getAvailableTimeSlotsForService(business._id, serviceDuration, employee.teamupSubCalendarId);
        
        return res.status(HTTP_STATUS_CODES.OK).send(availableTimeSlots ?? []);
    } catch(err) {
        return next(new ResponseError("errors.internal_server_error", HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

module.exports = router;