import { TfiAngleRight,TfiAngleDown } from "react-icons/tfi";
import CommitmentMenu from "./commitmentMenu";
import {useState} from 'react';
import CommitmentForm from './commitmentForm';
import Preferences from './preferences';
import Friends from './friends';
import { useUser } from './UserContext';

export default function Header() {
    const { state } = useUser();
   
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
                    onClick={()=>setShowFriendsMenu(!showCommitmentMenu) }
                >
                    {showFriendsMenu? 'Hide':'Friends'}
                </button>
                    {showFriendsMenu && (<Friends/>)}
                <button 
                className="btn btn-primary"
                 onClick={() => setShowPreferences(!showPreferences)}
                >
                    {showPreferences? 'Hide':'Preferences'}
                </button>
                    {showPreferences && (<Preferences/>)}
                <button className="btn btn-primary"
                onClick={() => setShowCommitmentMenu(!showCommitmentMenu)}
                >
                   {showCommitmentMenu? 'Hide':'Manage'}
                </button>
                {showCommitmentMenu && ( <CommitmentMenu/>)}
                
                   
                {showCommitmentMenu&& (
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

        
            {showMenu ? (
                <TfiAngleDown style={{color:'#FFFFFF'}}/>
            ) : (
                <TfiAngleRight style={{color:'#FFFFFF'}}/>
            )}
        </button>
        <div style={title}>
            <h3>WeCal</h3>
        </div>
       
    
            
    </div>

    {(showMenu && state.isLoggedIn) && (
         <div className="side-menu">
                {renderMenu()}
        </div>
        
    )}
    </div>
  );
}
