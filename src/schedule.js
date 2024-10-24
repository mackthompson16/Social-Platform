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
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const [error, setError] = useState(''); 
    
    
    

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

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (name && startTime && endTime && selectedDays.length > 0) {
            const newCommitment = new Commitment(name, startTime, endTime, selectedDays);
          
    
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
                const updatedUser = await user.addCommitment(newCommitment);

                if (updatedUser) {
                    // Safely update the current user state
                    setCurrentUser(updatedUser);
                    console.log("User updated successfully:", updatedUser);
                } else {
                    console.log("error updating user")
                }
                   
            
                

            } catch (err) {
                console.error("Error fetching user or creating schedule:", err);
            }
        } else {
            console.log('err: field empty', startTime , endTime , selectedDays.length)
        }
    
        setName('');
        setStartTime('');
        setEndTime('');
        setSelectedDays([]);
        setError(''); 
        setShowForm(false);
    };
    
    
    

    const toggleDaySelection = (day) => {
        setSelectedDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
    };

    const renderSchedule = () => {

      
        let parsedCommitments = JSON.parse(currentUser.commitments || '[]');
       
        // Parse schedules safely
    
        
        if (parsedCommitments.length > 0) {
            return (
                <div className="schedule-container">
                    {parsedCommitments.map((commitment, index) => (
                        
                                    <div key={index} className="commitment">
                                        
                                        <p>{commitment.name || 'N/A'}</p>
                                        <p>{commitment.startTime} - {commitment.endTime}</p>
                                        <p>{commitment.days}</p>

                                    </div>
                         
                    ))}
                </div>
            );
        }
    
        // If there are no schedules, show fallback message
        return <h1> Empty </h1>;
    };
    
    

    return (
    <div>
        <Header setCurrentPage={setCurrentPage} />
   
    <div className="container">


   

    {showForm && (
        <form onSubmit={handleSubmit} className="form">
        
           
              
                <input
                    type="text"
                    id="formCommitment"
                    placeholder="Commitment"
                    value={name}
                    className="form-control"
                    onChange={(e) => setName(e.target.value)}
                />
                      
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
       

            {/* Form Group for Days */}
            
               
                <div className="day-selection">
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

           
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Form Buttons */}
            <div className="form-buttons">
               
                <button type="submit" className="btn btn-primary">
                    Add
                </button>
                <button type="button" className="btn btn-secondary" onClick={toggleForm}>
                    Cancel
                </button>
            </div>
        </form>
    
    )}

    {/* Schedules Section */}
    <div>

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
</div>
<Footer />
</div>

);
}
