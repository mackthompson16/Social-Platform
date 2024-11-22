import { useUser } from "./usercontext";
import React, {useState} from 'react';
import generateEvents from "./events";
export default function SideMenu() {

    const {state, dispatch} = useUser();
    const [showViewOptions, setShowViewOptions] = useState(false);
   
    function setCurrentForm(form) {
    
    if(state.id){
        dispatch({
            type:'REPLACE_CONTEXT',
            payload: {current_form: form}
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
        const commitmentsData = await commitmentsResponse.json();
        const events = generateEvents(commitmentsData.rows)
        
        dispatch({
            type: 'APPEND_CONTEXT',
            payload: {
                visibleEventKeys: {[userId]: true},
                cachedEventArrays: {[userId]: events}
                
                
            },
        });
    }

    const toggleVisibility = (userId) => {
      
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
              className={`side-menu-button ${state.current_form === 'SCHEDULE_EVENT' ? 'active' : ''}`}
              onClick={() => setCurrentForm('SCHEDULE_EVENT')}
            >
              Schedule Event
            </button>
      
            <button
              className={`side-menu-button ${state.current_form === 'ADD_FRIEND' ? 'active' : ''}`}
              onClick={() => setCurrentForm('ADD_FRIEND')}
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
              className={`side-menu-button ${state.current_form === 'PROFILE' ? 'active' : ''}`}
              onClick={() => setCurrentForm('PROFILE')}
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