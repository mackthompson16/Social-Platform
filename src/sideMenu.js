import { useUser } from "./usercontext";
import React, {useState} from 'react';
import generateEvents from "./events";
export default function SideMenu() {

    const {state, dispatch} = useUser();
    const [showViewOptions, setShowViewOptions] = useState(false);
   
    function setCurrentPage(page) {
    
    if(state.id){
        dispatch({
            type:'REPLACE_CONTEXT',
            payload: {current_page: page}
        })
    }
    }

    function logout() {
        dispatch({
            type:'CLEAR_CONTEXT'
        })
    }

    async function processEvents(userId) {

        const commitmentsResponse = await fetch(`http://localhost:5000/api/users/${userId}/get-commitments`);
        const commitments = await commitmentsResponse.json();
        const userEvents = generateEvents(commitments)
        
        dispatch({
            type: 'APPEND_CONTEXT',
            payload: {
                visibleEventKeys: {[userId]: true},
                cachedEventArrays: { [userId]: userEvents }
            },
        });
    }

    const toggleVisibility = (userId) => {
        //very proud of this function. took me a long time to make simple as it is
        //(thinking about how data should be stored and changed and stuff)
        if (state.visibleEventKeys.hasOwnProperty(userId)) {
          
            const updatedKeys = {
                ...state.visibleEventKeys, 
                [userId]: !state.visibleEventKeys[userId],
            };
        
            dispatch({
                type: 'REPLACE_CONTEXT',
                payload: { visibleEventKeys: updatedKeys },
            });
     
        } else {
           processEvents(userId)
        }
    };


    return (
        <div className="side-menu-container">
          <nav className="side-menu">
            <button
              className={`side-menu-button ${state.current_page === 'HOME' ? 'active' : ''}`}
              onClick={() => setCurrentPage('HOME')}
            >
              Home
            </button>
      
            <button
              className={`side-menu-button ${state.current_page === 'SCHEDULE_EVENT' ? 'active' : ''}`}
              onClick={() => setCurrentPage('SCHEDULE_EVENT')}
            >
              Schedule Event
            </button>
      
            <button
              className={`side-menu-button ${state.current_page === 'ADD_FRIEND' ? 'active' : ''}`}
              onClick={() => setCurrentPage('ADD_FRIEND')}
            >
              Add Friends
            </button>
      
            <button
              className={`side-menu-button ${showViewOptions ? 'active' : ''}`}
              onClick={() => setShowViewOptions(!showViewOptions)}
            >
              View Friends
            </button>
      
            {showViewOptions && (
              <div className="view-friends-container">
                {state.friends.map((friend) => (
                  <label key={friend.id} className="friend-option">
                    <input
                      type="checkbox"
                      checked={state.visibleEventKeys[friend.id] || false}
                      onChange={() => toggleVisibility(friend.id)}
                    />
                    {friend.username}
                  </label>
                ))}
              </div>
            )}
      
            <button
              className={`side-menu-button ${state.current_page === 'PROFILE' ? 'active' : ''}`}
              onClick={() => setCurrentPage('PROFILE')}
            >
              Profile
            </button>
      
            <button className="side-menu-button logout" onClick={() => logout()}>
              Logout
            </button>
          </nav>
        </div>
      );
      
}