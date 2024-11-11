import React from 'react';
import { useUser } from './UserContext'; // Correct path
import Header from './header';
import Footer from './footer';
import Login from './login';
import Calendar from './calendar';

export default function MyApp() {
  const { state } = useUser(); // Now `useUser` has access to the context

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flexGrow: 1 }}>
        <Header />
        {!state.isLoggedIn && <Login />}
        {state.isLoggedIn && <Calendar />}
      </main>
      <Footer />
    </div>
  );
}
