import React from 'react';
import CreateAccount from './createAccount';
import Login from './login';
export default function Myapp(){
  return (
    <div>
      <h1>My Social Media</h1>
      <CreateAccount/>
      <Login/>
    </div>
  );
}
