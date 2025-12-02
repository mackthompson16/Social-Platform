
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

  const current_form = {
    PROFILE: <Profile />,
    SCHEDULE_EVENT: <EventForm />,
    ADD_FRIEND: <AddFriend />,
  };

  const formRef = useRef(null);

  useEffect(() => {
    if (state.current_form !== 'NONE') {
      console.log(`[DEBUG] current_form is active: ${state.current_form}`);

    
      const handleClickOutside = (event) => {
        console.log(`[DEBUG] Click detected. Event target:`, event.target);

        if (formRef.current) {
          console.log(`[DEBUG] formRef.current:`, formRef.current);

          if (!formRef.current.contains(event.target)) {
            console.log(`[DEBUG] Clicked outside the form. Dispatching REPLACE_CONTEXT.`);
            dispatch({
              type: 'REPLACE_CONTEXT',
              payload: { current_form: 'NONE' },
            });
          } else {
            console.log(`[DEBUG] Clicked inside the form. No action taken.`);
          }
        } else {
          console.log(`[DEBUG] formRef.current is null. Cannot determine click location.`);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      console.log(`[DEBUG] mousedown listener added.`);

      // Cleanup listener when the form is hidden
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        console.log(`[DEBUG] mousedown listener removed.`);
      };
    } else {
      console.log(`[DEBUG] current_form is NONE. No listener added.`);
    }
  }, [state.current_form, dispatch]); // Re-run whenever `state.current_form` changes

  return (
    <div>
      <WebSocketListener />
      <Header />

      {!state.id && <Auth />}

  
      {state.current_form !== 'NONE' && (
        <div className="form-container">
          <div ref={formRef} className="form-content">
          {current_form[state.current_form]}
          </div>
        </div>
      )}

      {state.id && (
        <div className="main-page">
          <SideMenu />
          <Calendar />
          {state.showMessages && <Inbox />}
        </div>
      )}

      <Footer />
    </div>
  );
}
