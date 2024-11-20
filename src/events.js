

export default function generateEvents(commitments) {
    const events = [];
    commitments.forEach(commitment => {
        let parsedDates;
        let parsedDays;
        
      
          
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
        // Recurring commitment: Use generateRecurringEvents
        const recurringEvents = generateRecurringEvents({ ...commitment, dates: parsedDates, days: parsedDays });
        recurringEvents.forEach(event => events.push(event));
    } else if (typeof parsedDates === 'string' || (Array.isArray(parsedDates) && parsedDates.length === 1)) {
        // Non-recurring commitment: Handle single date
        const singleDate = Array.isArray(parsedDates) ? parsedDates[0] : parsedDates;
        const startDate = new Date(singleDate);

        if (isNaN(startDate.getTime())) {
            console.error(`Invalid date for non-recurring commitment ID: ${commitment.id}`);
            return; // Skip invalid dates
        }

        // Set start and end times
        const [startHour, startMinute] = commitment.startTime.split(':').map(Number);
        const [endHour, endMinute] = commitment.endTime.split(':').map(Number);

        const start = new Date(startDate);
        start.setHours(startHour, startMinute);

        const end = new Date(startDate);
        end.setHours(endHour, endMinute);

        // Add non-recurring event directly to events array
        events.push({
            commitment_id,
            title,
            start,
            end
        });
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
            events.push({
                id: commitment.id,
                title: commitment.name,
                start: new Date(`${date.toISOString().split('T')[0]}T${commitment.startTime}`),
                end: new Date(`${date.toISOString().split('T')[0]}T${commitment.endTime}`)
            });
        }
    }
    return events;
};


