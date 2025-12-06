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

    // Remove a single commitment
    const handleRemoveCommitment = async (commitmentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/${state.id}/${commitmentId}/remove-commitment`, {
                method: 'DELETE',
            });

            if (response.ok) {
                dispatch({ type: 'REMOVE_COMMITMENT', payload: commitmentId });
                setShowPopup(false); // Close popup after deletion
            } else {
                console.error('Failed to delete commitment');
            }
        } catch (error) {
            console.error('Error deleting commitment:', error);
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
                    <p>
                        <b>Dates:</b> {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </p>
                    {event.owner && event.owner.id !== state.id && (
                        <p>
                            <b>Owner:</b> {event.owner.username}
                        </p>
                    )}
                    {event.owner && event.owner.id === state.id && (
                        <>
                            <button
                                style={actionButtonStyle}
                                onClick={() => handleRemoveCommitment(event.id)}
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
                            {event.commitment_id && (
                                <>
                                    <button
                                        style={actionButtonStyle}
                                        onClick={() => console.log('Remove all related events triggered')}
                                    >
                                        Remove All Related
                                    </button>
                                    <button
                                        style={actionButtonStyle}
                                        onClick={() => console.log('Edit all related events triggered')}
                                    >
                                        Edit All Related
                                    </button>
                                </>
                            )}
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

