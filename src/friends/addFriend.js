import React, { useState, useEffect } from 'react';
import { useUser } from '../UserContext';

export default function AddFriend ()  {
    const { state, dispatch } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
   
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [pendingRequests] = useState([]);
    
    // Fetch all users from the backend when the component mounts
   
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/social/get-users');
                const data = await response.json();
                
                const fetchedUsers = Array.isArray(data.users) ? data.users : [];
                setUsers(fetchedUsers);

            } catch (error) {
                console.error('Error fetching users:', error);
                return [];
            }
     };

        fetchUsers();
    }, []);
    
        
       
   
   


    useEffect(() => {
        if (searchTerm.length > 1) {
            const matches = users.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
                user.id !== state.id 
            );
            const isDifferent = matches.length !== filteredUsers.length ||
                                matches.some((user, index) => user.id !== filteredUsers[index].id);
            if (isDifferent) {
                setFilteredUsers(matches);
            }
        } else {  
            if (filteredUsers.length > 0) {
                setFilteredUsers([]);
            }
        }
    }, [searchTerm, users, state.id, filteredUsers]);
    
    

  
    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

  
    const handleDone = () => {
        setShowForm(false);
    };

    const handleRequest = async (recipient_id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/social/${state.id}/${recipient_id}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'friend_request',
                    content: 'Friend request sent'
                })
            });

            const result = await response.json();
            if (result.success) {
                const payload = { type: 'Friend Request', recipient_id };
                    dispatch({
                        type: 'ADD_SENT',
                        payload  // Only pass the new item to be added
                    });

                console.log(state.id,' requested ', recipient_id);
            } else {
                console.error('Failed to send friend request:', result.message);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };


    return (
        showForm && (
            <div className="form">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="search-bar"
                />

            <ul className="user-list">
                        {filteredUsers.map(user => (
                            <li key={user.id} className="user-item">
                                {user.username}
                                <button
                                    className="request-button"
                                    onClick={() => handleRequest(user.id)}
                                    disabled={pendingRequests[user.id]}
                                >
                                    {pendingRequests[user.id] ? 'Pending' : 'Request'}
                                </button>
                            </li>
                        ))}
                    </ul>

                <button className="done-button" onClick={handleDone}>
                    Done
                </button>
            </div>
        )
    );
};

