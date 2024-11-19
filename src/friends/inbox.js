import React, {useState, useEffect} from 'react';
import { useUser } from '../UserContext'; 

export default function Inbox() {
    const { state, dispatch } = useUser(); 
    const [inbox, setInbox] = useState([]);
    const [loading, setLoading] = useState(false);
    // useEffect hook to watch for changes in state.inbox
    useEffect(() => {
      if (state.inbox ) {
        setInbox(state.inbox);
      }
    }, [state.inbox]);
  
   
    
    const handleActRequest = async (action, message) => {
            setLoading(true)
            try {
              const response = await fetch(`http://localhost:5000/api/social/${state.id}/${message.sender_id}/update-request`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request: message, action }), 
              });

              const req = (message.type === 'friend_request' ? 'friend' : 'meeting')
              await fetch(`http://localhost:5000/api/social/${state.id}/${message.sender_id}/send-message`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  type: 'message', 
                  content: `${state.username} ${action}ed your ${req} request` }), 
              });
        
              const data = await response.json();
              if (data.success && action === 'accept') {
               
                if(message.type === 'friend_request'){
                dispatch({
                  type: 'ADD_FRIEND',
                  payload: { id: message.sender_id, username: message.username }

                })
                if(message.type === 'meeting_request'){
                  dispatch({
                    type: 'ADD_COMMITMENT',

                    //parse message content as commitment
                    //this will not work as intended currently 

                    payload: message.content
                  })
                  
                }
              }
   
            }} catch (error) {
              console.error('Error with request:', error);
            }

          setLoading(false)
       
      };
  
    return (
      <div className="Messages-Menu">
        <h2>Inbox Messages</h2>
        {inbox && inbox.length > 0 ? (
           <ul>
           {inbox.map((message, index) => (
            
             <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                
                 <p>
                    {message.content}

                    {message.type === 'friend_request' || message.type === 'meeting_request' ? (
                      message.status === 'unread' || loading ? (
                        <div>
                          <button onClick={() => handleActRequest('accept',message)}>Accept</button>
                          <button onClick={() => handleActRequest('reject',message)}>Reject</button>
                        </div>
                      ) : message.status === 'accepted' ? (
                          `...accepted`
                      ) : `...rejected`
                    ) :   ''}

                  </p>

               </div>
             </li>
           ))}
         </ul>
        ) : (
          <p>No messages available.</p>
        )}
      </div>
    );
  }
  