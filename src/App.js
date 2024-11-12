import React, {useEffect} from 'react';
import { useUser } from './UserContext'; 
import Header from './header';
import Footer from './footer';
import Login from './login';
import Calendar from './calendar';
import './styles.css';

export default function App() {
  const { state, dispatch } = useUser(); 

  
// get the inbox working for friend requests and messages
// make the logic work for accepting pending requests
// schedule meeting logic
// display multiple schedules on top of each other
// unique id for event blocks to prevent constant re-rendering
// play with UI, latency, and CSS
// rigorous testing
// done!


    useEffect(() => {
        const socket = new WebSocket('ws://localhost:4000'); 

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'inbox_update') {
                // Dispatch the inbox update action with the payload from the server
                dispatch({ type: 'UPDATE_INBOX', payload: data.inbox });
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socket.close();
        };
    }, [dispatch]);


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
