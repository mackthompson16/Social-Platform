
import React, { useState } from 'react';
import { useUser } from './usercontext';
import generateEvents from './events';

export default function Auth() {
    const { dispatch } = useUser();
    const [AccInfo, setAccInfo] = useState({
      username: '',
      password: '',
      email: ''
    });

    const [createAccount, setCreateAccount] = useState(false);
   
    const handleChange = (event) => {
      const { name, value } = event.target;
      setAccInfo({
        ...AccInfo,
        [name]: value,
      });
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      if(createAccount){handleCreateAccount()} 
      else{
     
      
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
          const events = generateEvents(commitmentsData.rows)
          dispatch({
            type: 'REPLACE_CONTEXT',
            payload: { ...data, 
              commitments: commitmentsData.rows, 
              inbox: inboxData, 
              friends: [...friendsData, {id:data.id, username:data.username}],
              visibleEventKeys: {[data.id]:true}, 
              cachedEventArrays:{[data.id]:events},

            },
          });
        }
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    }
      // Reset the form
      setAccInfo({
        username: '',
        password: '',
        email: '',
      });
    };
    
    async function handleCreateAccount(){

      const response = await fetch('http://localhost:5000/api/auth/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(AccInfo),  
      });
      const data = await response.json(); 
      if (data.success) {
       
        console.log('Account created successfully:', data.id);
  
        dispatch({
          type: 'REPLACE_CONTEXT',
          payload: { id: data.id, ...AccInfo }
        });
      } else {
        alert('Account creation failed');
      }
 
    };
   
  
  
    return (
      <div>
    
    
       
    <div className="auth-form">
            <h1>Welcome</h1>
    
          <form onSubmit={handleSubmit}>
            <div className="auth-form">
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
      {createAccount && (
         <input
         type="email"
         id="email"
         name="email"
         value={AccInfo.email}
         onChange={handleChange}
         placeholder="Email"
         className="form-control"
     />
      )}
    
          
          <button 
            onClick={handleSubmit}>
            
            {createAccount ?'Create Account' : 'Login'}

          </button>
  
           
            </div>
          </form>

          {!createAccount && (
      <i>Don't have an account yet?
      <button 
                onClick={() => setCreateAccount(true)}>  
                Create Account
      </button>
      </i>
      )}
      
      </div>
      

      

    </div>
    );
  }    