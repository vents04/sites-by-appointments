const mongoose = require("mongoose");
const { DATABASE_MODELS } = require("../../global");

// An upsell offers an extra service (e.g. a facial massage) right after a booking of one of the trigger services.
// It is only offered when the upsell employee is free directly after the booked appointment ends.
const upsellSchema = mongoose.Schema({
    businessId: {
        type: mongoose.Types.ObjectId,
        ref: DATABASE_MODELS.BUSINESS,
        required: true
    },
    // the service that is offered
    serviceId: {
        type: mongoose.Types.ObjectId,
        ref: DATABASE_MODELS.SERVICE,
        required: true
    },
    // the employee who performs the offered service
    employeeId: {
        type: mongoose.Types.ObjectId,
        ref: DATABASE_MODELS.EMPLOYEE,
        required: true
    },
    // bookings of these services trigger the offer
    triggerServiceIds: [{
        type: mongoose.Types.ObjectId,
        ref: DATABASE_MODELS.SERVICE
    }],
    // customer facing copy, optional
    title: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["active", "inactive", "deleted"],
        required: true
    }
});

const Upsell = mongoose.model(DATABASE_MODELS.UPSELL, upsellSchema);
module.exports = { Upsell };
