import React, { useState, useEffect } from 'react';
import { useUser } from '../UserContext'; // Import your UserContext hook

export default function Messages() {
  const { state } = useUser(); // Access the user context to get the ID
  const [messages, setMessages] = useState([]);

 
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/${state.id}/get-messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.friends); // Set the inbox messages from the response
      } else {
        console.error('Failed to load messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };


  return (
 
        <div>
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div key={index} className="message-item">
                <p>{msg.content}</p>
              </div>
            ))
          ) : (
            <p>No new messages</p>
          )}
        </div>

  );
}
