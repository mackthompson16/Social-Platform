
import React, { useState } from 'react';
import Header from './header.js';
import './styles.css';
import Footer from './footer.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';
import Calendar from './calendar.js';

const User = require('./user'); 


// Commitment class to store commitment data
class Commitment {
    constructor(commitment, startTime, endTime, days,dates) {
        this.name = commitment;
        this.startTime = startTime;
        this.endTime = endTime;
        this.days = days;
        this.dates = dates;
    }
}



export default function Schedule({ currentUser,setCurrentUser, setCurrentPage }) {
    const [showForm, setShowForm] = useState(false);
    const [showCommitments, setShowCommitments] = useState(false);

    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [error, setError] = useState(null);
    const daysOfWeek = ["Select All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
   
    

    const toggleForm = () => {
        setShowForm(!showForm);
    
    };
    const toggleSideMenu = () => {
        setShowCommitments(!showCommitments);
    
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
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

                newCommitment = new Commitment(
                    name,
                    startTime,
                    endTime,
                    selectedDays,  // Pass selected days for recurring commitment
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
        
            
        if(newCommitment){
    
            try {
                const user = new User({ id: currentUser.id });
    
                /* 
                The user data is serialized in the database, 
                so I need to reinitialize the user object to access createSchedule.
                This is something that took me a long time
                as I tried to fetch the user instance I created initially.
                This is not how the program should work. All I need is the 
                database location to update it, so currentUser.id works fine,
                and I can create a new user object.
                */
    
                const updatedUser = await user.addCommitment(newCommitment);
    
                if (updatedUser) {
                    // Safely update the current user state
                    setCurrentUser(updatedUser);
                    console.log("User updated successfully:", updatedUser);
                } else {
                    console.log("Error updating user");
                }
            } catch (err) {
                console.error("Error fetching user or creating schedule:", err);
            }
        
        }else{
            console.log('error: one or more fields empty');
        }
        setName('');
        setStartTime('');
        setEndTime('');
        setStartDate('');
        setEndDate('');
        setSelectedDays([]);
        setError('');
        setIsRecurring(false);
        setShowForm(false);
    };
    

    const toggleDaySelection = (day) => {
        setSelectedDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
    };
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12; // Converts "0" to "12" for midnight
    
        return `${formattedHour}:${minutes} ${period}`;
    };
   
    const renderSchedule = () => {
        const parsedCommitments = JSON.parse(currentUser.commitments || '[]');
    
        // Function to handle the removal of a commitment
        const handleRemoveCommitment = async (commitmentId) => {
            try {
                const response = await fetch(`/api/removeCommitment/${commitmentId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    // Update the commitments after deletion
                    const updatedCommitments = parsedCommitments.filter(c => c.id !== commitmentId);
                    currentUser.commitments = JSON.stringify(updatedCommitments); // Update the user data
                    setCurrentUser({ ...currentUser }); // Trigger re-render
                } else {
                    console.error("Failed to delete commitment");
                }
            } catch (error) {
                console.error("Error deleting commitment:", error);
            }
        };
    
        if (parsedCommitments.length > 0) {
            return (
                <div className="schedule-container">
                    {parsedCommitments.map((commitment, index) => (
                        <div key={index} className="commitment">
                            <button 
                                onClick={() => handleRemoveCommitment(commitment.id)}
                                className="remove-button"
                            >
                                &times;
                            </button>
                            <h3>{commitment.name || 'N/A'}</h3>
                            <p>Time: {formatTime(commitment.startTime)} - {formatTime(commitment.endTime)}</p>
                            <p>{commitment.days.length > 0 ? `Days: ${commitment.days.join(', ')}` : ''}</p>
                            <p>
                                Dates: {new Date(commitment.dates[0]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} 
                                {commitment.dates.length > 1 ? ` - ${new Date(commitment.dates[1]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
    };
    
    
    
    
    
return (
    <div>

    <button onClick={toggleSideMenu} className="btn btn-secondary">
        {showCommitments ? 'Hide Menu' : 'Show Menu'}
    </button>

    <Calendar currentUser={currentUser} />

    <div className="container">
        {showForm && (
            <div className="form-overlay">
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="text"
                        id="formCommitment"
                        placeholder="Title"
                        value={name}
                        className="form-control"
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step="300"
                        className="form-control"
                    />

                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        step="300"
                        className="form-control"
                    />

                    {/* Initial Date Picker */}
                    <div>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            placeholderText="Start date"
                            isClearable={true}
                            customInput={
                                <button type="button" className="form-control">
                                    <FaCalendarAlt style={{ marginRight: '8px' }} />
                                    {startDate ? startDate.toLocaleDateString() : "Select date"}
                                </button>
                            }
                        />
                    </div>

                    {/* Recurring Checkbox */}
                    <div className="form-check">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="form-check-input"
                        />
                        <label htmlFor="recurring" className="form-check-label">Recurring</label>
                    </div>

                    {/* Conditional End Date Picker and Days of the Week */}
                    {isRecurring && (
                        <>
                            <div>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    placeholderText="End date"
                                    isClearable={true}
                                    customInput={
                                        <button type="button" className="form-control">
                                            <FaCalendarAlt style={{ marginRight: '8px' }} />
                                            {endDate ? endDate.toLocaleDateString() : "Select end date"}
                                        </button>
                                    }
                                />
                            </div>

                            <h3>Active Days</h3>
                            <div className="day-selection">
                                {daysOfWeek.map((day) => (
                                    <div key={day} className="form-check form-check-inline">
                                        <input
                                            type="checkbox"
                                            id={`day-${day}`}
                                            className="form-check-input"
                                            checked={selectedDays.includes(day)}
                                            onChange={() => toggleDaySelection(day)}
                                        />
                                        <label htmlFor={`day-${day}`} className="form-check-label">
                                            {day}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="form-buttons">
                        <button type="submit" className="btn btn-primary">Add</button>
                        <button type="button" className="btn btn-secondary" onClick={toggleForm}>Cancel</button>
                    </div>
                </form>
            </div>
        )}
    </div>

    {showCommitments && (
        <div className="side-menu">
            <h1>My Commitments</h1>
            {renderSchedule()}
            {!showForm && (
                <button
                    className="btn btn-primary"
                    onClick={toggleForm}
                >
                    Add Commitment
                </button>
            )}
        </div>
    )}
</div>
)
}
