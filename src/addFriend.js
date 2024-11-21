import React, { useState, useEffect } from 'react';
import { useUser } from './usercontext';

export default function AddFriend ()  {
    const { state, dispatch} = useUser();
    const [searchTerm, setSearchTerm] = useState('');
   
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [pendingRequests,setPendingRequests] = useState({});
    //fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            if (state.users.length === 0) {
                try {
                    const response = await fetch('http://localhost:5000/api/social/get-users');
                    const data = await response.json();
                    const fetchedUsers = Array.isArray(data.users) ? data.users : [];
    
                    dispatch({
                        type: 'REPLACE_CONTEXT',
                        payload: { users: fetchedUsers }
                    });
    
                    console.log('Users loaded:', fetchedUsers);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            }
        };
    
        fetchUsers();
    }, [state.id]);
    //get list of relevant users
     useEffect(() => {
        
        if (searchTerm.length > 0 && state.users) {
            const matches = state.users.filter(user =>
                user.username.toLowerCase().startsWith(searchTerm.toLowerCase()) &&
                user.id !== state.id
            );
                setFilteredUsers(matches);   
            
        }
    }, [searchTerm, state.users, state.id, filteredUsers]);

  
    
    
    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };


    useEffect(() => {
        // Fetch pending requests
        const fetchPendingRequests = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/social/${state.id}/pending-requests`);
                const result = await response.json();

                if (result.success) {
                    // Initialize a boolean map for pending requests
                    const pendingMap = {};
                    result.pendingRequests.forEach(recipient_id => {
                        pendingMap[recipient_id] = true;
                    });
                    setPendingRequests(pendingMap);
                }
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        fetchPendingRequests();
    }, []);

    const checkPendingOrAccepted = (userId) => {
       
        if (state.friends.some(friend => friend.id === userId)) {
            return 'Accepted';
        }
        
        return pendingRequests[userId] ? 'Pending' : 'Request';
    };



    const handleRequest = async (recipient_id) => {
        try {
            
        await fetch(`http://localhost:5000/api/social/${state.id}/${recipient_id}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'friend_request',
                content: `${state.username} requested to follow you`
            })
        });


        setPendingRequests(prevState => ({
            ...prevState,
            [recipient_id]: true
        }));

    
        } catch (error) {
            console.error('Error sending friend request:', error);
        }

    };


    return (
        <div className="add-users-page">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="form-control search-input"
                />
            </div>
            <ul className="user-list">
                {filteredUsers.map(user => (
                    <li key={user.id} className="user-item">
                        <span className="username">{user.username}</span>
                        <button
                            className="request-button"
                            onClick={() => handleRequest(user.id)}
                            disabled={pendingRequests[user.id]}
                        >
                            {checkPendingOrAccepted(user.id)}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
    
    
};