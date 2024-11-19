
import React, { useState } from 'react';
import { useUser } from './UserContext';
import CreateAccount from './createAccount';

export default function Login() {
    const {state, dispatch } = useUser();
    const [AccInfo, setAccInfo] = useState({
      username: '',
      password: '',
    });

    const [showCreateAccount, setShowCreateAccount] = useState(false);
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
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(AccInfo),
      });
    
      const data = await response.json();
     
      try {
      
        if (data.success) {
    
          const commitmentsResponse = await fetch(`http://localhost:5000/api/users/${data.id}/get-commitments`);
          const inboxResponse = await fetch(`http://localhost:5000/api/social/${data.id}/get-messages`);
          const friendsResponse = await fetch(`http://localhost:5000/api/social/${data.id}/get-friends`);
      
          if (!commitmentsResponse.ok || !inboxResponse.ok || !friendsResponse.ok) {
            throw new Error('Failed to fetch user data');
          }
      
          const commitmentsData = await commitmentsResponse.json();
          const inboxData = await inboxResponse.json();
          const friendsData = await friendsResponse.json();
          
          dispatch({
            type: 'SET_USER',
            payload: { ...data, commitments: commitmentsData.rows, inbox: inboxData, friends: friendsData },
          });
        }
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    
      // Reset the form
      setAccInfo({
        username: '',
        password: '',
      });
    };
    

   
  
  
    return (
      <div className="form">
    
        {showCreateAccount && <CreateAccount />}
    
        {!showLoginForm && !showCreateAccount && (
          <div className="form">
            <h1>Welcome</h1>
    
            <div className="button-container">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowLoginForm(true)}>  
                Login
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateAccount(true)}>  
                Create Account
              </button>
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
    
              <div className="button-container">
                <button 
                  className="btn btn-primary" 
                  onClick={handleSubmit}>
                  Login
                </button>
    
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowLoginForm(false)}> 
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    );
  }    