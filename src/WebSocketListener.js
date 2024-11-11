import React, { useEffect } from 'react';
import { useUser } from './UserContext';

export default function WebSocketListener() {
  const { state, dispatch } = useUser();

  useEffect(() => {
    // Connect to WebSocket server
    const socket = new WebSocket('ws://localhost:4000');

    // Listen for incoming messages
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'inbox_update':
          // Update inbox data in the context
          dispatch({ type: 'UPDATE_INBOX', payload: data.inbox });
          break;

        case 'user_update':
          // Update users list in the context
          dispatch({ type: 'UPDATE_USERS', payload: data.users });
          break;

        default:
          console.warn('Unknown WebSocket message type:', data.type);
      }
    };

    // Handle WebSocket errors and cleanup on unmount
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [dispatch]);

  return null; // Component doesn't render anything
}
