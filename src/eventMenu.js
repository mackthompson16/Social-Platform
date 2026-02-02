import React, { useState } from 'react';
import { useUser } from './usercontext';
import { API_BASE_URL } from './config';

export default function ViewEvent({ event }) {
    const { state, dispatch } = useUser();
    const [showPopup, setShowPopup] = useState(true);

    // Format time to AM/PM
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12; // Converts "0" to "12" for midnight
        return `${formattedHour}:${minutes} ${period}`;
    };

    // Remove a single event
    const handleRemoveEvent = async (eventId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${state.id}/${eventId}/remove-event`, {
                method: 'DELETE',
            });

            if (response.ok) {
                dispatch({ type: 'REMOVE_EVENT', payload: eventId });
                setShowPopup(false); // Close popup after deletion
            } else {
                console.error('Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    // Render the modal
    return (
        showPopup && (
            <div style={popupOverlayStyle} onClick={() => setShowPopup(false)}>
                <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
                    <h2>{event.name || 'Event Details'}</h2>
                    <p>
                        <b>Time:</b> {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                    {event.date && (
                        <p>
                            <b>Date:</b> {new Date(event.date).toLocaleDateString()}
                        </p>
                    )}
                    {event.owner && event.owner.id !== state.id && (
                        <p>
                            <b>Owner:</b> {event.owner.username}
                        </p>
                    )}
                    {event.owner && event.owner.id === state.id && (
                        <>
                            <button
                                style={actionButtonStyle}
                                onClick={() => handleRemoveEvent(event.eventId || event.id)}
                            >
                                Remove
                            </button>
                            <button
                                style={actionButtonStyle}
                                onClick={() => {
                                    // Trigger edit form (logic not included here)
                                    console.log('Edit event triggered');
                                }}
                            >
                                Edit
                            </button>
                        </>
                    )}
                    <button
                        style={{ ...actionButtonStyle, backgroundColor: 'red' }}
                        onClick={() => setShowPopup(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    );
}

