import { TfiAngleRight,TfiAngleDown } from "react-icons/tfi";
import { VscBell, VscBellDot } from "react-icons/vsc";
import CommitmentMenu from "./commitmentMenu";
import {useState} from 'react';
import CommitmentForm from './commitmentForm';
import Preferences from './preferences';
import Friends from './friends/friends';
import Messages from "./friends/messages";
import { useUser } from './UserContext';

export default function Header() {
    const { state } = useUser();
    const newNotifications = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showCommitmentMenu, setShowCommitmentMenu] = useState(false);
    const [showFriendsMenu, setShowFriendsMenu] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

  const headerContainerStyle = {
      display: 'flex',
      padding: '20px',
      backgroundColor: '#333', // Black background for the header
  };

 
  
  const iconStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
    padding:'10px'
};
const iconAdjustment= {
    transform: 'translateY(2px)',
    fontSize: '0.85em', 
    color: '#333', 
}

const title ={

    flex: 1, 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color:'#FFFFFF'

}
const renderMenu = () => {
    return (
       <div className="menu-container">
           <button className="btn btn-primary"
               onClick={() => setShowFriendsMenu(!showFriendsMenu)}
           >
                  <h3>Friends  {showFriendsMenu? ( <TfiAngleDown style={iconAdjustment}/>) : (<TfiAngleRight style={iconAdjustment}/>)}</h3>
           </button>
           {showFriendsMenu && (
               <div className="spaced friends-open">
                   <Friends />
               </div>
           )}
           
           <button 
               className={`btn btn-primary ${showFriendsMenu ? 'friends-open' : ''}`}
               onClick={() => setShowPreferences(!showPreferences)}
           >
               <h3>Preferences  {showPreferences ? ( <TfiAngleDown style={iconAdjustment}/>) : (<TfiAngleRight style={iconAdjustment}/>)}</h3>
           </button>
           {showPreferences && (
               <div className="spaced preferences-open">
                   <Preferences />
               </div>
           )}
           
           <button 
               className={`btn btn-primary ${showPreferences ? 'preferences-open' : ''}`}
               onClick={() => setShowCommitmentMenu(!showCommitmentMenu)}
           >
              <h3>Manage  {showCommitmentMenu ? ( <TfiAngleDown style={iconAdjustment}/>) : (<TfiAngleRight style={iconAdjustment}/>)}</h3>
      
           </button>
           {showCommitmentMenu && <div><CommitmentMenu /></div>}
           
           {showCommitmentMenu && (
               <button
                   className="btn btn-primary"
                   onClick={() => setShowForm(true)}
               >
                   Add Commitment
               </button>
           )}
       </div>
   );
};

   return (
    <div>
        
        {showForm && (<CommitmentForm setShowForm={setShowForm}/>)}
    
    <div style={headerContainerStyle}>
        
         <button
            style={iconStyle}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Toggle menu" 
        >

        
            {showMenu ? ( <TfiAngleDown style={{color:'#FFFFFF'}}/>) : (<TfiAngleRight style={{color:'#FFFFFF'}}/>)}
        </button>
        <div style={title}>
            <h3>WeCal</h3>
        </div>

        <button
                style={iconStyle}
                onClick={() => setShowMessages(!showMessages)}
                aria-label="Toggle messages" 
            >
        {newNotifications? (<VscBellDot style={{color:'#FFFFFF'}}/>) : <VscBell style={{color:'#FFFFFF'}}/>}

        </button>
       
    
            
    </div>

    {(showMenu && state.isLoggedIn) && (
         <div className="side-menu">
                {renderMenu()}
        </div>
        
    )}

    {(showMessages && state.isLoggedIn) && (
         <div className="side-menu">
                {Messages()}
        </div>
        
    )}
    </div>
  );
}
