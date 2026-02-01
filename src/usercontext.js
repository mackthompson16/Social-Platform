import React, { createContext, useReducer, useContext } from 'react';
import generateEvents from './events';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const initialState = { 
  id: null, 
  username: null,
  password: null,
  current_form: 'NONE',
  commitments: [],   
  sent: [],           
  inbox: [],          
  friends: [],    
  users: [],
  systemAgent: null,
  editingCommitment: null,
  visibleEventKeys: {}, 
  cachedEventArrays: {}

};

const userReducer = (state, action) => {
  switch (action.type) {

    case 'REPLACE_CONTEXT':

      return {
        ...state,
        ...action.payload, 
      };
    
      
    case 'APPEND_CONTEXT': {
      const updatedState = { ...state };

      const mergeByKey = (existing = [], incoming = [], key) => {
        const map = new Map(existing.map((item) => [item[key], item]));
        incoming.forEach((item) => {
          if (item && item[key] !== undefined && item[key] !== null) {
            map.set(item[key], item);
          }
        });
        return Array.from(map.values());
      };

      Object.keys(action.payload).forEach((key) => {
        if (key === 'visibleEventKeys' || key === 'cachedEventArrays') {
          updatedState[key] = {
            ...state[key],
            ...action.payload[key],
          };
        } else if (Array.isArray(state[key])) {
          if (key === 'friends') {
            updatedState[key] = mergeByKey(state[key], action.payload[key], 'id');
          } else if (key === 'inbox') {
            updatedState[key] = mergeByKey(state[key], action.payload[key], 'message_id');
          } else {
            updatedState[key] = [...state[key], ...action.payload[key]];
          }
        } else {
          updatedState[key] = [...(state[key] || []), ...action.payload[key]];
        }
      });

      return updatedState;
    }
    
    
    
    
    
    case 'CLEAR_CONTEXT':
      return { ...initialState }; 
    
    case 'MARK_INBOX_READ':
      return {
        ...state,
        inbox: state.inbox.map((m) => ({ ...m, status: 'read' })),
      };
    
    case 'ADD_COMMITMENT':
      
        const newCommitment = action.payload;     
        const stampedCommitment = { ...newCommitment, user_id: newCommitment.user_id || state.id };
        const newEvents = generateEvents([stampedCommitment]);

        return {
            ...state,
           
            cachedEventArrays: {
                ...state.cachedEventArrays, 
                [state.id]: [
                    ...(state.cachedEventArrays[state.id] || []), 
                    ...newEvents 
                ]
            },
    
            commitments: [...state.commitments, stampedCommitment],
        
          
        };

    case 'UPDATE_COMMITMENT': {
        const updated = action.payload;
        const stamped = { ...updated, user_id: updated.user_id || state.id };
        const newEvents = generateEvents([stamped]);
        const userId = stamped.user_id || state.id;
        const filteredEvents = (state.cachedEventArrays[userId] || []).filter(
            (event) => Number(event.commitment_id) !== Number(stamped.commitment_id)
        );
        return {
            ...state,
            cachedEventArrays: {
                ...state.cachedEventArrays,
                [userId]: [...filteredEvents, ...newEvents],
            },
            commitments: state.commitments.some(
                (commitment) => Number(commitment.commitment_id) === Number(stamped.commitment_id)
            )
                ? state.commitments.map((commitment) =>
                    Number(commitment.commitment_id) === Number(stamped.commitment_id)
                        ? stamped
                        : commitment
                  )
                : [...state.commitments, stamped],
        };
    }
    
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
        inbox: state.inbox.some(
          (message) => Number(message.message_id) === Number(action.payload.message_id)
        )
          ? state.inbox.map((message) =>
              Number(message.message_id) === Number(action.payload.message_id)
                ? action.payload
                : message
            )
          : [...state.inbox, action.payload],
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
