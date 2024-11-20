import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useUser } from './usercontext';
import React, {useEffect, useState} from 'react';
export default function Calendar() {
    const { state } = useUser();
    const [events, setEvents] = useState([]);

    useEffect(() => {
        console.log(state.cachedEventArrays)
        const newEvents = Object.entries(state.visibleEventKeys)
                .filter(([, value]) => value) 
                .flatMap(([key]) => state.cachedEventArrays[key] || []);
            setEvents(newEvents); 
    }, [state.visibleEventKeys, state.cachedEventArrays]);

   
   
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
            <FullCalendar
                key={events.length} // Use `events.length` or a unique identifier to force re-render
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events}
                eventContent={renderEventContent}
            />
    );
}
