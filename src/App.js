import React, {useEffect} from 'react';
import { useUser } from './UserContext'; 
import Header from './header';
import Footer from './footer';
import Login from './login';
import Calendar from './calendar';
import './styles.css';

export default function App() {
  const { state, dispatch } = useUser(); 

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000'); 
    
    socket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
      
        if (data.type === 'inbox_update') {
            console.log('Updating inbox state with new data:', data);
            dispatch({ type: 'UPDATE_INBOX', payload: data.data });
        }

        if (data.type === 'friend_update' && state.id == data.data.recipient_username) {
          console.log('adding new friend ,', sender_username);

          dispatch({
            type: 'ADD_FRIEND',
            payload: { id: data.data.sender_id, username:data.data.sender_username}
        });
      }

    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return () => {
        socket.close();
    };
}, []);


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
