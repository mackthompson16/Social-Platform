import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

export default function Calendar({ currentUser }) {
    // Parse the commitments if they are stored as a JSON string
    const commitments = typeof currentUser.commitments === 'string' 
        ? JSON.parse(currentUser.commitments)
        : currentUser.commitments;

    // Helper function to generate events for recurring commitments
    const generateRecurringEvents = (commitment) => {
        const events = [];
        const [startDate, endDate] = commitment.dates;
        const daysOfWeek = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Determine if "Select All" is in the days array
        const isSelectAll = commitment.days.includes("Select All");

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayName = Object.keys(daysOfWeek)[date.getDay()];

            // If "Select All" is selected or if the current day is in the days array, create an event
            if (isSelectAll || commitment.days.includes(dayName)) {
                events.push({
                    title: commitment.name,
                    start: new Date(`${date.toISOString().split('T')[0]}T${commitment.startTime}`),
                    end: new Date(`${date.toISOString().split('T')[0]}T${commitment.endTime}`)
                });
            }
        }
        return events;
    };

    // Process all commitments to create calendar events
    const events = commitments.flatMap(commitment => {
        if (commitment.dates.length > 1) {
            // Recurring commitment
            return generateRecurringEvents(commitment);
        } else {
            // Non-recurring commitment
            return {
                title: commitment.name,
                start: new Date(`${commitment.dates[0]}T${commitment.startTime}`),
                end: new Date(`${commitment.dates[0]}T${commitment.endTime}`)
            };
        }
    });

    return (
        <div class="calendar-container">
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                weekends={false}
                events={events}
            />
        </div>
    );
}
