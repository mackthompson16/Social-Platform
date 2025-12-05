

const createSegments = (date, startTime, endTime, base) => {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const start = new Date(date);
    start.setHours(sH, sM, 0, 0);

    const endSameDay = new Date(date);
    endSameDay.setHours(eH, eM, 0, 0);

    // Normal same-day
    if (endSameDay > start) {
        return [
            {
                ...base,
                start,
                end: endSameDay,
            },
        ];
    }

    // Crosses midnight: split into two segments
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

export default function generateEvents(commitments) {
    const events = [];
    commitments.forEach(commitment => {
        let parsedDates;
        let parsedDays;
        const userId = commitment.user_id || commitment.owner_id || commitment.userId;
        const startTime = commitment.startTime || commitment.starttime || commitment.start_time;
        const endTime = commitment.endTime || commitment.endtime || commitment.end_time;
        
        if (!startTime || !endTime) {
            console.warn('Skipping commitment without time fields', commitment);
            return;
        }
          
        if (typeof commitment.dates === 'string') {
            parsedDates = JSON.parse(commitment.dates);
        } else if (Array.isArray(commitment.dates)) {
            parsedDates = commitment.dates; 
        }
       
        if (typeof commitment.days === 'string') {
            parsedDays = JSON.parse(commitment.days); 
        } else if (Array.isArray(commitment.days)) {
            parsedDays = commitment.days;
        }
        const title = commitment.name;
        const commitment_id = commitment.commitment_id;

        if (Array.isArray(parsedDates) && parsedDates.length > 1) {
            const recurringEvents = generateRecurringEvents({ ...commitment, dates: parsedDates, days: parsedDays, startTime, endTime });
            recurringEvents.forEach(event => events.push(event));
        } else if (typeof parsedDates === 'string' || (Array.isArray(parsedDates) && parsedDates.length === 1)) {
            const singleDate = Array.isArray(parsedDates) ? parsedDates[0] : parsedDates;
            const startDate = new Date(singleDate);

            if (isNaN(startDate.getTime())) {
                console.error(`Invalid date for non-recurring commitment ID: ${commitment.id}`);
                return; // Skip invalid dates
            }

            const segments = createSegments(startDate, startTime, endTime, {
                commitment_id,
                id: `${commitment_id}`,
                title,
                userId,
            });

            segments.forEach((segment, idx) =>
                events.push({ ...segment, id: `${commitment_id}-p${idx}`, userId })
            );
        }
    });
 return events;
}


const generateRecurringEvents = (commitment) => {
    const events = [];
    const [startDate, endDate] = commitment.dates;
    const daysOfWeek = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayName = Object.keys(daysOfWeek)[date.getDay()];

        if (commitment.days.includes(dayName)) {
            const segments = createSegments(
                new Date(date),
                commitment.startTime,
                commitment.endTime,
                {
                    commitment_id: commitment.commitment_id,
                    id: `${commitment.commitment_id}`,
                    title: commitment.name,
                    userId: commitment.user_id || commitment.owner_id || commitment.userId,
                }
            );
            segments.forEach((segment, idx) =>
                events.push({ ...segment, id: `${commitment.commitment_id}-p${idx}-${date.toISOString()}`, userId: commitment.user_id || commitment.owner_id || commitment.userId })
            );
        }
    }
    return events;
};


