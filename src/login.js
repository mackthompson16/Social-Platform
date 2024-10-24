import { Button } from 'react-bootstrap';
import React, { useState } from 'react';

export default function Login({ setCurrentPage, setCurrentUser }) {
    const [AccInfo, setAccInfo] = useState({
      username: '',
      password: '',
    });
  
    const [showLoginForm, setShowLoginForm] = useState(false); 
  
    const handleChange = (event) => {
      const { name, value } = event.target;
      setAccInfo({
        ...AccInfo,
        [name]: value,
      });
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      // Sending a POST request to backend for login
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(AccInfo),  // Send the user input (username and password) to the backend
      });
  
      const data = await response.json();  // Get the response from the backend
      console.log('raw data:', data)
      if (data.success) {
        console.log('Login Success: ', data.user)
        setCurrentUser(data.user);
        setCurrentPage('Home');     // Navigate to the home page
      } else {
        alert('Login failed');
      }
  
      // Reset the form
      setAccInfo({
        username: '',
        password: '',
      });
    };
    const toggleLoginForm = () => {
      setShowLoginForm(!showLoginForm);
    };
  
   
  
  
    return (
      <div className="container">

    
      {!showLoginForm && (
        
          <div className="form">

            <h1>Welcome</h1>

              <div stlyes={{display: 'flex', flexDirection: 'row'}}>
            <Button 
              className="btn btn-primary" 
              onClick={toggleLoginForm}>
              Login
              </Button>
            <Button 
              className="btn btn-secondary" 
              onClick={() => setCurrentPage('CreateAccount')}>
              Create Account
            </Button>
            </div>
          </div>
       
    )}

  {showLoginForm && (
    <form onSubmit={handleSubmit}>
      <div className="form">
      
        
          <input
            type="text"
            name="username"
            value={AccInfo.username}
            onChange={handleChange}
            placeholder="Username"
            className="form-control"
          />
       
      
        
          <input
            type="password"
            name="password"
            value={AccInfo.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="form-control"
          />
  
      

        <div stlyes={{display: 'flex', flexDirection: 'row'}}>
        <Button 
        className="btn btn-primary"
        onClick={handleSubmit}>
        Login
        </Button>

        <Button 
        className="btn btn-secondary" 
        onClick={toggleLoginForm}>
        Cancel
        </Button>
      </div>
      </div>
    </form>
  )}
</div>

    );
  
};