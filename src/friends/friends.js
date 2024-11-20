
import AddFriend from './addFriend';
import React, {useState, useEffect} from 'react';
import { useUser } from '../UserContext';
import generateEvents from '../events';

export default function Friends() {

   
    const {state, dispatch} = useUser();

    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showFriends, setShowFriends] = useState(false);

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
    
    

    

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/social/get-users');
                const data = await response.json();
                
                const fetchedUsers = Array.isArray(data.users) ? data.users : [];
                
                dispatch({
                    type: 'REPLACE_CONTEXT',
                    payload: {users: fetchedUsers }
                  });



            } catch (error) {
                console.error('Error fetching users:', error);
                return [];
            }

            
     };

        fetchUsers();
    }, []);

    return(
        <div>
            <div className="menu-container">
            <button className="btn btn-primary"
                onClick={()=>setShowFriends(true) }
            >
                View

            </button>
            
            {showFriends && (
                <div>
                    {state.friends.map((friend) => (
                        <div key={friend.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={state.visibleEventKeys[friend.id] || false} // Ensure it's controlled
                                    onChange={() => toggleVisibility(friend.id)} // Call displayFriendSchedule with friend's ID
                                />
                                {friend.username} {/* Display friend's username */}
                            </label>
                        </div>
                    ))}
                </div>
            )}
            <button className="btn btn-primary"
                onClick={() => setShowAddFriend(true)}
            >
                Add
            </button>
            <button className="btn btn-primary"
                onClick={()=>scheduleMeeting() }
            >
                Schedule Meeting
            </button>

        </div>
        {showAddFriend && <AddFriend />}
        </div>
    )
}