import { Button, Form, Alert } from 'react-bootstrap';
import React, { useState } from 'react';
import Header from './header.js';
import './styles.css';
import Footer from './footer.js';
const User = require('./user'); 


// Commitment class to store commitment data
class Commitment {
    constructor(commitment, startTime, endTime, days) {
        this.name = commitment;
        this.startTime = startTime;
        this.endTime = endTime;
        this.days = days;
    }
}



export default function Schedule({ currentUser,setCurrentUser, setCurrentPage }) {
    const [showForm, setShowForm] = useState(false);
    const [scheduleName, setScheduleName] = useState('');
    const [commitment, setCommitment] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const [commitments, setCommitments] = useState([]); // Array to store multiple commitments
    const [error, setError] = useState(''); // To display any overlap error

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const generateTimeOptions = () => {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const formattedTime = new Date(0, 0, 0, hour, minute)
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                times.push(formattedTime);
            }
        }
        return times;
    };

    const timeOptions = generateTimeOptions();

    const toggleForm = () => {
        setShowForm(!showForm);
    
    };

    const timeToNumber = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes; // Convert time to minutes for comparison
    };

    const isTimeOverlap = (start1, end1, start2, end2) => {
        const start1Min = timeToNumber(start1);
        const end1Min = timeToNumber(end1);
        const start2Min = timeToNumber(start2);
        const end2Min = timeToNumber(end2);
        return start1Min < end2Min && start2Min < end1Min; // Check for overlap
    };

    const checkForOverlap = (newCommitment) => {
        for (const previousCommitment of commitments) {
            for (const day of newCommitment.days) {
                if (previousCommitment.days.includes(day)) {
                    if (isTimeOverlap(newCommitment.startTime, newCommitment.endTime, previousCommitment.startTime, previousCommitment.endTime)) {
                        return true; // Overlap detected
                    }
                }
            }
        }
        return false; // No overlap
    };

    const handleAddCommitment = () => {
        const newCommitment = new Commitment( commitment, startTime, endTime, selectedDays);
        
        // Check for overlap
        if (checkForOverlap(newCommitment)) {
            setError('The commitment overlaps with an existing commitment.');
            return; 
        }

        console.log("added commitment:", commitment, startTime, endTime, selectedDays);
      

        // If no overlap, add new commitment
        setCommitments([...commitments, newCommitment]);
        
        resetForm(); 
    };
    const resetForm = () => {

        setCommitment('');
        setStartTime('');
        setEndTime('');
        setSelectedDays([]);
        setError(''); 

    }
    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (commitment && startTime && endTime && selectedDays.length > 0) {
            const newCommitment = new Commitment(commitment, startTime, endTime, selectedDays);
    
            if (checkForOverlap(newCommitment)) {
                setError('The commitment overlaps with an existing commitment.');
                return;
            }
    
            const updatedCommitments = [...commitments, newCommitment];
            setCommitments(updatedCommitments);
    
            try {
               
                const user = new User({id: currentUser.id});
                /* 

                user data is serialized in the database 
                so i need to reinitialize the user object 
                to access createSchedule.

                This is something that took me a long time
                as I tried to fetch the user instance i created initially.
                This is not how the program should work. All i need is the 
                database location to update it, so currentUser.id works fine,
                and I can create a new user object.
                
                */
           
                user.createSchedule(scheduleName, updatedCommitments);
                setCurrentUser(user);
                setScheduleName('');
                console.log("updated data: ", currentUser);

            } catch (err) {
                console.error("Error fetching user or creating schedule:", err);
            }
        }
    
        resetForm();
        setShowForm(false);
    };
    
    
    

    const toggleDaySelection = (day) => {
        setSelectedDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
    };

    const renderSchedules = () => {
        let parsedSchedules = [];
        try {
            parsedSchedules = JSON.parse(currentUser.schedules || '[]'); // Parse once
        } catch (e) {
            console.error('Invalid schedules JSON', e);
        }
    
        // Check if parsed schedules exist and are non-empty
        if (parsedSchedules.length > 0) {
            return parsedSchedules.map((schedule, index) => (
                <div key={index} className="schedule">
                    {/* Display Schedule Name, or fallback to 'Unnamed Schedule' if name is missing */}
                    <h3 className="schedule-name">{schedule.name || 'Unnamed Schedule'}</h3>
    
                    {schedule.commitments && schedule.commitments.length > 0 ? (
                        schedule.commitments.map((commitment, cIndex) => (
                            <div key={`${index}-${cIndex}`} className="commitment">
                                <h4>Commitment {cIndex + 1}</h4>
                                <p><strong>Commitment Name:</strong> {commitment.commitment || 'N/A'}</p>
                                <p><strong>Time:</strong> {commitment.startTime} - {commitment.endTime}</p>
                                <p><strong>Days:</strong> {Array.isArray(commitment.days) ? commitment.days.join(', ') : 'No days available'}</p>
                            </div>
                        ))
                    ) : (
                        <div className="no-commitments">No commitments available.</div>
                    )}
                </div>
            ));
        } else {
            return <div className="no-schedules">No schedules available.</div>;
        }
    };
    

    return (
        <div>
            <Header setCurrentPage={setCurrentPage} />

            {!showForm && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        style={{ marginBottom: '20px' }}
                        className="btn btn-primary"
                        onClick={toggleForm}
                    >
                        Create New
                    </Button>
                </div>
            )}

            {showForm && (
                    <form onSubmit={handleSubmit}>
                        {/* Form Group for Schedule Name */}
                        <div className="form-group">
                            <label htmlFor="formScheduleName" className="form-label">Schedule Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="formScheduleName"
                                placeholder="Enter schedule name"
                                value={scheduleName}
                                onChange={(e) => setScheduleName(e.target.value)} // Capture schedule name
                            />
                        </div>

                        {/* Form Group for Commitment */}
                        <div className="form-group">
                            <label htmlFor="formCommitment" className="form-label">Commitment</label>
                            <input
                                type="text"
                                className="form-control"
                                id="formCommitment"
                                placeholder="Enter commitment"
                                value={commitment}
                                onChange={(e) => setCommitment(e.target.value)}
                            />
                        </div>

                        {/* Form Group for Start and End Time */}
                        <div className="form-group">
                            <label htmlFor="formStartTime" className="form-label">Start Time</label>
                            <select
                                className="form-control"
                                id="formStartTime"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            >
                                <option value="">Select start time</option>
                                {timeOptions.map((time, index) => (
                                    <option key={index} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="formEndTime" className="form-label" style={{ marginTop: '10px' }}>End Time</label>
                            <select
                                className="form-control"
                                id="formEndTime"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            >
                                <option value="">Select end time</option>
                                {timeOptions.map((time, index) => (
                                    <option key={index} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Form Group for Days */}
                        <div className="form-group">
                            <label htmlFor="formDays" className="form-label">Days</label>
                            <div>
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`btn ${selectedDays.includes(day) ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => toggleDaySelection(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && <div className="alert alert-danger">{error}</div>}

                        
                            <button type="button" className="btn btn-secondary" onClick={handleAddCommitment}>
                                Add
                            </button>

                            <button type="submit" className="btn btn-primary" style={{ marginLeft: '10px' }}>
                                Create Schedule
                            </button>

                            <button type="button" className="btn btn-secondary" onClick={toggleForm}>
                                Cancel
                            </button>
                        

                    </form>
            )}

        
            <div>
              
                <div style= {{textAlign: 'center'}}>
                    <h1>My Schedules</h1>
                </div>
                    
                {renderSchedules()}
            </div>
    </div>
);
}
