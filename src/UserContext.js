import React, { createContext, useReducer, useContext } from 'react';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const initialState = { 
  id: null, 
  username: null,
  email: null,
  password: null,
  commitments: [],   
  isLoggedIn: false,
  sent: [],           
  inbox: [],          
  friends: [],    
  users: [],

};

const userReducer = (state, action) => {
  switch (action.type) {

      case 'REPLACE_CONTEXT': // Use this for setting or replacing data
        return {
          ...state,
          ...action.payload, // Replace matching keys in state with payload values
        };
  
      case 'APPEND_CONTEXT': // Use for appending new data to arrays
        return {
          ...state,
          ...Object.keys(action.payload).reduce((updated, key) => {
            updated[key] = Array.isArray(state[key])
              ? [...state[key], ...action.payload[key]] // Append to array
              : state[key]; // Ignore non-array keys
            return updated;
          }, {}),
        }

    case 'CLEAR_CONTEXT':
      return { ...initialState }; 
    
    case 'REMOVE_COMMITMENT':
      return {
        ...state,
        commitments: state.commitments.filter(c => c.id !== action.payload)
      };

    case 'UPDATE_INBOX':
      return {
        ...state,
        inbox: state.inbox.map((message) =>
          message.message_id === action.payload.message_id ? action.payload : message
        ),
      };

    default:
      return state;
  }
};


export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
