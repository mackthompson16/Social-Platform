import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';

export default function Calendar() {
    const { state } = useUser();
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const events = [];
    
        state.commitments.forEach(commitment => {
            const parsedDates = JSON.parse(commitment.dates);
            const parsedDays = JSON.parse(commitment.days);
            
            // Extract common fields
            const title = commitment.name;
            const id = commitment.id;
    
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
                    id,
                    title,
                    start,
                    end
                });
            }
        });
    
        setEvents(events);
    }, [state.commitments]);
    

    const generateRecurringEvents = (commitment) => {
        const events = [];
        const [startDate, endDate] = commitment.dates;
        const daysOfWeek = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const start = new Date(startDate);
        const end = new Date(endDate);

        const isSelectAll = commitment.days.includes("Select All");

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayName = Object.keys(daysOfWeek)[date.getDay()];

            if (isSelectAll || commitment.days.includes(dayName)) {
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

    

  const colorPalette = [
    '#B0E0E6', // Pale blue
    '#D5E8D4', // Light green
    '#F8E6D2', // Soft peach
    '#D3D3E7', // Lavender
    '#FAE3E3', // Light blush
    '#F2D7EE', // Pale pink
    '#C2D9E7', // Light sky blue
    '#F8EDD3', // Cream
    '#D4E2D4', // Mint
    '#E7D3C2'  // Beige
];

  const renderEventContent = (eventInfo) => {
    
    const title = eventInfo.event.title;
    const id = eventInfo.event.id;
    const start = new Date(eventInfo.event.start);
    const end = new Date(eventInfo.event.end);
    const duration = (end - start) / (1000 * 60); // Duration in minutes
    const heightPercentage = (duration / 6) * 100;
   
    const lastDigit = id % 10;
    const color = colorPalette[lastDigit];
   
    return (
        <div
        style={{
          
            height: `${heightPercentage}%`,
            minHeight: '24px', // Ensures it’s tall enough for the text; adjust as needed
            width: '100%',
            backgroundColor: color || '#FF5733',
            color: 'white',
            padding: '4px',
            borderRadius: '4px',
            boxSizing: 'border-box',
            border: '1px solid #ddd',
            overflow: 'hidden',
            opacity: 0.7,
          
            alignItems: 'top',      
            justifyContent: 'left'    
        }}
    >
        <b style={{ color: '#000' }}>{title} </b> 
    </div>
    
    );
};

    return (
        <div className="calendar-container">
            <FullCalendar
                key={events.length} // Use `events.length` or a unique identifier to force re-render
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events}
                eventContent={renderEventContent}
            />
        </div>
    );
}
