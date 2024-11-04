
import React, { useState } from 'react';
import './styles.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from 'react-icons/fa';
import { useUser } from './UserContext';

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


export default function CommitmentForm(){
    const [showForm,setShowForm] = useState(true);
    const { state, dispatch } = useUser();
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [error, setError] = useState(null);
    const daysOfWeek = ["Select All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    


    const toggleDaySelection = (day) => {
        setSelectedDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
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
        
            
            if (!newCommitment) {
                console.log('error: one or more fields empty');
                return;
              }
            
              try {
                const response = await fetch(`http://localhost:5000/api/users/${state.id}/addCommitment`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(newCommitment),
                });
               
                if (!response.ok) {
                  throw new Error('Failed to add commitment');
                }

                const update = await response.json()
                
            
                  dispatch({
                  type: 'SET_COMMITMENTS',
                  payload: [...state.commitments, update], // Add the new commitment to the existing ones
                });
            
                console.log("Commitment added. Updated commitments: ",[...state.commitments, update]);
              } catch (error) {
                console.error('Error adding commitment:', error);
                return null;
              }
        
        setName('');
        setStartTime('');
        setEndTime('');
        setStartDate('');
        setEndDate('');
        setSelectedDays([]);
        setError('');
        setIsRecurring(false);
    };

    return(
       
   
        <div className="commitment-form">
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
                        <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                    </div>
                </form>
            </div>
             )}
    </div>
    )


}