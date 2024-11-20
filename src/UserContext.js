import React, { createContext, useReducer, useContext } from 'react';
import generateEvents from './events';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const initialState = { 
  id: null, 
  username: null,
  email: null,
  password: null,
  current_page: 'AUTH',
  commitments: [],   
  sent: [],           
  inbox: [],          
  friends: [],    
  users: [],
  visibleEventKeys: {}, 
  cachedEventArrays: {},
  showMessages: false

};

const userReducer = (state, action) => {
  switch (action.type) {

    case 'REPLACE_CONTEXT':
      return {
        ...state,
        ...action.payload, 
      };
    
  
      case 'APPEND_CONTEXT': {
        const [key] = Object.keys(action.payload);
        if (key === 'visibleEventKeys' || key === 'cachedEventArrays') {
          //for set objects
            return {
                ...state,
                [key]: {
                    ...state[key],
                    ...action.payload[key],
                },
            };
        }
       
        

        //for array objects

          return {
            ...state,
            [key]: [...state[key], action.payload[key]], 
        };
      }
      
      
    
    case 'CLEAR_CONTEXT':
      return { ...initialState }; 
    
    case 'ADD_COMMITMENT':
      
        const newCommitment = action.payload;     
        const newEvents = generateEvents([newCommitment]);

        return {
            ...state,
           
            cachedEventArrays: {
                ...state.cachedEventArrays, 
                [state.id]: [
                    ...(state.cachedEventArrays[state.id] || []), 
                    ...newEvents 
                ]
            },
    
            commitments: [...state.commitments, newCommitment],
        
          
        };
    
    case 'REMOVE_COMMITMENT':
      const commitment_id = Number(action.payload);
        return {
            ...state,
            cachedEventArrays: {
                ...state.cachedEventArrays, 
                [state.id]: state.cachedEventArrays[state.id].filter(
                    event => Number(event.commitment_id) !== commitment_id
                )
            },
            commitments: state.commitments.filter(
                commitment => Number(commitment.commitment_id) !== commitment_id
            )
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
