import { Button, Form, Alert } from 'react-bootstrap';
import React, { useState } from 'react';
import Header from './header.js';
import Footer from './footer.js';



// Commitment class to store commitment data
class Commitment {
    constructor(commitment, startTime, endTime, days) {
        this.commitment = commitment;
        this.startTime = startTime;
        this.endTime = endTime;
        this.days = days;
    }
}



export default function Schedule({ currentUser, setCurrentPage, user }) {
    const [showForm, setShowForm] = useState(false);
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

    const handleCreateNewClick = () => {
        setShowForm(true);
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
        const newCommitment = new Commitment(commitment, startTime, endTime, selectedDays);
        
        // Check for overlap
        if (checkForOverlap(newCommitment)) {
            setError('The commitment overlaps with an existing commitment.');
            return; 
        }

        console.log("added commitment:", commitment, startTime, endTime, selectedDays);
      

        // If no overlap, add new commitment
        setCommitments([...commitments, newCommitment]);

        // Reset the form fields
        setCommitment('');
        setStartTime('');
        setEndTime('');
        setSelectedDays([]);
        setError(''); // Clear any previous error
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Execute user.createSchedule with the commitments array

        console.log("commiting schedule:", commitments)
        user.createSchedule(commitments);
        setShowForm(false); // Optionally hide the form after submission
    };

    const toggleDaySelection = (day) => {
        setSelectedDays((prevSelectedDays) =>
            prevSelectedDays.includes(day)
                ? prevSelectedDays.filter((d) => d !== day)
                : [...prevSelectedDays, day]
        );
    };

    return (
        <div>
            <Header setCurrentPage={setCurrentPage} />

            <div>
                <Button
                    style={{ marginBottom: '20px' }}
                    variant="outline-primary"
                    onClick={handleCreateNewClick}
                >
                    Create New
                </Button>
            </div>

            {showForm && (
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formCommitment">
                        <Form.Label>Commitment</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter commitment"
                            value={commitment}
                            onChange={(e) => setCommitment(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="formTime">
                        <Form.Label>Start Time</Form.Label>
                        <Form.Control
                            as="select"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        >
                            <option value="">Select start time</option>
                            {timeOptions.map((time, index) => (
                                <option key={index} value={time}>
                                    {time}
                                </option>
                            ))}
                        </Form.Control>

                        <Form.Label style={{ marginTop: '10px' }}>End Time</Form.Label>
                        <Form.Control
                            as="select"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        >
                            <option value="">Select end time</option>
                            {timeOptions.map((time, index) => (
                                <option key={index} value={time}>
                                    {time}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="formDays">
                        <Form.Label>Days</Form.Label>
                        <div>
                            {daysOfWeek.map((day) => (
                                <Button
                                    key={day}
                                    variant={selectedDays.includes(day) ? 'primary' : 'outline-primary'}
                                    onClick={() => toggleDaySelection(day)}
                                    style={{ margin: '5px' }}
                                >
                                    {day}
                                </Button>
                            ))}
                        </div>
                    </Form.Group>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Button variant="secondary" type="button" onClick={handleAddCommitment}>
                        Add New Commitment
                    </Button>

                    <Button variant="primary" type="submit" style={{ marginLeft: '10px' }}>
                        Submit All Commitments
                    </Button>
                </Form>
            )}
        
            <div>
            {currentUser.schedules && currentUser.schedules.length > 0 ? (
                currentUser.schedules.map((schedule, index) => (

                    <div key={index} className="scheduleContainer">

                            <h4>Schedule {index + 1}</h4>
                            <p><strong>Commitment:</strong> {schedule.commitment}</p>
                            <p><strong>Time:</strong> {schedule.startTime} - {schedule.endTime}</p>
                            <p><strong>Days:</strong> {schedule.days.join(', ')}</p>
                        
                    </div>
                ))
            ) : (
                <div>No schedules available.</div>
            )}


            </div>
        

            <Footer />
        </div>
    );
}
