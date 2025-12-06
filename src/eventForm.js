
import React, { useState,useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';
import { useUser } from './usercontext';
import { API_BASE_URL } from './config';

class Commitment {
    constructor(commitment, startTime, endTime, days,dates) {
        this.name = commitment;
        this.startTime = startTime;
        this.endTime = endTime;
        this.days = days;
        this.dates = dates;
    }
}


export default function EventForm(){
    const { state, dispatch } = useUser();
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [viewFriends, setViewFriends] = useState(false);
    const [invitedFriends, setInvitedFriends] = useState([]);
    const [error, setError] = useState(null);
    const daysOfWeek = ["All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [selectedDays, setSelectedDays] = useState([]);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    
    function cancelForm() {
        dispatch({
            type:'REPLACE_CONTEXT',
            payload:{current_form: 'NONE'}
        })
    }

    function resetForm() {
        setName('');
        setStartTime('');
        setEndTime('');
        setStartDate('');
        setEndDate('');
        setSelectedDays([]);
        setError('');
        setIsRecurring(false);
        setInvitedFriends([]);
        setViewFriends(false);
        setAttemptedSubmit(false);
    }

    const [showBanner, setShowBanner] = useState(false);
    useEffect(() => {
        if (state.commitments.length > 0 && attemptedSubmit) {
            setShowBanner(true); // Show the banner
    
            // Hide the banner after 3 seconds
            const timer = setTimeout(() => {
                setShowBanner(false);
            }, 3000);
    
            return () => clearTimeout(timer); // Cleanup timeout on component unmount
        }
    }, [state.commitments]);

    const toggleDaySelection = (day) => {
        if (day === "All") {
            // If "All" is selected, either select or deselect all days
            setSelectedDays(selectedDays.length === daysOfWeek.length ? [] : daysOfWeek);
        } else {
            // Toggle individual days
            setSelectedDays((prevSelectedDays) =>
                prevSelectedDays.includes(day)
                    ? prevSelectedDays.filter((d) => d !== day)
                    : [...prevSelectedDays, day]
            );
        }
    };

    const toggleFriendSelection = (friend) => {
        if (invitedFriends.includes(friend)) {
         
            setInvitedFriends(invitedFriends.filter((f) => f !== friend));
        } else {
    
            setInvitedFriends([...invitedFriends, friend]);
        }
    };
    

    
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        setAttemptedSubmit(true)
        let newCommitment;
        if(!name || !startTime || !endTime || !startDate){
          
            setError("Missing field(s)");
            return;
        }
        if (endTime < startTime) {
            setError("End time before start time");
            return;
        }

        if (isRecurring) {
            if ( new Date(startDate) > new Date(endDate)) {
                setError("End date before start date");
                return;
            }
            if (selectedDays.length === 0) {
                setError("select at least one day of the week.");
                return;
            }

            const validDays = selectedDays.filter(day => day !== "All");

                newCommitment = new Commitment(
                    name,
                    startTime,
                    endTime,
                    validDays,  // Pass selected days for recurring commitment
                    [startDate, endDate]  // Pass date range for recurring
                );
                // Add newCommitment to your list or handle it as needed
               
        } else {
            
                newCommitment = new Commitment(
                    name,
                    startTime,
                    endTime,
                    [],            // Empty array for selected days as it's non-recurring
                    [startDate]    // Only start date is needed for non-recurring
                );
            }
        
            
            if (!newCommitment) {
                console.log('error: one or more fields empty');
                return;
              }
            
              try {
                const response = await fetch(`${API_BASE_URL}/api/users/${state.id}/add-commitment`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(newCommitment),
                });
               
                if (!response.ok) {
                  throw new Error('Failed to add commitment');
                }

                const data = await response.json()
            if (data.success){

                dispatch({
                  type: 'ADD_COMMITMENT',
                  payload: {...newCommitment, commitment_id: data.id}
                });
        
                if (viewFriends) {
                    for (const friend of invitedFriends) {
                        try {
                            await fetch(`${API_BASE_URL}/api/social/${state.id}/${friend.id}/send-message`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'meeting_request',
                                    content: `${state.username} invited you to an event`,
                                    commitment_id: data.id,
                                    owner: { id: state.id, username: state.username },
                                }),
                            });
                        } catch (error) {
                            console.error('Error sending friend request:', error);
                        }
                    }
                }
                
        }   
            } catch (error) {
                        console.error('Error adding commitment:', error);
                        return null;
            }
                
        
        
        resetForm();
        dispatch({
            type:'REPLACE_CONTEXT',
            payload:{current_form:'NONE'}
        });
    };

    return (
     
            <div>
              <div className="header-title">
                <h3>New Event</h3>
            </div>
            <div className='form-body'>
                <input
                    type="text"
                    id="formCommitment"
                    class='form-control'
                    placeholder="Title"
                    value={name}
                    className="form-control"
                    onChange={(e) => setName(e.target.value)}
                />
    
                <input
                    type="time"
                    class='form-control'
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    step="300"
                    className="form-control"
                />
    
                <input
                    type="time"
                    class='form-control'
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    step="300"
                    className="form-control"
                />
    
                <div>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        placeholderText="Start date"
                        class='form-control'
                        customInput={
                            <button className="btn btn-secondary">
                                <FaCalendarAlt style={{ marginRight: '8px' }} />
                                {startDate ? startDate.toLocaleDateString() : "Select date"}
                            </button>
                        }
                    />
                </div>


    
                <div className="form-check">
                    <input
                        type="checkbox"
                        id="recurring"
                        class='checkbox'
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        
                    />
                    <label htmlFor="recurring" className="form-check-label">Recurring</label>
                </div>

    
                {isRecurring && (
                    <>

                    <div className="view-friends-container">
                            {daysOfWeek.map((day) => (
                                <div key={day} className="friend-option">
                                    <input
                                        type="checkbox"
                                        id={`day-${day}`}
                                        className="checkbox"
                                    
                                        checked={
                                            day === "All"
                                                ? selectedDays.length === daysOfWeek.length
                                                : selectedDays.includes(day)
                                        }
                                        onChange={() => toggleDaySelection(day)}
                                    />
                                    <label htmlFor={`day-${day}`} className="form-check-label">
                                        {day}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div>
                            <p />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                placeholderText="End date"
                                class='form-control'
                                customInput={
                                    <button className="btn btn-secondary">
                                        <FaCalendarAlt style={{ marginRight: '8px' }} />
                                        {endDate ? endDate.toLocaleDateString() : "End date"}
                                    </button>
                                }
                            />
                        </div>
    
                    
                    
                    </>
                )}

<div className="form-check">
                    <input
                        type="checkbox"
                        id="viewFriends"
                        class='checkbox'
                        checked={viewFriends}
                        onChange={(e) => setViewFriends(e.target.checked)}
                        
                    />
                    <label htmlFor="recurring" className="form-check-label">Invite Friends</label>
                </div>
            {viewFriends && (

                <div className="view-friends-container">
                {state.friends
                  .filter((friend) => friend.id !== state.id)
                  .map((friend) => (
                  <label key={friend.id} className="friend-option">
                   <input
                        type="checkbox"
                        checked={invitedFriends.includes(friend)} // Check if this friend is in the invitedFriends list
                        onChange={() => toggleFriendSelection(friend)} // Toggle the friend's selection
                        />

                    {friend.username}
                  </label>
                ))}


                
              </div>
            )}
    
                {error && attemptedSubmit && <div className="alert alert-danger">{error}</div>}
                </div>
            <div className="action-buttons">
            
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                    >
                        Add
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
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            cancelForm();
                        }}
                    >
                        cancel
                    </button>
              
            </div>
    
                {showBanner && <div className="pop-up">Added Event</div>}
            </div>
       
    );
    


}
