import React from 'react';
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

export default function App() {
  const {state} = useUser(); 


const pageComponents = {
  PROFILE: <Profile />,
  SCHEDULE_EVENT: <EventForm />,
  ADD_FRIEND: <AddFriend />,
  HOME: <Calendar/>
};

  return (
    <div>

          <WebSocketListener />
          <Header />
          
          
          {state.current_page==='AUTH'&&<Auth/>}

          <div className = 'main-page'>
          
          {state.id && <SideMenu/>}
          

            <div className = 'main-component'>
              {pageComponents[state.current_page]}
            </div>

          {state.showMessages && <Inbox/>}
          </div>
        
        
      <Footer />
      
    </div>
  );
}
