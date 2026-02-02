import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';
import { useUser } from './usercontext';
import { API_BASE_URL } from './config';

const formatLocalDate = (value) => {
    if (!(value instanceof Date)) return value;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
    if (value instanceof Date) return value;
    if (!value) return null;
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
};

export default function EventForm({ mode = 'create', event = null }) {
    const { state, dispatch } = useUser();
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [date, setDate] = useState(null);
    const [members, setMembers] = useState([]);
    const [localStatus, setLocalStatus] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [inviteUpdating, setInviteUpdating] = useState(false);
    const [viewFriends, setViewFriends] = useState(false);
    const [invitedFriends, setInvitedFriends] = useState([]);
    const [error, setError] = useState(null);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const effectiveStatus = localStatus || event?.memberStatus;
    const isDeclined = mode === 'edit' && effectiveStatus === 'declined';
    const isReadOnly = mode === 'edit' && Boolean(event?.readOnly);
    const isOwner = mode === 'edit' && event?.ownerId && Number(event.ownerId) === Number(state.id);
    const memberCount = event?.memberCount || members.length || 1;
    const hasMultiple = memberCount > 1;
    const isLocked = mode === 'edit' && hasMultiple && effectiveStatus && effectiveStatus !== 'accepted';
    const isDisabled = isReadOnly || isLocked;
    const anyAccepted = members.length
        ? members.some((member) => member.status === 'accepted')
        : event?.eventStatus === 'accepted';

    const cancelForm = () => {
        dispatch({
            type: 'REPLACE_CONTEXT',
            payload: { current_form: 'NONE', editingEvent: null },
        });
    };

    const resetForm = () => {
        setName('');
        setStartTime('');
        setEndTime('');
        setDate(null);
        setError('');
        setViewFriends(false);
        setInvitedFriends([]);
        setAttemptedSubmit(false);
        setLocalStatus(null);
        setPendingStatusChange(false);
    };

    useEffect(() => {
        if (mode !== 'edit' || !event) return;
        setName(event.name || '');
        setStartTime(event.startTime || '');
        setEndTime(event.endTime || '');
        setDate(parseLocalDate(event.date));
        setViewFriends(false);
        setInvitedFriends([]);
        setMembers([]);
        setLocalStatus(null);
        setPendingStatusChange(false);
    }, [mode, event]);

    useEffect(() => {
        if (mode !== 'edit' || !event?.eventId) return;
        const loadMembers = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/social/events/${event.eventId}/members`);
                const data = await response.json();
                if (data.success && Array.isArray(data.members)) {
                    setMembers(data.members);
                }
            } catch (err) {
                console.error('Failed to load event members', err);
            }
        };
        loadMembers();
    }, [mode, event?.eventId]);

    useEffect(() => {
        if (state.events.length > 0 && attemptedSubmit) {
            setShowBanner(true);
            const timer = setTimeout(() => {
                setShowBanner(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [state.events, attemptedSubmit]);

    const toggleFriendSelection = (friend) => {
        if (invitedFriends.includes(friend)) {
            setInvitedFriends(invitedFriends.filter((f) => f !== friend));
        } else {
            setInvitedFriends([...invitedFriends, friend]);
        }
    };

    const handleToggleStatus = async () => {
        if (!event?.eventId) return;
        const current =
            localStatus ||
            members.find((member) => Number(member.userId) === Number(state.id))?.status ||
            event?.memberStatus;
        const nextStatus = current === 'accepted' ? 'declined' : 'accepted';
        setLocalStatus(nextStatus);
        setPendingStatusChange(true);
        if (members.length) {
            setMembers((prev) =>
                prev.map((member) =>
                    Number(member.userId) === Number(state.id)
                        ? { ...member, status: nextStatus }
                        : member
                )
            );
        }
    };

    const handleInviteMore = async () => {
        if (!event?.eventId || invitedFriends.length === 0) return;
        setInviteUpdating(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/social/${state.id}/${event.eventId}/invite`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipientIds: invitedFriends.map((f) => f.id) }),
                }
            );
            const data = await response.json();
            if (data.success && Array.isArray(data.members)) {
                setMembers(data.members);
            }
        } catch (err) {
            console.error('Failed to invite attendees', err);
        } finally {
            setInviteUpdating(false);
        }
    };

    const handleSubmit = async (eventSubmit) => {
        eventSubmit.preventDefault();
        setAttemptedSubmit(true);

        if (!name || !startTime || !endTime || !date) {
            setError('Missing field(s)');
            return;
        }
        if (endTime < startTime) {
            setError('End time before start time');
            return;
        }

        try {
            if (mode === 'edit' && event?.eventId) {
                const payload = {
                    name,
                    date: formatLocalDate(date),
                    startTime,
                    endTime,
                };

                if (pendingStatusChange && localStatus) {
                    setStatusUpdating(true);
                    try {
                        await fetch(`${API_BASE_URL}/api/social/${state.id}/${event.eventId}/update-status`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: localStatus }),
                        });
                    } catch (err) {
                        console.error('Failed to update status', err);
                    } finally {
                        setStatusUpdating(false);
                    }
                }

                if ((event.memberCount || 1) > 1) {
                    await fetch(`${API_BASE_URL}/api/social/${state.id}/request-edit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId: event.eventId,
                            payload,
                        }),
                    });
                } else {
                    const response = await fetch(
                        `${API_BASE_URL}/api/users/${state.id}/${event.eventId}/update-event`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                        }
                    );
                    if (response.status === 409) {
                        await fetch(`${API_BASE_URL}/api/social/${state.id}/request-edit`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventId: event.eventId,
                                payload,
                            }),
                        });
                    } else if (!response.ok) {
                        throw new Error('Failed to update event');
                    } else {
                        const data = await response.json();
                        if (data.success && data.event) {
                            dispatch({
                                type: 'UPDATE_EVENT',
                                payload: data.event,
                            });
                        }
                    }
                }

                if (viewFriends && invitedFriends.length > 0) {
                    await handleInviteMore();
                    setInvitedFriends([]);
                    setViewFriends(false);
                }

                resetForm();
                dispatch({
                    type: 'REPLACE_CONTEXT',
                    payload: { current_form: 'NONE', editingEvent: null },
                });
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/${state.id}/add-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    startTime,
                    endTime,
                    date: formatLocalDate(date),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add event');
            }

            const data = await response.json();
            if (data.success) {
                dispatch({
                    type: 'ADD_EVENT',
                    payload: data.event,
                });

                if (viewFriends) {
                    for (const friend of invitedFriends) {
                        try {
                            const eventId = data.eventId;
                            await fetch(`${API_BASE_URL}/api/social/${state.id}/${friend.id}/send-message`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'event_invite',
                                    content: `${state.username} invited you to ${name}`,
                                    payload: {
                                        eventId,
                                        name,
                                        date: formatLocalDate(date),
                                        startTime,
                                        endTime,
                                    },
                                }),
                            });
                        } catch (error) {
                            console.error('Error sending invite:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error adding event:', error);
        }

        resetForm();
        dispatch({
            type: 'REPLACE_CONTEXT',
            payload: { current_form: 'NONE', editingEvent: null },
        });
    };

    const handleDelete = async () => {
        if (!event?.eventId) return;
        if ((event.memberCount || 1) > 1) {
            setError('Edits to shared events must be requested.');
            return;
        }
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/users/${state.id}/${event.eventId}/remove-event`,
                { method: 'DELETE' }
            );
            if (!response.ok) {
                throw new Error('Failed to remove event');
            }
            dispatch({
                type: 'REMOVE_EVENT',
                payload: event.eventId,
            });
            resetForm();
            dispatch({
                type: 'REPLACE_CONTEXT',
                payload: { current_form: 'NONE', editingEvent: null },
            });
        } catch (err) {
            console.error('Error removing event:', err);
            setError('Failed to remove event');
        }
    };

    return (
        <div>
            <div className="form-body">
                <input
                    type="text"
                    id="formCommitment"
                    className="form-control"
                    placeholder="Title"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isDisabled}
                />

                <input
                    type="time"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    step="300"
                    disabled={isDisabled}
                />

                <input
                    type="time"
                    className="form-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    step="300"
                    disabled={isDisabled}
                />

                <div>
                    <DatePicker
                        selected={date}
                        onChange={(selected) => setDate(selected)}
                        placeholderText="Date"
                        className="form-control"
                        disabled={isDisabled}
                        customInput={
                            <button className="btn btn-secondary">
                                <FaCalendarAlt style={{ marginRight: '8px' }} />
                                {date ? date.toLocaleDateString() : 'Select date'}
                            </button>
                        }
                    />
                </div>

                {mode !== 'edit' && (
                    <>
                        <button
                            type="button"
                            className={`btn btn-secondary invite-toggle ${viewFriends ? 'active' : ''}`}
                            onClick={() => setViewFriends((prev) => !prev)}
                        >
                            {viewFriends ? '▼ Invite Friends' : '▶ Invite Friends'}
                        </button>
                        {viewFriends && (
                            <div className="view-friends-container">
                                {state.friends
                                    .filter((friend) => friend.id !== state.id)
                                    .map((friend) => (
                                        <label key={friend.id} className="friend-option">
                                            <input
                                                type="checkbox"
                                                checked={invitedFriends.includes(friend)}
                                                onChange={() => toggleFriendSelection(friend)}
                                            />
                                            {friend.username}
                                        </label>
                                    ))}
                            </div>
                        )}
                    </>
                )}

                {mode === 'edit' && (
                    <>
                        <div className="view-friends-container attendees-box">
                            <div className="attendees-header">
                                <strong>Attendees</strong>
                                {!isReadOnly && hasMultiple && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-xs status-toggle"
                                        onClick={handleToggleStatus}
                                        disabled={statusUpdating}
                                    >
                                        Change status
                                    </button>
                                )}
                            </div>
                            {members.length === 0 && (
                                <div className="friend-option">No attendees loaded.</div>
                            )}
                            {members.map((member) => (
                                <div key={member.userId} className="friend-option">
                                    <span>{member.username}</span>
                                    {hasMultiple && (
                                        <span style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>
                                            {member.status}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!isReadOnly && !isLocked && (
                            <button
                                type="button"
                                className={`btn btn-secondary invite-toggle ${viewFriends ? 'active' : ''}`}
                                onClick={() => setViewFriends((prev) => !prev)}
                                disabled={isDeclined}
                            >
                                {viewFriends ? '▼ Invite' : '▶ Invite'}
                            </button>
                        )}
                        {viewFriends && (
                            <div className="view-friends-container">
                                {state.friends
                                    .filter((friend) => friend.id !== state.id)
                                    .filter(
                                        (friend) =>
                                            !members.some(
                                                (member) => Number(member.userId) === Number(friend.id)
                                            )
                                    )
                                    .map((friend) => (
                                        <label key={friend.id} className="friend-option">
                                            <input
                                                type="checkbox"
                                                checked={invitedFriends.includes(friend)}
                                                onChange={() => toggleFriendSelection(friend)}
                                            />
                                            {friend.username}
                                        </label>
                                    ))}
                            </div>
                        )}
                    </>
                )}

                {error && attemptedSubmit && <div className="alert alert-danger">{error}</div>}
            </div>
            {!isReadOnly && !isLocked && (
            <div className="action-buttons">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                        cancelForm();
                    }}
                >
                    cancel
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                        resetForm();
                    }}
                >
                    Reset
                </button>
                {mode === 'edit' && isOwner && !anyAccepted && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleDelete}
                        disabled={isDisabled}
                    >
                        Remove
                    </button>
                )}
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isDisabled}
                >
                    {mode === 'edit' ? 'Save' : 'Add'}
                </button>
            </div>
            )}

            {showBanner && <div className="pop-up">Added Event</div>}
        </div>
    );
}
