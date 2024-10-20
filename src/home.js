import React from 'react';
import Header from './header.js';
import Footer from './footer.js';

export default function Home({currentUser, setCurrentPage}){
  const appStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  const contentStyle = {
    flex: 1, 
    padding: '20px',
  };

  return (
    <div style={appStyle}>
      <div style={contentStyle}>
      <Header setCurrentPage = {setCurrentPage} />
      <h1>Login Success, {currentUser.username}.</h1>
      <Footer />

      </div>
    </div>
  );
}
