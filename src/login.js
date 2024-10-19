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
        setCurrentUser(data.user);  // Set the user state in React
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
  
    const containerStyle = {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
    };

    const formStyle = {
      width: '300px',
      padding: '20px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      borderRadius: '10px',
    };
  
    const inputStyle = {
      width: '100%',
      padding: '10px',
      marginBottom: '15px',
      borderRadius: '5px',
      border: '1px solid #ccc',
      fontSize: '16px',
    };
  
    const labelStyle = {
      marginBottom: '10px',
      fontWeight: 'bold',
    };
  
    const buttonStyle = {
      width: '150px',
      padding: '10px',
      marginBottom: '10px',
    };

    const formButtonContainer = {

      display: 'flex',
      justifyContent: 'center',
      padding: '10px',
      gap: '10px',
      marginTop: '20px',

    };

    const formButtonStyle = {

      width: '100px'
    }

  
  
    return (
      <div style={containerStyle}>
        
  
        {!showLoginForm && (
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button style={buttonStyle} variant="outline-primary" onClick={toggleLoginForm}>Login</Button>
            <Button style={buttonStyle} variant="outline-primary" onClick={() => setCurrentPage('CreateAccount')}>Create Account</Button>
          </div>
        )}
  
        {showLoginForm && (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div>
              <label style={labelStyle}>
                Username
                <input
                  type="text"
                  name="username"
                  value={AccInfo.username}
                  onChange={handleChange}
                  placeholder="Required Field"
                  required
                  style={inputStyle}
                />
              </label>
            </div>
            <div>
              <label style={labelStyle}>
                Password
                <input
                  type="password"
                  name="password"
                  value={AccInfo.password}
                  onChange={handleChange}
                  placeholder="Required Field"
                  required
                  style={inputStyle}
                />
              </label>
            </div>
            <div style={formButtonContainer}>
              <Button style={formButtonStyle} variant="outline-primary" type="submit">Login</Button>
              <Button style={formButtonStyle} variant="outline-primary" onClick={toggleLoginForm}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    );
  
};