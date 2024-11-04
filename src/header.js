import { TfiAngleRight,TfiAngleDown } from "react-icons/tfi";
import CommitmentMenu from "./commitmentMenu";
import {useState} from 'react';
export default function Header() {

    const [showMenu, setShowMenu] = useState(false);
    const [hoveredButton, setHoveredButton] = useState(null);
    const [showCommitmentMenu, setShowCommitmentMenu] = useState(false);

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

const hoverStyle = {
    transform: 'scale(1.1)', 
};

  const toggleSideMenu = () => {
    setShowMenu(!showMenu);

};


    const renderMenu = () => {


        return (
            <div className="menu-container">
                <button className="btn btn-primary"
                    onClick={()=>setShowCommitmentMenu(!showCommitmentMenu) }
                >
                    Friends
                </button>
                <button 
                className="btn btn-primary"
                 onClick={() => setShowCommitmentMenu(!showCommitmentMenu)}
                >
                    Preferences
                </button>
                <button className="btn btn-primary"
                onClick={() => setShowCommitmentMenu(!showCommitmentMenu)}
                >
                   {showCommitmentMenu? 'Hide':'Manage'}
                </button>
                {showCommitmentMenu && (

                    <CommitmentMenu/>


                )}
            </div>
        );

    };
  
  

  return (
    <div>
        
    
    <div style={headerContainerStyle}>
        
         <button
            style={{
                ...iconStyle,
                ...(hoveredButton === 'ToggleMenu' ? hoverStyle : {}),
            }}
            onMouseEnter={() => setHoveredButton('ToggleMenu')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => toggleSideMenu()}
            aria-label="Toggle menu" // Accessibility feature
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

    {showMenu &&(
         <div className="side-menu">
                {renderMenu()}
        </div>
        
    )}
    </div>
  );
}
