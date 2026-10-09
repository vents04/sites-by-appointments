const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require("moment-timezone");
const INTEGRATIONS = require("../enums/integrations.enum");

const servicePostValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        price: Joi.number().min(0).required(),
        currency: Joi.string().length(3).required(),
        timeSlots: Joi.number().min(1).max(24).required(),
        businessId: Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).required(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
}

const servicePutValidation = (data) => {
    const schema = Joi.object({
        price: Joi.number().min(0).required(),
        timeSlots: Joi.number().min(1).max(24).required(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
}

const employeePostValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        teamupSubcalendarId: Joi.string().required(),
        services: Joi.array().items(Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })).required(),
        businessId: Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).required(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
}

const employeePutValidation = (data) => {
    const schema = Joi.object({
        teamupSubcalendarId: Joi.string().required(),
        services: Joi.array().items(Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })).required(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
}

const locationPostValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        addressName: Joi.string().min(3).max(100).required(),
        lat: Joi.number().min(-90).max(90).required(),
        lon: Joi.number().min(-180).max(180).required(),
        workingHours: Joi.array().items(workingHoursSchema).required(),
        businessId: Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).required(),
        employees: Joi.array().items(Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })),
        phone: Joi.string().required(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
}

const locationPutValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        employees: Joi.array().items(Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
}

const eventPostValidation = (data) => {
    const schema = Joi.object({
        calendarId: Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).required(),
        employeeId: Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).required(),
        timezone: timezoneValidation,
        // iso strings
        startDt: Joi.date().required(),
        endDt: Joi.date().required(),
        serviceId: Joi.string().custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        }).required(),
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().pattern(new RegExp('[A-Za-z0-9\\._%+\\-]+@[A-Za-z0-9\\.-]+\\.[A-Za-z]{2,}')).required(),
        phone: Joi.string().required(),
    });

    return schema.validate(data);
};

const timeValidation = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);

const workingHoursSchema = Joi.object({
    day: Joi.string()
        .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        .required(),
    open: timeValidation.required(),
    close: timeValidation.required(),
}).custom((value, helpers) => {
    if (!value.isClosed) {
        const [openHour, openMinute] = value.open.split(':').map(Number);
        const [closeHour, closeMinute] = value.close.split(':').map(Number);

        if (openHour > closeHour || (openHour === closeHour && openMinute >= closeMinute)) {
            return helpers.error('any.invalid', { message: 'Close time must be later than open time.' });
        }
    }
    return value;
}, 'Open and Close Time Validation');

const businessPostValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).optional(),
        logo: Joi.string().uri().optional(),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
        email: Joi.string().email().optional(),
        website: Joi.string().uri().optional(),
        socialMedia: Joi.object({
            facebook: Joi.string().uri().optional(),
            twitter: Joi.string().uri().optional(),
            instagram: Joi.string().uri().optional(),
            linkedin: Joi.string().uri().optional(),
            tiktok: Joi.string().uri().optional(),
        }).optional(),
        URLpostfix: Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).required(),
        slotTime: Joi.number().min(1).max(1440).required(),
        maximumDaysInFuture: Joi.number().min(1).max(60).required(),
        minimumTimeSlotsInFuture: Joi.number().min(1).max(1440).required(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required(),
        isEmailSender: Joi.boolean().required(),
        senderEmail: Joi.string().email().when('isEmailSender', { is: true, then: Joi.required() }),
        senderPassword: Joi.string().when('isEmailSender', { is: true, then: Joi.required() }),
    });

    return schema.validate(data);
};

const businessPutValidation = (data) => {
    const schema = Joi.object({
        description: Joi.string().max(500).optional(),
        logo: Joi.string().uri().optional(),
        phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
        email: Joi.string().email().optional(),
        website: Joi.string().uri().optional(),
        workingHours: Joi.array().items(workingHoursSchema).optional(),
        slotTime: Joi.number().min(1).max(1440).optional(),
        maximumDaysInFuture: Joi.number().min(1).max(60).optional(),
        minimumTimeSlotsInFuture: Joi.number().min(1).max(1440).optional(),
        status: Joi.string().valid('active', 'inactive', 'deleted').optional(),
    });

    return schema.validate(data);
};

const objectIdValidation = Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid', { message: 'Invalid ObjectId' });
    }
    return value;
});

const timezoneValidation = Joi.string().valid(...moment.tz.names());

const teamupApiKeyValidation = Joi.string().when('integration', {
    is: INTEGRATIONS.TEAMUP,
    then: Joi.required(),
    otherwise: Joi.optional()
});

const calendarPostValidation = (data) => {
    const schema = Joi.object({
        businessId: objectIdValidation.required(),
        integration: Joi.string().valid(...Object.values(INTEGRATIONS)).required(),
        teamupSecretCalendarKey: Joi.string().when('integration', {
            is: INTEGRATIONS.TEAMUP,
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        teamupApiKey: teamupApiKeyValidation,
        status: Joi.string().valid('active', 'deleted').required()
    });

    return schema.validate(data);
};

const calendarPutValidation = (data) => {
    const schema = Joi.object({
        status: Joi.string().valid('active', 'deleted').optional()
    });

    return schema.validate(data);
};

const upsellPostValidation = (data) => {
    const schema = Joi.object({
        businessId: objectIdValidation.required(),
        serviceId: objectIdValidation.required(),
        employeeId: objectIdValidation.required(),
        triggerServiceIds: Joi.array().items(objectIdValidation).min(1).required(),
        title: Joi.string().max(200).optional(),
        description: Joi.string().max(1000).optional(),
        status: Joi.string().valid('active', 'inactive', 'deleted').required()
    });

    return schema.validate(data);
};

const upsellPutValidation = (data) => {
    const schema = Joi.object({
        triggerServiceIds: Joi.array().items(objectIdValidation).min(1).optional(),
        title: Joi.string().max(200).allow('').optional(),
        description: Joi.string().max(1000).allow('').optional(),
        status: Joi.string().valid('active', 'inactive', 'deleted').optional()
    });

    return schema.validate(data);
};

const upsellOfferValidation = (data) => {
    const schema = Joi.object({
        calendarId: objectIdValidation.required(),
        serviceId: objectIdValidation.required(),
        // teamup id of the event that was just booked
        eventId: Joi.string().max(100).required(),
        _cb: Joi.string().optional()
    });

    return schema.validate(data);
};

const upsellBookValidation = (data) => {
    const schema = Joi.object({
        calendarId: objectIdValidation.required(),
        upsellId: objectIdValidation.required(),
        serviceId: objectIdValidation.required(),
        eventId: Joi.string().max(100).required(),
        timezone: timezoneValidation.required(),
        name: Joi.string().min(3).max(100).required(),
        email: Joi.string().pattern(new RegExp('[A-Za-z0-9\\._%+\\-]+@[A-Za-z0-9\\.-]+\\.[A-Za-z]{2,}')).required(),
        phone: Joi.string().required(),
    });

    return schema.validate(data);
};

module.exports = {
    eventPostValidation,
    servicePostValidation,
    servicePutValidation,
    employeePostValidation,
    employeePutValidation,
    locationPostValidation,
    locationPutValidation,
    businessPostValidation,
    businessPutValidation,
    calendarPostValidation,
    calendarPutValidation,
    upsellPostValidation,
    upsellPutValidation,
    upsellOfferValidation,
    upsellBookValidation,
}
