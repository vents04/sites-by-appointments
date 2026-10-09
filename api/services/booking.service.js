const { default: mongoose } = require('mongoose');
const moment = require("moment-timezone");
const { COLLECTIONS } = require('../global');
const DbService = require('./db.service');
const TeamupService = require('./teamup.service');
const EmailService = require('./email.service');
const PersonalData = require('../db/models/PersonalData.model');

const BookingService = {
    // creates the event in teamup and in the db, returns the db event or null when teamup fails
    createEvent: async (calendar, service, employee, customer, startDt, endDt) => {
        startDt = moment(startDt).tz(customer.timezone).format("YYYY-MM-DDTHH:mm:ssZ");
        endDt = moment(endDt).tz(customer.timezone).format("YYYY-MM-DDTHH:mm:ssZ");

        const newEvent = {
            calendarId: calendar._id,
            teamupSubCalendarIds: [employee.teamupSubCalendarId],
            start: startDt,
            end: endDt,
            allDay: false,
        };

        const teamupEvent = await TeamupService.createEvent(
            calendar.teamupSecretCalendarKey,
            calendar.teamupApiKey,
            [employee.teamupSubCalendarId],
            `${customer.name} - ${service.name}`,
            `<p><b>Имейл:</b> ${customer.email}</p><p><b>Телефонен номер:</b> ${customer.phone}</p>`,
            startDt,
            endDt,
        );
        if(!teamupEvent) return null;

        newEvent.teamupEventId = teamupEvent.id;
        await DbService.create(COLLECTIONS.EVENTS, newEvent);

        return newEvent;
    },
    // sends the confirmation email and stores the personal data
    notifyCustomer: async (business, service, employee, customer, startDt, endDt) => {
        const duration = (new Date(endDt).getTime() - new Date(startDt).getTime()) / 60000;

        const emailSubject = `Вашият час за ${service.name} е потвърден`;
        const emailMessage = `
            Здравейте ${customer.name},<br/>
            това са детайлите за вашия час:<br/>
            - Услуга: ${service.name}<br/>
            - Служител: ${employee.name}<br/>
            - Цена: ${service.price}${service.currency}<br/>
            - Дата: ${moment(startDt).tz(customer.timezone).format("YYYY-MM-DD")}<br/>
            - Час: ${moment(startDt).tz(customer.timezone).format("HH:mm")}<br/>
            - Продължителност: ${duration} ${duration == 1 ? 'минута': 'минути'}<br/>
        `;

        const location = await DbService.getOne(COLLECTIONS.LOCATIONS, {employees: {"$in": [new mongoose.Types.ObjectId(employee._id), employee._id]}})
        if(location && location.phone) business.phone = location.phone
        await EmailService.sendEmail(business, customer.email, emailSubject, emailMessage);

        const personalData = new PersonalData({
            email: customer.email,
            phone: customer.phone,
            name: customer.name
        });

        await DbService.create(COLLECTIONS.PERSONAL_DATA, personalData);
    }
};

module.exports = BookingService;
