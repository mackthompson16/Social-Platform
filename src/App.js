
import React, { useEffect, useRef, useState } from 'react';

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
import AiPlannerPanel from './aiPlannerPanel';

import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/buttons.css';
import './styles/typography.css';
import './styles/utilities.css';
import './styles/auth.css';
import './styles/addFriend.css';
import './styles/calendar.css';
import './styles/form.css';
import './styles/aiPlanner.css';

export default function App() {
  const { state, dispatch } = useUser();
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  const currentForm = {
    PROFILE: <Profile />,
    SCHEDULE_EVENT: <EventForm mode="create" />,
    EDIT_EVENT: <EventForm mode="edit" commitment={state.editingCommitment} />,
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
            <div className="primary-main">
              <Calendar />
            </div>
            <AiPlannerPanel isOpen={aiPanelOpen} onToggle={setAiPanelOpen} />
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
