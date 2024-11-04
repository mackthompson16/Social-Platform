import React, { createContext, useReducer, useContext } from 'react';


const initialState = { id: null, data: {}, isLoggedIn: false };
const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      console.log(action.payload)
       return {
        ...state,
        id: action.payload.id,
        username: action.payload.username,
        email: action.payload.email,
        password: action.payload.password,
        commitments: action.payload.commitments || [],
        isLoggedIn: true,
      };
    case 'LOGOUT_USER':
      return { ...initialState }; // Reset to initial state on logout
    case 'UPDATE_USERNAME':
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
