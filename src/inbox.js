import React, {useState, useEffect} from 'react';
import { useUser } from './usercontext'; 

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
                //recipient is the sender to keep consistent (they're the original request recipient)
                body: JSON.stringify({ request: message, action, recipient_username: state.username }), 
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
                  type: 'APPEND_CONTEXT',
                  payload: { friends: {id: message.sender_id, username: message.content.split(' ')[0]} }

                })
                if(message.type === 'meeting_request'){
                  dispatch({
                    type: 'APPEND_CONTEXT',

                    //parse message content as commitment
                    //this will not work as intended currently 

                    payload: {commitments: message.content}
                  })
                  
                }
              }
   
            }} catch (error) {
              console.error('Error with request:', error);
            }

          setLoading(false)
       
      };
  
    return (
      <div className="inbox">
        <h2>Inbox</h2>
        {inbox && inbox.length > 0 ? (
           <ul>
           {inbox.map((message, index) => (
            
             <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                
                 <p>{message.content}</p>

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
  