import React, { useState } from 'react';
import CreateAccount from './createAccount';
import Login from './login';
import Home from './home';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Myapp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
   const renderPage = () => {
    switch (currentPage) {
      case 'CreateAccount':
        return <CreateAccount setCurrentPage={setCurrentPage}/>;
      case 'Home':
       
        return <Home currentUser={currentUser} setCurrentPage={setCurrentPage} />;
      default:
        return <Login setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser} />;
    }
  };
  const appStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  const contentStyle = {
    flex: 1,  // This makes the content grow to fill available space
    padding: '20px',
  };

  return (
    <div style={appStyle}>
      <div style={contentStyle}>
        <div>
          {renderPage()} 
        </div>
      </div>
    </div>
  );
}

