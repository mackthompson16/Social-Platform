import React from 'react';


export default function Home({currentUser}){
 
  return (
    <div>
     
      <h1>Welcome! {currentUser.username}</h1>
    </div>
  );
}
