import React, { useState } from 'react';
import CreateAccount from './createAccount';
import Login from './login';
import Home from './home';

export default function Myapp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
   const renderPage = () => {
    switch (currentPage) {
      case 'CreateAccount':
        return <CreateAccount />;
      case 'Home':
        return <Home currentUser={currentUser}/>;
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

