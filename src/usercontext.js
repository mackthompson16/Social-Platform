import React, { createContext, useReducer, useContext } from 'react';
import generateEvents from './events';
const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const initialState = { 
  id: null, 
  username: null,
  password: null,
  current_form: 'NONE',
  events: [],   
  sent: [],           
  inbox: [],          
  friends: [],    
  users: [],
  systemAgent: null,
  editingEvent: null,
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
    
    case 'ADD_EVENT':
      
        const newEvent = action.payload;     
        const stampedEvent = { ...newEvent, user_id: newEvent.user_id || newEvent.userId || state.id };
        const newEvents = generateEvents([stampedEvent]);

        return {
            ...state,
           
            cachedEventArrays: {
                ...state.cachedEventArrays, 
                [state.id]: [
                    ...(state.cachedEventArrays[state.id] || []), 
                    ...newEvents 
                ]
            },
    
            events: [...state.events, stampedEvent],
        
          
        };

    case 'UPDATE_EVENT': {
        const updated = action.payload;
        const stamped = { ...updated, user_id: updated.user_id || updated.userId || state.id };
        const newEvents = generateEvents([stamped]);
        const userId = stamped.user_id || state.id;
        const filteredEvents = (state.cachedEventArrays[userId] || []).filter(
            (event) => String(event.eventId) !== String(stamped.eventId)
        );
        return {
            ...state,
            cachedEventArrays: {
                ...state.cachedEventArrays,
                [userId]: [...filteredEvents, ...newEvents],
            },
            events: state.events.some(
                (eventItem) => String(eventItem.eventId) === String(stamped.eventId)
            )
                ? state.events.map((eventItem) =>
                    String(eventItem.eventId) === String(stamped.eventId)
                        ? stamped
                        : eventItem
                  )
                : [...state.events, stamped],
        };
    }
    
    case 'REMOVE_EVENT':
      const eventId = String(action.payload);
        return {
            ...state,
            cachedEventArrays: {
                ...state.cachedEventArrays, 
                [state.id]: state.cachedEventArrays[state.id].filter(
                    event => String(event.eventId) !== eventId
                )
            },
            events: state.events.filter(
                eventItem => String(eventItem.eventId) !== eventId
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
