
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
  const [mobileTab, setMobileTab] = useState('calendar');
  const [menuOpen, setMenuOpen] = useState(false);

  const currentForm = {
    PROFILE: <Profile />,
    SCHEDULE_EVENT: <EventForm mode="create" />,
    EDIT_EVENT: <EventForm mode="edit" event={state.editingEvent} />,
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
    document.body.classList.add('modal-open');
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.current_form, dispatch]);

  useEffect(() => {
    if (state.current_form === 'NONE') {
      document.body.classList.remove('modal-open');
    }
  }, [state.current_form]);

  useEffect(() => {
    if (!menuOpen || state.current_form !== 'NONE') return undefined;

    const handleClickAway = (event) => {
      const target = event.target;
      if (!target) return;
      if (target.closest('.side-menu-container')) return;
      if (target.closest('.header-menu-toggle')) return;
      setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [menuOpen, state.current_form]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 800) {
        setMobileTab('calendar');
        setMenuOpen(false);
        setAiPanelOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-shell">
      <WebSocketListener />
      <Header onToggleMenu={() => setMenuOpen((prev) => !prev)} menuOpen={menuOpen} />

      {!state.id && (
        <main className="content-shell">
          <Auth />
        </main>
      )}

      {state.current_form !== 'NONE' && (
        <div className="form-container">
          <div ref={formRef} className="form-content">
            <button
              type="button"
              className="form-close"
              onClick={() =>
                dispatch({
                  type: 'REPLACE_CONTEXT',
                  payload: { current_form: 'NONE' },
                })
              }
              aria-label="Close form"
            >
              ×
            </button>
            {currentForm[state.current_form]}
          </div>
        </div>
      )}

      {state.id && (
        <main className="content-shell">
          <div className={`main-page mobile-tab-${mobileTab} ${menuOpen ? 'menu-open' : ''}`}>
            <SideMenu isOpen={menuOpen} />
            <div className="primary-main">
              <Calendar />
            </div>
            <AiPlannerPanel isOpen={aiPanelOpen} onToggle={setAiPanelOpen} />
          </div>
        </main>
      )}

      <Footer
        activeTab={mobileTab}
        onTabChange={(tab) => {
          setMobileTab(tab);
          setMenuOpen(false);
          if (tab === 'chat') {
            setAiPanelOpen(true);
          } else if (tab !== 'chat') {
            setAiPanelOpen(false);
          }
        }}
      />
    </div>
  );
}
