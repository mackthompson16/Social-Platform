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

    case 'REPLACE_CONTEXT':
      return {
        ...state,
        ...action.payload, 
      };
    
  
      case 'APPEND_CONTEXT':
        const [key] = Object.keys(action.payload); 
        return {
          ...state,
          [key]: [...state[key], action.payload[key]], 
        };
      
      

    case 'CLEAR_CONTEXT':
      return { ...initialState }; 
    
    case 'REMOVE_COMMITMENT':
      return {
        ...state,
        commitments: state.commitments.filter(c => Number(c.id) !== Number(action.payload))
      };

    case 'UPDATE_INBOX':
      return {
        ...state,
        inbox: state.inbox.map((message) =>
          Number(message.message_id) === Number(action.payload.message_id) ? action.payload : message
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
