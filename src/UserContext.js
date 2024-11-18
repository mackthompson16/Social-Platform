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
  users: []           
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
        inbox: action.payload.inbox || [],
        friends: action.payload.friends || [],
        users: action.payload.users || []
      };

    case 'LOAD_SOCIAL':
      return {
        ...state, 
        friends: action.payload.friends || [], 
        users: action.payload.users || []
      };

    case 'LOGOUT_USER':
      return { ...initialState }; // Reset to initial state on logout
    
    case 'UPDATE_DATA':
      return { 
        ...state, 
        data: { ...state.data, username: action.payload } 
      };
    
    case 'ADD_COMMITMENT':
      return {
        ...state,
        commitments: [...state.commitments, action.payload]
      };
    
    case 'SET_COMMITMENTS':
      return { 
        ...state, 
        commitments: action.payload 
      };
    
    case 'REMOVE_COMMITMENT':
      return {
        ...state,
        commitments: state.commitments.filter(c => c.id !== action.payload)
      };

      case 'ADD_SENT':
      return {
        ...state,
        sent: [...state.sent, action.payload]
      };

    case 'UPDATE_INBOX':
      return { 
        ...state, 
        inbox: [...state.inbox, action.payload]
      };

    case 'LOAD_USERS':
      return { 
        ...state, 
        users: action.payload 
      };

    case 'ADD_FRIEND':
      return {
        ...state, 
        friends: [...state.friends, action.payload]
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
