const express = require('express');
const { default: mongoose } = require('mongoose');
const router = express.Router();

const { HTTP_STATUS_CODES, COLLECTIONS, DEFAULT_ERROR_MESSAGE } = require('../global');
const DbService = require('../services/db.service');
const UpsellService = require('../services/upsell.service');
const BookingService = require('../services/booking.service');
const ResponseError = require('../errors/responseError');
const adminAuthenticate = require('../middlewares/adminAuthenticate');
const { Upsell } = require('../db/models/Upsell.model');
const { upsellPostValidation, upsellPutValidation, upsellOfferValidation, upsellBookValidation } = require('../validation/hapi');

const getActiveCalendar = async (calendarId) => {
    const calendar = await DbService.getById(COLLECTIONS.CALENDARS, calendarId);
    if(!calendar || calendar.status === 'deleted') throw new ResponseError("errors.not_found", HTTP_STATUS_CODES.NOT_FOUND);
    if(calendar.status !== 'active') throw new ResponseError("errors.inactive", HTTP_STATUS_CODES.CONFLICT);
    return calendar;
};

// offer for an event that was just booked; responds with { offer: null } when there is nothing to offer
router.get('/offer', async (req, res, next) => {
    const { error } = upsellOfferValidation(req.query);
    if(error) return next(new ResponseError(error.details[0].message, HTTP_STATUS_CODES.BAD_REQUEST));

    try {
        const calendar = await getActiveCalendar(req.query.calendarId);
        const offer = await UpsellService.findOffer(calendar, req.query.serviceId, req.query.eventId);

        return res.status(HTTP_STATUS_CODES.OK).send({ offer: UpsellService.toPublicOffer(offer) });
    } catch(err) {
        if(err instanceof ResponseError) return next(err);
        return next(new ResponseError("errors.internal_server_error", HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

// books the upsell service directly after the given event
router.post('/book', async (req, res, next) => {
    const { error } = upsellBookValidation(req.body);
    if(error) return next(new ResponseError(error.details[0].message, HTTP_STATUS_CODES.BAD_REQUEST));

    try {
        const calendar = await getActiveCalendar(req.body.calendarId);

        // the offer is recalculated, so the upsell is only booked if the employee is still free
        const offer = await UpsellService.findOffer(calendar, req.body.serviceId, req.body.eventId);
        if(!offer || offer.upsell._id.toString() !== req.body.upsellId) return next(new ResponseError("errors.invalid_time_slot_or_unavailable", HTTP_STATUS_CODES.CONFLICT));

        const customer = { name: req.body.name, email: req.body.email, phone: req.body.phone, timezone: req.body.timezone };

        const newEvent = await BookingService.createEvent(calendar, offer._service, offer._employee, customer, offer.startDt, offer.endDt);
        if(!newEvent) return next(new ResponseError("errors.teamup_event_creation_failed", HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));

        res.status(HTTP_STATUS_CODES.CREATED).send(newEvent);

        await BookingService.notifyCustomer(offer._business, offer._service, offer._employee, customer, new Date(offer.startDt), new Date(offer.endDt));

        return;
    } catch(err) {
        if(err instanceof ResponseError) return next(err);
        return next(new ResponseError("errors.internal_server_error", HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

router.get('/business/:businessId', adminAuthenticate, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.businessId))
        return next(new ResponseError('errors.invalid_id', HTTP_STATUS_CODES.BAD_REQUEST));

    try {
        const upsells = await DbService.getMany(COLLECTIONS.UPSELLS, { businessId: new mongoose.Types.ObjectId(req.params.businessId), status: { '$ne': 'deleted' } });
        return res.status(HTTP_STATUS_CODES.OK).send(upsells);
    } catch(err) {
        return next(new ResponseError(err.message || DEFAULT_ERROR_MESSAGE, HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

router.post('/', adminAuthenticate, async (req, res, next) => {
    const { error } = upsellPostValidation(req.body);
    if(error) return next(new ResponseError(error.details[0].message, HTTP_STATUS_CODES.BAD_REQUEST));

    try {
        const business = await DbService.getById(COLLECTIONS.BUSINESSES, req.body.businessId);
        if(!business || business.status === 'deleted') return next(new ResponseError('Business not found', HTTP_STATUS_CODES.NOT_FOUND));

        const service = await DbService.getById(COLLECTIONS.SERVICES, req.body.serviceId);
        if(!service || service.businessId.toString() !== business._id.toString()) return next(new ResponseError('Service not found', HTTP_STATUS_CODES.NOT_FOUND));

        const employee = await DbService.getById(COLLECTIONS.EMPLOYEES, req.body.employeeId);
        if(!employee || employee.businessId.toString() !== business._id.toString()) return next(new ResponseError('Employee not found', HTTP_STATUS_CODES.NOT_FOUND));
        if(!employee.services.map(String).includes(service._id.toString())) return next(new ResponseError('Employee does not offer the service', HTTP_STATUS_CODES.CONFLICT));

        const upsell = new Upsell(req.body);
        await DbService.create(COLLECTIONS.UPSELLS, upsell);

        return res.status(HTTP_STATUS_CODES.CREATED).send(upsell);
    } catch(err) {
        return next(new ResponseError(err.message || DEFAULT_ERROR_MESSAGE, HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

// can change triggerServiceIds, title, description, status
router.put('/:id', adminAuthenticate, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
        return next(new ResponseError('errors.invalid_id', HTTP_STATUS_CODES.BAD_REQUEST));

    const { error } = upsellPutValidation(req.body);
    if(error) return next(new ResponseError(error.details[0].message, HTTP_STATUS_CODES.BAD_REQUEST));

    try {
        const upsellId = new mongoose.Types.ObjectId(req.params.id);
        const upsell = await DbService.getById(COLLECTIONS.UPSELLS, upsellId);
        if(!upsell || upsell.status === 'deleted') return next(new ResponseError('Upsell not found', HTTP_STATUS_CODES.NOT_FOUND));

        const update = { ...req.body };
        if(update.triggerServiceIds) update.triggerServiceIds = update.triggerServiceIds.map((id) => new mongoose.Types.ObjectId(id));
        await DbService.update(COLLECTIONS.UPSELLS, { _id: upsellId }, update);

        return res.sendStatus(HTTP_STATUS_CODES.OK);
    } catch(err) {
        return next(new ResponseError(err.message || DEFAULT_ERROR_MESSAGE, HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
    }
});

module.exports = router;
