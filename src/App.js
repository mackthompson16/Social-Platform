
import React, { useEffect, useRef } from 'react';

import { useUser } from './usercontext';

import Header from './header';
import Footer from './footer';
import Auth from './auth';
import SideMenu from './sideMenu';
import Calendar from './calendar';
import AddFriend from './addFriend';
import Profile from './profile';
import EventForm from './eventForm';
import WebSocketListener from './webSocketListener';
import Inbox from './inbox';

import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/buttons.css';
import './styles/inbox.css';
import './styles/typography.css';
import './styles/utilities.css';
import './styles/auth.css';
import './styles/addFriend.css';
import './styles/calendar.css';
import './styles/form.css';

export default function App() {
  const { state, dispatch } = useUser();

  const currentForm = {
    PROFILE: <Profile />,
    SCHEDULE_EVENT: <EventForm />,
    ADD_FRIEND: <AddFriend />,
  };

  const formRef = useRef(null);

  useEffect(() => {
    if (state.current_form === 'NONE') return undefined;

    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        dispatch({
          type: 'REPLACE_CONTEXT',
          payload: { current_form: 'NONE' },
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.current_form, dispatch]);

  return (
    <div className="app-shell">
      <WebSocketListener />
      <Header />

      {!state.id && (
        <main className="content-shell">
          <Auth />
        </main>
      )}

      {state.current_form !== 'NONE' && (
        <div className="form-container">
          <div ref={formRef} className="form-content">
            {currentForm[state.current_form]}
          </div>
        </div>
      )}

      {state.id && (
        <main className="content-shell">
          <div className="main-page">
            <SideMenu />
            <Calendar />
            {state.showMessages && <Inbox />}
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
