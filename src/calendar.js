import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useUser } from './usercontext';
import React, { useMemo } from 'react';

export default function Calendar() {
    const { state } = useUser();

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

    const userColor = useMemo(() => {
        const ids = Object.keys(state.visibleEventKeys).filter((k) => state.visibleEventKeys[k]);
        const map = {};
        ids.forEach((id, idx) => {
            map[id] = colorPalette[idx % colorPalette.length];
        });
        return map;
    }, [state.visibleEventKeys]);

    const events = useMemo(() => {
        const raw = Object.entries(state.visibleEventKeys)
            .filter(([, value]) => value)
            .flatMap(([key]) => state.cachedEventArrays[key] || []);

        const seen = new Set();
        const deduped = [];
        raw.forEach((evt) => {
            const startIso = evt.start instanceof Date ? evt.start.toISOString() : new Date(evt.start).toISOString();
            const endIso = evt.end instanceof Date ? evt.end.toISOString() : new Date(evt.end).toISOString();
            const key = `${evt.title}-${startIso}-${endIso}`;
            if (seen.has(key)) return;
            seen.add(key);
            const ownerId = String(evt.userId || evt.user_id || '');
            const displayColor = userColor[ownerId] || '#61dafb';
            deduped.push({
                ...evt,
                backgroundColor: displayColor,
                borderColor: displayColor,
            });
        });
        return deduped;
    }, [state.visibleEventKeys, state.cachedEventArrays, userColor]);

    const renderEventContent = (eventInfo) => {
        const title = eventInfo.event.title;
        const color = eventInfo.event.backgroundColor || '#61dafb';

        return (
            <div
                style={{
                    width: '100%',
                    backgroundColor: color,
                    color: '#0f1624',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    opacity: 0.9,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                }}
            >
                {title}
            </div>
        );
    };

 
    const handleEventClick = (clickInfo) => {
       
        viewEvent(clickInfo.event);
    };

    return (
        <FullCalendar
            key={events.length} 
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventContent={renderEventContent}
            eventClick={handleEventClick} 
            height="auto"
        />
    );
}
