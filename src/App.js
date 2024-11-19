import React, {useEffect, useState} from 'react';
import { useUser } from './UserContext'; 
import Header from './header';
import Footer from './footer';
import Login from './login';
import Calendar from './calendar';
import './styles.css';

export default function App() {
  const { state, dispatch } = useUser(); 


  useEffect(() => {
    if (state.id !== null) {
      
      dispatch({
        type: 'SET_USER',
        payload: { isLoggedIn: true },
      });
     
      console.log('current state: ' , state)
    }
  }, [state.id]);
  

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000'); 
    
    socket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Client received:', data.message,'. I am ', state.id);
        if (data.type === 'inbox_update' && state.id === data.message.recipient_id) {
          console.log('updating inbox')
            
            dispatch({ type: 'UPDATE_INBOX', payload: data.message });
        }

        if (data.type === 'friend_update'){

           if (state.id === data.sender_id) {
         
                dispatch({
                  type: 'ADD_FRIEND',
                  payload: { id: data.recipient_id, username:data.recipient_username}
              });
            }
            if (state.id === data.recipient_id) {
        
              dispatch({
                type: 'ADD_FRIEND',
                payload: { id: data.sender_id, username:data.sender_username}
            });
          }
        }
        
        if (data.type === 'commitment_update' && (state.id === data.recipient_id || currentId === recipient_id)){
          dispatch ({
          type: 'SET_COMMITMENTS',
          payload: [...state.commitments, data.commitment]
          })
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return () => {
        socket.close();
    };
}, [state.id]);


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
