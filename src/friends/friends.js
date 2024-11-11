
import AddFriend from './addFriend';
import React, {useState} from 'react';
export default function Friends() {
    const [showAddFriend, setShowAddFriend] = useState(false);
    

    return(
        <div>
            <div className="menu-container">
            <button className="btn btn-primary"
                onClick={()=>viewFriends() }
            >
                View

            </button>
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