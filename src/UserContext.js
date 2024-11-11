const initialState = { 
  id: null, 
  data: {}, 
  isLoggedIn: false,
  sent: [],           
  inbox: []           
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        id: action.payload.id,
        username: action.payload.username,
        email: action.payload.email,
        password: action.payload.password,
        commitments: action.payload.commitments || [],
        isLoggedIn: true,
        friends: action.payload.friends || [],   // Initialize friends from payload if present
        sent: action.payload.sent || [],         // Initialize sent requests from payload if present
        inbox: action.payload.inbox || []        // Initialize inbox from payload if present
      };
    case 'LOGOUT_USER':
      return { ...initialState }; // Reset to initial state on logout
    
    case 'UPDATE_DATA':
      return { ...state, data: { ...state.data, username: action.payload } };
    
    case 'ADD_COMMITMENT':
      return {
        ...state,
        data: { ...state.data, commitments: [...state.data.commitments, action.payload] }
      };
    
    case 'SET_COMMITMENTS':
      return { ...state, commitments: action.payload };
    
    case 'REMOVE_COMMITMENT':
      return {
        ...state,
        data: {
          ...state.data,
          commitments: state.data.commitments.filter(c => c.id !== action.payload)
        }
      };

    // New cases for social features
    case 'ADD_FRIEND':
      return {
        ...state,
        friends: [...state.friends, action.payload]
      };

    case 'ADD_SENT':
      return {
        ...state,
        sent: [...state.sent, action.payload]
      };

      
      case 'UPDATE_INBOX':
        return { ...state, inbox: action.payload };
  
      case 'UPDATE_USERS':
        return { ...state, users: action.payload };

    default:
      return state;
  }
};

// Example action to update sent requests in handleRequest
const handleRequest = async (recipient_id) => {
  try {
    const response = await fetch(`/api/users/${state.id}/${recipient_id}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'friend_request',
        content: 'Friend request sent'
      })
    });

    const result = await response.json();
    if (result.success) {
      dispatch({ type: 'ADD_SENT_REQUEST', payload: recipient_id }); // Update sent requests in context
      console.log(state.id, 'requested', recipient_id);
    } else {
      console.error('Failed to send friend request:', result.message);
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
  }
};
