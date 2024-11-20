import React, { useEffect } from 'react';
import { useUser } from './usercontext';

const WebSocketListener = () => {
    const { state, dispatch } = useUser();

    useEffect(() => {
    if (state.id !== null) {
      dispatch({
        type: 'REPLACE_CONTEXT',
        payload: { current_page: 'HOME'},
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
}

export default WebSocketListener;
