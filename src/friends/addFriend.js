import React, { useState, useEffect } from 'react';
import { useUser } from '../UserContext';

export default function addFriend ()  {
    const { state, dispatch } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showForm, setShowForm] = useState(true);

    // Fetch all users from the backend when the component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/social/get-users'); // Adjust URL as needed
                const data = await response.json();
                setUsers(data.users); // Assuming the API returns an array of users in 'data.users'
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    // Filter users based on the search term
    useEffect(() => {
        const matches = users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(matches);
    }, [searchTerm, users]);

    // Handle input changes
    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Toggle form visibility
    const handleDone = () => {
        setShowForm(false);
    };

    const handleRequest = async (recipientId) => {
        try {
            const response = await fetch(`/api/users/${state.id}/${recipientId}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'friend_request',
                    content: 'Friend request sent'
                })
            });

            const result = await response.json();
            if (result.success) {
                // Update pending state for this user to disable the button
                setPendingRequests((prev) => ({
                    ...prev,
                    [recipientId]: true
                }));
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