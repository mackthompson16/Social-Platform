import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useUser } from './usercontext';
import React, { useMemo } from 'react';

export default function Calendar() {
    const { state, dispatch } = useUser();

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
        const pendingEdit = eventInfo.event.extendedProps?.pendingEdit;

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
                <div>{title}</div>
                {pendingEdit && (
                    <div
                        style={{
                            marginTop: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#0f1624',
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'inline-block',
                        }}
                    >
                        Pending edit
                    </div>
                )}
            </div>
        );
    };

 
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        const start = event.start ? new Date(event.start) : null;
        const end = event.end ? new Date(event.end) : null;
        const startTime = start
            ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
            : '';
        const endTime = end
            ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
            : '';
        const dateStr = start
            ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
                start.getDate()
              ).padStart(2, '0')}`
            : '';

        dispatch({
            type: 'REPLACE_CONTEXT',
            payload: {
                current_form: 'EDIT_EVENT',
                editingCommitment: {
                    commitment_id: event.extendedProps?.commitment_id,
                    name: event.title,
                    startTime,
                    endTime,
                    dates: [dateStr],
                    days: [],
                    eventId: event.extendedProps?.eventId,
                    memberCount: event.extendedProps?.memberCount || 1,
                    pendingEdit: event.extendedProps?.pendingEdit,
                },
            },
        });
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
