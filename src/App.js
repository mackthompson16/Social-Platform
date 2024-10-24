import React, { useState } from 'react';
import CreateAccount from './createAccount';
import Login from './login';
import Home from './home';
import Schedule from './schedule';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Myapp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
   const renderPage = () => {
    switch (currentPage) {
      case 'CreateAccount':
        return <CreateAccount setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser}/>;
      case 'Home':
        return <Home currentUser={currentUser} setCurrentPage={setCurrentPage} />;
      case 'Schedule':
        return <Schedule current currentUser={currentUser} setCurrentUser={setCurrentUser} setCurrentPage={setCurrentPage}/>;
      case 'Friends':
        return <Friends currentUser={currentUser} setCurrentPage={setCurrentPage}/>;
      case 'Preferences':
        return <Preferences currentUser={currentUser} setCurrentUser={setCurrentUser} setCurrentPage={setCurrentPage} />;
      default:
        return <Login setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser} />;
    }
  };
  
  return (
  
        <div>
          {renderPage()} 
        </div>
      
  );
}

