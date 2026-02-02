import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useUser } from './usercontext';
import React, { useMemo } from 'react';

export default function Calendar() {
    const { state, dispatch } = useUser();

    const colorPalette = [
        '#2563EB', // Strong blue
        '#16A34A', // Strong green
        '#F97316', // Strong orange
        '#7C3AED', // Strong purple
        '#DC2626', // Strong red
        '#0EA5E9', // Cyan
        '#A855F7', // Violet
        '#65A30D', // Olive
        '#E11D48', // Rose
        '#FACC15'  // Gold
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

        const grouped = new Map();
        raw.forEach((evt) => {
            const startIso = evt.start instanceof Date ? evt.start.toISOString() : new Date(evt.start).toISOString();
            const endIso = evt.end instanceof Date ? evt.end.toISOString() : new Date(evt.end).toISOString();
            const eventId = evt.eventId || evt.event_id || '';
            const key = `${eventId}-${evt.title}-${startIso}-${endIso}`;
            const ownerId = String(evt.userId || evt.user_id || '');
            const existing = grouped.get(key);
            if (existing) {
                if (!existing.attendeeIds.includes(ownerId)) {
                    existing.attendeeIds.push(ownerId);
                }
                return;
            }
            grouped.set(key, {
                ...evt,
                attendeeIds: ownerId ? [ownerId] : [],
            });
        });

        return Array.from(grouped.values()).map((evt) => {
            const primaryId = evt.attendeeIds[0] || String(evt.userId || evt.user_id || '');
            const displayColor = userColor[primaryId] || '#61dafb';
            return {
                ...evt,
                backgroundColor: displayColor,
                borderColor: displayColor,
            };
        });
    }, [state.visibleEventKeys, state.cachedEventArrays, userColor]);

    const renderEventContent = (eventInfo) => {
        const title = eventInfo.event.title;
        const accent = eventInfo.event.backgroundColor || '#61dafb';
        const pendingEdit = eventInfo.event.extendedProps?.pendingEdit;
        const eventStatus = eventInfo.event.extendedProps?.eventStatus;
        const memberCount = eventInfo.event.extendedProps?.memberCount || 1;
        const attendeeIds = eventInfo.event.extendedProps?.attendeeIds || [];
        const showStatus = memberCount > 1;
        const statusLabel = pendingEdit
            ? 'Edit pending'
            : !showStatus
                ? null
                : eventStatus === 'accepted'
                    ? 'All attending'
                    : 'Pending responses';
        const statusClass = pendingEdit
            ? 'calendar-event-status--edit'
            : eventStatus === 'accepted'
                ? 'calendar-event-status--complete'
                : 'calendar-event-status--pending';

        return (
            <div className="calendar-event" style={{ '--event-accent': accent }}>
                {attendeeIds.length > 1 && (
                    <div className="calendar-event-stripes">
                        {attendeeIds.map((id) => (
                            <span
                                key={id}
                                className="calendar-event-stripe"
                                style={{ backgroundColor: userColor[id] || accent }}
                            />
                        ))}
                    </div>
                )}
                <div className="calendar-event-title">{title}</div>
                {statusLabel && (
                    <div className={`calendar-event-status ${statusClass}`}>{statusLabel}</div>
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
                editingEvent: {
                    eventId: event.extendedProps?.eventId || event.extendedProps?.event_id,
                    name: event.title,
                    date: dateStr,
                    startTime,
                    endTime,
                    memberCount: event.extendedProps?.memberCount || 1,
                    eventStatus: event.extendedProps?.eventStatus,
                    memberStatus: event.extendedProps?.memberStatus,
                    ownerId: event.extendedProps?.ownerId,
                    readOnly: String(event.extendedProps?.userId || '') !== String(state.id),
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
