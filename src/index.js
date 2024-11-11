import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserProvider } from './UserContext';
import WebSocketListener from './WebSocketListener';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>
     <UserProvider>
          
          <WebSocketListener /> 
          <App />

    </UserProvider>
  </React.StrictMode>
);

reportWebVitals();
