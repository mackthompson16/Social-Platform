import React from 'react';
import Header from 'header.js';
import Footer from 'footer.js'

export default function Home({currentUser}, setCurrentPage){
 
  return (
    <div>
      <Header setCurrentPage = {setCurrentPage} />
      <h1>Login Success, {currentUser.username}.</h1>
      <Footer />


    </div>
  );
}
