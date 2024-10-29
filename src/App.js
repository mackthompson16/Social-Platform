import React, { useState } from 'react';
import CreateAccount from './createAccount';
import Header from './header.js';
import Footer from './footer.js';
import Login from './login';
import Schedule from './schedule';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Myapp() {
  const [currentPage, setCurrentPage] = useState('Login');
  const [currentUser, setCurrentUser] = useState(null);
   const renderPage = () => {
    switch (currentPage) {
      case 'CreateAccount':
        return <CreateAccount setCurrentPage={setCurrentPage} setCurrentUser={setCurrentUser}/>;
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <main style={{ flexGrow: 1 }}>
    <Header setCurrentPage={setCurrentPage} />
      {renderPage()}
    </main>
    <Footer />
  </div>
      
  );
}

