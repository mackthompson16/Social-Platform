import React, { useEffect } from 'react';
import { useUser } from './usercontext';
import generateEvents from './events';
import { WS_BASE_URL } from './config';
const WebSocketListener = () => {
    const { state, dispatch } = useUser();

    useEffect(() => {
      
     
    if (state.id !== null) {
      const events = generateEvents(state.commitments)
      dispatch({
        type: 'REPLACE_CONTEXT',
        payload: { current_page: 'HOME',
          
                  
        },
      
      });
      
      dispatch({
        type: 'APPEND_CONTEXT',
        payload: {

          friends: [{id:state.id, username:state.username}],
          cachedEventArrays: {[state.id]:events},
          visibleEventKeys: {[state.id]:true},
        }

      })
      
     
      console.log('current state: ' , state)

    const socket = new WebSocket(WS_BASE_URL); 
   
    socket.onopen = () => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({type:'login', id: state.id}));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Client received:', data);
        
       

            if (data.type === 'message' ) {
              console.log('adding message to inbox')
                
                dispatch({ type: 'APPEND_CONTEXT', payload: {inbox:[data.message]} });
            }
            if (data.type === 'inbox_update') {
              console.log('updating inbox')
              dispatch({type:'UPDATE_INBOX', payload: data.message})
            }

            if (data.type === 'friend_update'){
            
                  dispatch({
                    type: 'APPEND_CONTEXT',
                    payload: {friends: [{ id: Number(data.recipient_id), username:data.recipient_username}]}
                });
              }
            
            
            if (data.type === 'commitment_update'){
              dispatch ({
              type: 'UPDATE_COMMITMENT',
              payload: data.commitment
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
