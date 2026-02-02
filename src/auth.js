
import React, { useState } from 'react';
import { useUser } from './usercontext';
import { API_BASE_URL } from './config';

export default function Auth() {
    const { dispatch } = useUser();
    const [AccInfo, setAccInfo] = useState({
      username: '',
      password: ''
    });

    const [createAccount, setCreateAccount] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const demoCredentials = { username: 'demo', password: 'demo' };
   
    const handleChange = (event) => {
      const { name, value } = event.target;
      setAccInfo({
        ...AccInfo,
        [name]: value,
      });
    };
  
    const loadUserContext = async (data) => {
      const eventsResponse = await fetch(`${API_BASE_URL}/api/users/${data.id}/get-events`);
      const inboxResponse = await fetch(`${API_BASE_URL}/api/social/${data.id}/get-messages`);
      const friendsResponse = await fetch(`${API_BASE_URL}/api/social/${data.id}/get-friends`);
      const agentResponse = await fetch(`${API_BASE_URL}/api/social/system-agent`);

      if (!eventsResponse.ok || !inboxResponse.ok || !friendsResponse.ok || !agentResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      const eventsData = await eventsResponse.json();
      const inboxData = await inboxResponse.json();
      const friendsData = await friendsResponse.json();
      const agentData = await agentResponse.json();

      dispatch({
        type: 'REPLACE_CONTEXT',
        payload: {
          ...data,
          events: eventsData.rows,
          inbox: inboxData,
          friends: friendsData,
          systemAgent: agentData.agent,
        },
      });
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      setError('');
      setNotice('');
      if (createAccount) {
        handleCreateAccount();
      } 
      else{
     
      if (!AccInfo.username || !AccInfo.password) {
        setError('Username and password are required');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(AccInfo),
      });
    
      const data = await response.json();
     
      try {
      
        if (data.success) {
          await loadUserContext(data);
        } else {
          if (data.error === 'username') {
            setCreateAccount(true);
            setNotice('No account found for that username. Create one below.');
          } else if (data.error === 'password') {
            setError('Wrong password');
          } else {
            setError('Login failed');
          }
        }
      } catch (error) {
        console.error('Error loading user context:', error);
        setError('Login failed');
      }
    }
      // Reset the form
      setAccInfo({
        username: '',
        password: '',
      });
    };
    
    async function handleCreateAccount(){
      setError('');
      setNotice('');
      if (!AccInfo.username || !AccInfo.password) {
        setError('Username and password are required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: AccInfo.username, password: AccInfo.password }),  
      });
      const data = await response.json(); 
      if (data.success) {
       
        console.log('Account created successfully:', data.id);
        try {
          await loadUserContext({ id: data.id, ...AccInfo });
        } catch (err) {
          console.error('Error loading new user context:', err);
          dispatch({
            type: 'REPLACE_CONTEXT',
            payload: { id: data.id, ...AccInfo, systemAgent: null }
          });
        }
      } else {
        setError(data.message || 'Account already exists');
      }
 
    };

    async function handleDemoLogin() {
      setError('');
      setNotice('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(demoCredentials),
        });
        const data = await response.json();
        if (!data.success) {
          setError('Demo account unavailable');
          return;
        }
        await loadUserContext(data);
      } catch (err) {
        console.error('Demo login failed', err);
        setError('Demo login failed');
      }
    }
   
   
  
    return (
      <div className="auth">
        <div className="auth-container">
          <h2 className="auth-title">Welcome to WeCal</h2>
          <p className="auth-subtitle">Plan events, invite friends, and chat in one place.</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-buttons">
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
              
              {error && <div className="auth-error">{error}</div>}
              {notice && !error && <div className="auth-note">{notice}</div>}
            </div>
    
            <div className={`button-container ${createAccount ? 'split' : 'stacked'}`}>

              <button type="submit" className="btn btn-primary">
                {createAccount ? 'Create Account' : 'Login'}
              </button>
              {!createAccount && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDemoLogin}
                >
                  Demo
                </button>
              )}
              
              {createAccount && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreateAccount(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
    
          {!createAccount && (
            <div className="auth-footer">
              <i>Don’t have an account yet?</i>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => setCreateAccount(true)}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    );
    
  }    
