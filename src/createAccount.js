import { Button } from 'react-bootstrap';
import React, {useState} from 'react';

export default function CreateAccount({setCurrentUser, setCurrentPage}) {
  const [accInfo, setAccInfo] = useState({
    username: '',
    password: '',
    email: ''
  });

  const [showForm, setShowForm] = useState(false); // State to show/hide the form

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAccInfo({
      ...accInfo,
      [name]: value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Perform the account creation logic here (e.g., API call)
    const response = await fetch('http://localhost:5000/api/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accInfo),
    });

    const data = await response.json();

    if (data.success) {
      console.log(data.user)
      setCurrentUser(data.user)
      setCurrentPage('Schedule')

    } else {
      alert('Error creating account: ' + data.message);
    }

    // Reset the form after submission
    setAccInfo({
      username: '',
      password: '',
      email: ''
    });
    setShowForm(false); // Hide the form after successful account creation
  };

  const toggleForm = () => {
    setShowForm(!showForm); // Toggle the visibility of the form
  };

  return (
    <div className="container">
    <form onSubmit={handleSubmit}>
        <div className="form">
          
            <input
                type="text"
                id="username"
                name="username"
                value={accInfo.username}
                onChange={handleChange}
                placeholder="Username"
                className="form-control"
            />
        

        
          
            <input
                type="password"
                id="password"
                name="password"
                value={accInfo.password}
                onChange={handleChange}
                placeholder="Password"
                className="form-control"
            />
        
        
            <input
                type="email"
                id="email"
                name="email"
                value={accInfo.email}
                onChange={handleChange}
                placeholder="Email"
                className="form-control"
            />
       
        <div stlyes={{display: 'flex', flexDirection: 'row'}}>
          <Button type="submit" className="btn btn-primary">Submit</Button>
          <Button onClick={() => setCurrentPage('login')} className="btn btn-secondary">Cancel</Button>
          </div>
        </div>
    </form>
</div>

);

}

