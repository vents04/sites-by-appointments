const { default: mongoose } = require('mongoose');
const { COLLECTIONS } = require('../global');
const DbService = require('./db.service');
const TeamupService = require('./teamup.service');
const { Event } = require('../db/models/Event.model');
const moment = require('moment-timezone');

const CalendarService = {
    syncAllCalendars: async () => {
        try {
            const calendars = await DbService.getMany(COLLECTIONS.CALENDARS, {});
            for(let calendar of calendars) {
                await DbService.update(COLLECTIONS.CALENDARS, { _id: new mongoose.Types.ObjectId(calendar._id) }, { status: "inactive" });

                let usedIds = [];

                const lastSyncDate = calendar.lastSynchronized 
                    ? new Date(new Date(calendar.lastSynchronized).getTime()).toISOString() 
                    : new Date(Date.now()).toISOString();

                const teamupEvents = await TeamupService.getInitialEvents(calendar.teamupSecretCalendarKey, calendar.teamupApiKey, lastSyncDate);
                if(teamupEvents) {
                    for(let teamupEvent of teamupEvents) {
                        usedIds.push(teamupEvent.id);
                        if(teamupEvent.rrule) {
                            await DbService.deleteMany(COLLECTIONS.EVENTS, { teamupEventId: { $regex: `^${teamupEvent.id}` } });
                        } else {
                            await DbService.deleteMany(COLLECTIONS.EVENTS, { teamupEventId: teamupEvent.id });
                        }
    
                        if(teamupEvent.deleted_dt) continue;
    
                        const newEvent = new Event({
                            calendarId: new mongoose.Types.ObjectId(calendar._id),
                            teamupSubCalendarIds: teamupEvent.subcalendar_ids,
                            allDay: teamupEvent.all_day,
                            rrule: teamupEvent.rrule,
                            teamupEventId: teamupEvent.id,
                            start: moment(teamupEvent.start_dt).seconds(0).milliseconds(0).toISOString(),
                            end: moment(teamupEvent.end_dt).seconds(0).milliseconds(0).toISOString()
                        });
                        await DbService.create(COLLECTIONS.EVENTS, newEvent);
                    }
                } 

                await DbService.deleteMany(COLLECTIONS.EVENTS, {
                    calendarId: new mongoose.Types.ObjectId(calendar._id),
                    teamupEventId: { $nin: usedIds }
                });

                await DbService.update(COLLECTIONS.CALENDARS, { _id: new mongoose.Types.ObjectId(calendar._id) }, { lastSynchronized: new Date().toISOString(), status: "active" });
            }
        } catch (error) {
            console.error(error);
            return null;
        }
    },
    syncCalendar: async (calendarId) => {
        try {
            const calendar = await DbService.getById(COLLECTIONS.CALENDARS, calendarId);
            if(!calendar) return null;
            await DbService.update(COLLECTIONS.CALENDARS, { _id: new mongoose.Types.ObjectId(calendar._id) }, { status: "inactive" });

            let usedIds = [];

            const lastSyncDate = calendar.lastSynchronized 
                ? new Date(new Date(calendar.lastSynchronized).getTime()).toISOString() 
                : new Date(Date.now()).toISOString();

            const teamupEvents = await TeamupService.getInitialEvents(calendar.teamupSecretCalendarKey, calendar.teamupApiKey, lastSyncDate);
            if(teamupEvents) {
                for(let teamupEvent of teamupEvents) {
                    usedIds.push(teamupEvent.id);
                    if(teamupEvent.rrule) {
                        await DbService.deleteMany(COLLECTIONS.EVENTS, { teamupEventId: { $regex: `^${teamupEvent.id}` } });
                    } else {
                        await DbService.deleteMany(COLLECTIONS.EVENTS, { teamupEventId: teamupEvent.id });
                    }

                    if(teamupEvent.deleted_dt) continue;

                    const newEvent = new Event({
                        calendarId: new mongoose.Types.ObjectId(calendar._id),
                        teamupSubCalendarIds: teamupEvent.subcalendar_ids,
                        allDay: teamupEvent.all_day,
                        rrule: teamupEvent.rrule,
                        teamupEventId: teamupEvent.id,
                        start: moment(teamupEvent.start_dt).seconds(0).milliseconds(0).toISOString(),
                        end: moment(teamupEvent.end_dt).seconds(0).milliseconds(0).toISOString()
                    });
                    await DbService.create(COLLECTIONS.EVENTS, newEvent);
                }
            } 

            await DbService.deleteMany(COLLECTIONS.EVENTS, {
                calendarId: new mongoose.Types.ObjectId(calendar._id),
                teamupEventId: { $nin: usedIds }
            });

            await DbService.update(COLLECTIONS.CALENDARS, { _id: new mongoose.Types.ObjectId(calendar._id) }, { lastSynchronized: new Date().toISOString(), status: "active" });
        } catch (error) {
            console.error(error);
            return null;
        }
    },
    getAvailableTimeSlotsForService: async (businessId, timeSlotsDuration, teamupSubCalendarId=undefined) => {
        try {            
            const business = await DbService.getById(COLLECTIONS.BUSINESSES, businessId);
            if(!business) return null;
            const businessMaximumDaysInFuture = business.maximumDaysInFuture;
            const businessMinimumTimeSlots = business.minimumTimeSlotsInFuture;
            const businessSlotTime = business.slotTime;

            const calendar = await DbService.getOne(COLLECTIONS.CALENDARS, { businessId: new mongoose.Types.ObjectId(businessId) });
            if(!calendar) return null;

            const employee = await DbService.getOne(COLLECTIONS.EMPLOYEES,  { '$or': [{teamupSubCalendarId: teamupSubCalendarId}, {teamupSubCalendarId: parseInt(teamupSubCalendarId, 10)}] } );
            if(!employee) return null;

            const location = await DbService.getOne(COLLECTIONS.LOCATIONS, { employees: { '$in': [employee._id, new mongoose.Types.ObjectId(employee._id)]}});
            if(!location) return null;

            const workingHours = location.workingHours;
            if(!workingHours) return null;

            const momentTimezone = calendar.timezone;

            // get events from calendars
            // TODO: events shall be got from now on
            const events = !teamupSubCalendarId
                ? await DbService.getMany(COLLECTIONS.EVENTS, { calendarId: new mongoose.Types.ObjectId(calendar._id) })
                : await DbService.getMany(COLLECTIONS.EVENTS, { calendarId: new mongoose.Types.ObjectId(calendar._id), teamupSubCalendarIds: { '$in': [teamupSubCalendarId, parseInt(teamupSubCalendarId, 10)] } });
            

            // OPTIMIZATION 1: Pre-process events once - convert to timestamps and index by day
            const eventsByDay = {};
            if (events && events.length > 0) {
                for (const event of events) {
                    const eventStart = moment(event.start).tz(momentTimezone).seconds(0).milliseconds(0);
                    const eventEnd = moment(event.end).tz(momentTimezone).seconds(0).milliseconds(0);
                    const startTs = eventStart.valueOf();
                    const endTs = eventEnd.valueOf();
                    
                    // Index event by all days it spans
                    const daysSpanned = Math.ceil(eventEnd.diff(eventStart, 'days', true)) + 1;
                    for (let d = 0; d < daysSpanned; d++) {
                        const dayKey = eventStart.clone().add(d, 'days').format('YYYY-MM-DD');
                        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
                        eventsByDay[dayKey].push({ startTs, endTs });
                    }
                }
            }

            // OPTIMIZATION 2: Create working hours lookup map (supports multiple time ranges per day)
            const workingHoursMap = {};
            for (const wh of workingHours) {
                if (wh.open !== undefined && wh.close !== undefined) {
                    if (!workingHoursMap[wh.day]) {
                        workingHoursMap[wh.day] = [];
                    }
                    workingHoursMap[wh.day].push({
                        openHour: parseInt(wh.open.split(':')[0]),
                        openMinute: parseInt(wh.open.split(':')[1]),
                        closeHour: parseInt(wh.close.split(':')[0]),
                        closeMinute: parseInt(wh.close.split(':')[1])
                    });
                }
            }

            // Sort time ranges for each day chronologically and validate no overlaps
            for (const day in workingHoursMap) {
                workingHoursMap[day].sort((a, b) => {
                    const aMinutes = a.openHour * 60 + a.openMinute;
                    const bMinutes = b.openHour * 60 + b.openMinute;
                    return aMinutes - bMinutes;
                });

                // Validate that time ranges don't overlap
                for (let i = 0; i < workingHoursMap[day].length - 1; i++) {
                    const currentRange = workingHoursMap[day][i];
                    const nextRange = workingHoursMap[day][i + 1];
                    
                    const currentCloseMinutes = currentRange.closeHour * 60 + currentRange.closeMinute;
                    const nextOpenMinutes = nextRange.openHour * 60 + nextRange.openMinute;
                    
                    // Ensure current range closes before or at the same time next range opens
                    if (currentCloseMinutes > nextOpenMinutes) {
                        console.error(`Overlapping working hours detected for ${day}: ${currentRange.openHour}:${currentRange.openMinute}-${currentRange.closeHour}:${currentRange.closeMinute} overlaps with ${nextRange.openHour}:${nextRange.openMinute}-${nextRange.closeHour}:${nextRange.closeMinute}`);
                    }
                }
            }

            const availableTimeSlots = [];
            const today = moment().tz(momentTimezone);
            const minimumTimeAllowedTs = today.clone()
                .add(businessMinimumTimeSlots * businessSlotTime, 'minutes')
                .valueOf();

            // get all available time slots
            // iterate through each day from today to todayPlusMaxDays
            
            for (let i = 0; i < businessMaximumDaysInFuture; i++) {
                const currentDate = today.clone().add(i, 'days').startOf('day');
                const currentDay = currentDate.format('dddd').toLowerCase();
                const dayKey = currentDate.format('YYYY-MM-DD');
            
                // OPTIMIZATION 3: Direct lookup instead of loop
                const dayHoursArray = workingHoursMap[currentDay];
                if (!dayHoursArray || dayHoursArray.length === 0) continue; // Skip if business is not open this day
                
                // OPTIMIZATION 5: Get only events for this specific day
                const dayEvents = eventsByDay[dayKey] || [];

                // Iterate through each time range for the day (e.g., morning and afternoon for lunch break)
                for (const dayHours of dayHoursArray) {
                    // Set business hours for this time range
                    const businessOpenTime = currentDate.clone().set({
                        hour: dayHours.openHour,
                        minute: dayHours.openMinute,
                        second: 0,
                        millisecond: 0
                    });
                    
                    const businessCloseTime = currentDate.clone().set({
                        hour: dayHours.closeHour,
                        minute: dayHours.closeMinute,
                        second: 0,
                        millisecond: 0
                    });
                
                    // OPTIMIZATION 4: Calculate slots to skip directly instead of loop
                    let currentTime = businessOpenTime.clone();
                    if (currentTime.valueOf() < minimumTimeAllowedTs) {
                        const diffMinutes = Math.ceil((minimumTimeAllowedTs - currentTime.valueOf()) / 60000);
                        const slotsToSkip = Math.ceil(diffMinutes / timeSlotsDuration);
                        currentTime.add(slotsToSkip * timeSlotsDuration, 'minutes');
                    }
                    
                    const businessCloseTs = businessCloseTime.valueOf();
                
                    // Generate time slots for the current time range
                    while (currentTime.valueOf() < businessCloseTs) {
                        const endTime = currentTime.clone().add(timeSlotsDuration, 'minutes');
                        const endTimeTs = endTime.valueOf();
                        
                        if (endTimeTs > businessCloseTs) break;
                        
                        const currentTimeTs = currentTime.valueOf();
                
                        // OPTIMIZATION 6: Check only relevant day events with simplified timestamp comparison
                        let isTimeSlotAvailable = true;
                        for (const event of dayEvents) {
                            // Slots are adjacent (touching) if slot_end == event_start OR slot_start == event_end
                            const touching = (endTimeTs === event.startTs) || (currentTimeTs === event.endTs);
                            
                            if (!touching) {
                                // Check for overlap: slot starts before event ends AND slot ends after event starts
                                if (currentTimeTs < event.endTs && endTimeTs > event.startTs) {
                                    isTimeSlotAvailable = false;
                                    break;
                                }
                            }
                        }
                
                        if (isTimeSlotAvailable) {
                            availableTimeSlots.push({
                                start: currentTime.toISOString(),
                                end: endTime.toISOString(),
                            });
                        }
                
                        currentTime.add(timeSlotsDuration, 'minutes');
                    }
                }
            }
            
            return availableTimeSlots;
        } catch (error) {
            console.error(error);
            return null;
        }
    },
    checkTimeSlotValidityAndAvailability: async (calendarId, startDt, endDt, teamupSubCalendarId=null) => {
        try {
            // startDt and endDt are ISO strings

            const calendar = await DbService.getById(COLLECTIONS.CALENDARS, calendarId);
            if(!calendar) return null;

            // get business
            const business = await DbService.getById(COLLECTIONS.BUSINESSES, calendar.businessId);
            if(!business) return null;

            const momentTimezone = calendar.timezone;
            startDt = moment(startDt).tz(momentTimezone).seconds(0).milliseconds(0).toISOString();
            endDt = moment(endDt).tz(momentTimezone).seconds(0).milliseconds(0).toISOString();

            const timeSlotsDuration = moment(endDt).diff(moment(startDt), 'minutes');
            const availableTimeSlots = await CalendarService.getAvailableTimeSlotsForService(calendar.businessId, timeSlotsDuration, teamupSubCalendarId);
            if(!availableTimeSlots || availableTimeSlots.length == 0) return null;

            let isTimeSlotValid = false;
            for(let i = 0; i < availableTimeSlots.length; i++) {
            if(startDt === availableTimeSlots[i].start && endDt === availableTimeSlots[i].end) {
                isTimeSlotValid = true;
                break;
            }
            }

            return isTimeSlotValid;
        } catch (error) {
            console.error(error);
            return null;
        }
    },
    // checks an exact interval (not bound to the service slot grid) against the employee's location working hours and events
    isEmployeeAvailable: async (businessId, employee, startDt, endDt) => {
        try {
            const business = await DbService.getById(COLLECTIONS.BUSINESSES, businessId);
            if(!business) return false;

            const calendar = await DbService.getOne(COLLECTIONS.CALENDARS, { businessId: new mongoose.Types.ObjectId(businessId) });
            if(!calendar) return false;

            const location = await DbService.getOne(COLLECTIONS.LOCATIONS, { employees: { '$in': [employee._id, new mongoose.Types.ObjectId(employee._id)]}});
            if(!location || !location.workingHours) return false;

            const momentTimezone = calendar.timezone;
            const start = moment(startDt).tz(momentTimezone).seconds(0).milliseconds(0);
            const end = moment(endDt).tz(momentTimezone).seconds(0).milliseconds(0);
            const startTs = start.valueOf();
            const endTs = end.valueOf();
            if(endTs <= startTs) return false;

            const now = moment().tz(momentTimezone);
            if(startTs < now.clone().add(business.minimumTimeSlotsInFuture * business.slotTime, 'minutes').valueOf()) return false;
            if(start.isAfter(now.clone().add(business.maximumDaysInFuture, 'days').endOf('day'))) return false;

            // the interval has to fit in one of the working hour ranges of that day
            const day = start.format('dddd').toLowerCase();
            const fitsWorkingHours = location.workingHours.some((wh) => {
                if(wh.day !== day || wh.open === undefined || wh.close === undefined) return false;
                const [openHour, openMinute] = wh.open.split(':').map(Number);
                const [closeHour, closeMinute] = wh.close.split(':').map(Number);
                const openTs = start.clone().set({ hour: openHour, minute: openMinute }).valueOf();
                const closeTs = start.clone().set({ hour: closeHour, minute: closeMinute }).valueOf();
                return startTs >= openTs && endTs <= closeTs;
            });
            if(!fitsWorkingHours) return false;

            const teamupSubCalendarId = employee.teamupSubCalendarId;
            // start/end are stored either as dates (synced events) or as strings (events created by the api), so compare in js
            const events = await DbService.getMany(COLLECTIONS.EVENTS, {
                calendarId: new mongoose.Types.ObjectId(calendar._id),
                teamupSubCalendarIds: { '$in': [teamupSubCalendarId, parseInt(teamupSubCalendarId, 10)] }
            });

            return !events.some((event) => {
                const eventStartTs = moment(event.start).seconds(0).milliseconds(0).valueOf();
                const eventEndTs = moment(event.end).seconds(0).milliseconds(0).valueOf();
                return startTs < eventEndTs && endTs > eventStartTs;
            });
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}

module.exports = CalendarService;