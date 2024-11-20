import React, {useEffect, useState} from 'react';
import { useUser } from './UserContext'; 
import Header from './header';
import Footer from './footer';
import Login from './login';
import Calendar from './calendar';
import './styles.css';
export default function App() {
  const { state, dispatch } = useUser(); 

// websocket communication (might move this out of app.js eventually)
  useEffect(() => {

    if (state.id !== null) {
      dispatch({
        type: 'REPLACE_CONTEXT',
        payload: { isLoggedIn: true},
      });

     
      console.log('current state: ' , state)

    const socket = new WebSocket('ws://localhost:5000'); 
   
    socket.onopen = () => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({type:'login', id: state.id}));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Client received:', data);
        
       

            if (data.type === 'message' ) {
              console.log('adding message to inbox')
                
                dispatch({ type: 'APPEND_CONTEXT', payload: {inbox:data.message} });
            }
            if (data.type === 'inbox_update') {
              console.log('updating inbox')
              dispatch({type:'UPDATE_INBOX', payload: data.message})
            }

            if (data.type === 'friend_update'){
            
                  dispatch({
                    type: 'APPEND_CONTEXT',
                    payload: {friends: { id: data.recipient_id, username:data.recipient_username}}
                });
              }
            
            
            if (data.type === 'commitment_update'){
              dispatch ({
              type: 'APPEND_CONTEXT',
              payload: {commitments: data.commitment}
              })
            }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return () => {
        socket.close();
    };
}}, [state.id]);


if (state.loading) {
  return <div>Loading...</div>; 
}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flexGrow: 1 }}>
        <Header />
        {!state.isLoggedIn && <Login />}
        {state.isLoggedIn && <Calendar />}
      </main>
      <Footer />
    </div>
  );
}
