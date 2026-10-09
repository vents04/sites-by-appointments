const { default: mongoose } = require('mongoose');
const moment = require("moment-timezone");
const { COLLECTIONS } = require('../global');
const DbService = require('./db.service');
const CalendarService = require('./calendar.service');

const idsInclude = (ids, id) => (ids || []).map((_id) => _id.toString()).includes(id.toString());

const UpsellService = {
    // returns the first active upsell that can be booked directly after the given event, or null
    // the event has to be a booking of one of the upsell's trigger services, the upsell employee has to work
    // at the same location as the booked employee and has to be free for the whole upsell service right after the event
    findOffer: async (calendar, serviceId, teamupEventId) => {
        try {
            const business = await DbService.getById(COLLECTIONS.BUSINESSES, calendar.businessId);
            if(!business || business.status !== 'active') return null;

            const event = await DbService.getOne(COLLECTIONS.EVENTS, { calendarId: new mongoose.Types.ObjectId(calendar._id), teamupEventId: String(teamupEventId) });
            if(!event || event.allDay) return null;

            const upsells = await DbService.getMany(COLLECTIONS.UPSELLS, {
                businessId: new mongoose.Types.ObjectId(business._id),
                status: 'active',
                triggerServiceIds: { '$in': [new mongoose.Types.ObjectId(serviceId)] }
            });
            if(upsells.length === 0) return null;

            const employees = await DbService.getMany(COLLECTIONS.EMPLOYEES, { businessId: new mongoose.Types.ObjectId(business._id), status: 'active' });
            const bookedEmployee = employees.find((employee) => (event.teamupSubCalendarIds || []).map(String).includes(String(employee.teamupSubCalendarId)));
            if(!bookedEmployee || !idsInclude(bookedEmployee.services, serviceId)) return null;

            const bookedLocation = await DbService.getOne(COLLECTIONS.LOCATIONS, { status: 'active', employees: { '$in': [bookedEmployee._id, new mongoose.Types.ObjectId(bookedEmployee._id)] } });
            if(!bookedLocation) return null;

            for(const upsell of upsells) {
                const service = await DbService.getById(COLLECTIONS.SERVICES, upsell.serviceId);
                if(!service || service.status !== 'active') continue;

                const employee = employees.find((emp) => emp._id.toString() === upsell.employeeId.toString());
                if(!employee || !idsInclude(employee.services, service._id)) continue;
                if(!idsInclude(bookedLocation.employees, employee._id)) continue;

                const startDt = moment(event.end).seconds(0).milliseconds(0);
                const endDt = startDt.clone().add(service.timeSlots * business.slotTime, 'minutes');

                const isAvailable = await CalendarService.isEmployeeAvailable(business._id, employee, startDt.toISOString(), endDt.toISOString());
                if(!isAvailable) continue;

                return {
                    upsell: { _id: upsell._id, title: upsell.title, description: upsell.description },
                    service: { _id: service._id, name: service.name, price: service.price, currency: service.currency, timeSlots: service.timeSlots },
                    employee: { _id: employee._id, name: employee.name },
                    startDt: startDt.toISOString(),
                    endDt: endDt.toISOString(),
                    // internal, not sent to the client
                    _business: business,
                    _service: service,
                    _employee: employee
                };
            }

            return null;
        } catch (error) {
            console.error(error);
            return null;
        }
    },
    toPublicOffer: (offer) => {
        if(!offer) return null;
        const { _business, _service, _employee, ...publicOffer } = offer;
        return publicOffer;
    }
};

module.exports = UpsellService;
