import { useUser } from "./usercontext";
import React, { useMemo, useState } from 'react';
import generateEvents from "./events";
import { API_BASE_URL } from "./config";
export default function SideMenu() {

    const {state, dispatch} = useUser();
    const [showViewOptions, setShowViewOptions] = useState(false);
    const colorPalette = [
        '#2563EB',
        '#16A34A',
        '#F97316',
        '#7C3AED',
        '#DC2626',
        '#0EA5E9',
        '#A855F7',
        '#65A30D',
        '#E11D48',
        '#FACC15'
    ];
    const userColorMap = useMemo(() => {
        const ids = [
            ...Object.keys(state.visibleEventKeys || {}),
            ...(state.friends || []).map((friend) => String(friend.id)),
        ];
        const seen = new Set();
        const ordered = ids.filter((id) => {
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        const map = {};
        ordered.forEach((id, idx) => {
            map[id] = colorPalette[idx % colorPalette.length];
        });
        return map;
    }, [state.visibleEventKeys, state.friends]);

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

        const eventsResponse = await fetch(`${API_BASE_URL}/api/users/${userId}/get-events`);
        const eventsData = await eventsResponse.json();
        const events = generateEvents(eventsData.rows)
        
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
              {showViewOptions ? '▼ View Friends' : '▶ View Friends'}
            </button>
      
            {showViewOptions && (
              <div className="view-friends-container">
                {state.friends.map((friend) => {
                  const isVisible = state.visibleEventKeys[friend.id] || false;
                  const userColor = userColorMap[String(friend.id)] || '#61dafb';
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      className={`friend-toggle ${isVisible ? 'active' : ''}`}
                      onClick={() => toggleVisibility(friend.id)}
                      style={{
                        borderColor: isVisible ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: isVisible
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(255, 255, 255, 0.02)',
                        boxShadow: isVisible ? `inset 4px 0 0 ${userColor}` : 'none',
                      }}
                    >
                      {friend.username}
                    </button>
                  );
                })}
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
