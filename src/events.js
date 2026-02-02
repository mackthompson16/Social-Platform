const parseLocalDateString = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
};

const createSegments = (date, startTime, endTime, base) => {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const start = new Date(date);
    start.setHours(sH, sM, 0, 0);

    const endSameDay = new Date(date);
    endSameDay.setHours(eH, eM, 0, 0);

    if (endSameDay > start) {
        return [
            {
                ...base,
                start,
                end: endSameDay,
            },
        ];
    }

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayEnd = new Date(nextDay);
    nextDayEnd.setHours(eH, eM, 0, 0);

    return [
        { ...base, start, end: endOfDay },
        { ...base, start: new Date(nextDay.setHours(0, 0, 0, 0)), end: nextDayEnd },
    ];
};

export default function generateEvents(events) {
    const calendarEvents = [];
    events.forEach((eventItem) => {
        const userId = eventItem.user_id || eventItem.ownerId || eventItem.userId;
        const startTime = eventItem.startTime || eventItem.start_time;
        const endTime = eventItem.endTime || eventItem.end_time;
        const dateValue = eventItem.date || eventItem.event_date;

        if (!startTime || !endTime || !dateValue) {
            console.warn('Skipping event without date/time fields', eventItem);
            return;
        }

        const startDate = parseLocalDateString(dateValue);
        if (!startDate || isNaN(startDate.getTime())) {
            console.error('Invalid date for event', eventItem);
            return;
        }

        const segments = createSegments(startDate, startTime, endTime, {
            eventId: eventItem.eventId || eventItem.event_id,
            id: `${eventItem.eventId || eventItem.event_id}`,
            title: eventItem.name,
            userId,
            ownerId: eventItem.ownerId || eventItem.owner_id,
            memberCount: eventItem.memberCount,
            eventStatus: eventItem.eventStatus,
            memberStatus: eventItem.memberStatus,
        });

        segments.forEach((segment, idx) =>
            calendarEvents.push({ ...segment, id: `${segment.id}-p${idx}` })
        );
    });
    return calendarEvents;
}
