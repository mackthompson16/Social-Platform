
import React, { useState, useEffect } from 'react';

import './styles.css';

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';
import Calendar from './calendar.js';

const User = require('./user'); 


// Commitment class to store commitment data
class Commitment {
    constructor(commitment, startTime, endTime, days,dates,id='id') {
        this.id = id;
        this.name = commitment;
        this.startTime = startTime;
        this.endTime = endTime;
        this.days = days;
        this.dates = dates;
    }
}



export default function Schedule({ currentUser }) {
    const [user,setUser] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showCommitments, setShowCommitments] = useState(false);
    const [commitments, setCommitments] = useState([]);
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [error, setError] = useState(null);
    const daysOfWeek = ["Select All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (currentUser?.id) {
            const loadUser = new User({ id: currentUser.id });
            setUser(loadUser);
        }
    }, [currentUser]);

    useEffect(() => {
        const loadCommitments = async () => {
            if (user) {
                try {
                    const commitmentsData = await user.getUserCommitments();
                    setCommitments(commitmentsData);
                    setLoading(false); // Set loading to false once commitments are loaded
                } catch (err) {
                    console.error("Failed to load commitments:", err);
                }
            }
        };
        loadCommitments();
    }, [user]); 



    if (loading) {
        return <div>Loading...</div>; // Display a loading message or spinner
    }

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

    const toggleForm = () => {
        setShowForm(!showForm);
    
    };
    const toggleSideMenu = () => {
        setShowCommitments(!showCommitments);
    
    };
      
      const handleRemoveCommitment = async (commentmentId) =>{
        
        await user.removeCommitment(commentmentId);
        const updatedCommitments = await user.getUserCommitments();
    
        if (updatedCommitments) {
          setCommitments(updatedCommitments);
        
          console.log("Commitment removed? Check: ", commitments);
        } 

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
        
            
            if (newCommitment) {
                try {

                  await user.addCommitment(newCommitment);
                  const updatedCommitments = await user.getUserCommitments();
              
                  if (updatedCommitments) {
                    setCommitments(updatedCommitments);
                  
                    console.log("Commitments updated? Check: ", commitments);
                  } else {
                    console.log("Error updating commitments");
                  }
                } catch (err) {
                  console.error("Error adding commitment:", err);
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
        
        if (commitments.length > 0) {
            return (
                <div className="menu-container">
                    {commitments.map((commitment, index) => {
                        // Parse days if it is a JSON string or comma-separated string
                        const parsedDays = Array.isArray(commitment.days)
                            ? commitment.days
                            : JSON.parse(commitment.days) || commitment.days.split(',');
        
                        // Parse dates if it's a JSON string
                        const parsedDates = Array.isArray(commitment.dates)
                            ? commitment.dates
                            : JSON.parse(commitment.dates);
                        const lastDigit = commitment.id % 10;
                        const color = colorPalette[lastDigit];
                        return (
                            <div key={index} className="commitment" style={{backgroundColor:color}}>
                                <button 
                                    onClick={() => handleRemoveCommitment(commitment.id)}
                                    className="remove-button"
                                >
                                    &times;
                                </button>
                                <h3>{commitment.name || 'N/A'}</h3>
                                <p>Time: {formatTime(commitment.startTime)} - {formatTime(commitment.endTime)}</p>
                                <p>{parsedDays.length > 0 ? `Days: ${parsedDays.join(', ')}` : ''}</p>
                                <p>
                                    Date{parsedDates.length > 1?'s': ''}: {parsedDates.length > 0 
                                        ? `${new Date(parsedDates[0]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` 
                                        : ''}
                                    {parsedDates.length > 1 
                                        ? ` - ${new Date(parsedDates[1]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` 
                                        : ''}
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        }
        
    };
    
    
    
    
    
return (
    <div>

    <button onClick={toggleSideMenu} className="btn btn-secondary">
        {showCommitments ? 'Hide Menu' : 'Show Menu'}
    </button>

    <Calendar commitments={commitments} />

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
