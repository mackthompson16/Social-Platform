
import addFriend from './addFriend';
export default function Friends() {
  
    

    return(
            <div className="menu-container">
            <button className="btn btn-primary"
                onClick={()=>viewFriends() }
            >
                View

            </button>
            <button className="btn btn-primary"
                onClick={()=>addFriend() }
            >
                Add
            </button>
            <button className="btn btn-primary"
                onClick={()=>scheduleMeeting() }
            >
                Schedule Meeting
            </button>

        </div>
    )
}