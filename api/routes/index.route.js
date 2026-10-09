const express = require("express");
const router = express.Router();

const eventRoute = require("./event.route");
const businessRoute = require('./business.route');
const calendarRoute = require('./calendar.route');
const employeeRoute = require('./employee.route');
const locationRoute = require('./location.route');
const serviceRoute = require('./service.route');
const webhookRouter = require('./webhook.route');
const noticeRoute = require('./notice.route');
const upsellRoute = require('./upsell.route');

router.use("/event", eventRoute);
router.use("/business", businessRoute);
router.use("/calendar", calendarRoute);
router.use("/employee", employeeRoute);
router.use("/location", locationRoute);
router.use("/service", serviceRoute);
router.use("/webhook", webhookRouter);
router.use("/notice", noticeRoute);
router.use("/upsell", upsellRoute);

module.exports = router;