import { TfiAngleRight,TfiAngleDown } from "react-icons/tfi";

import react, {useState} from 'react';
export default function Header({ setCurrentPage,currentPage }) {
const [showMenu, setShowMenu] = useState(false);
const [hoveredButton, setHoveredButton] = useState(null);

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
    transform: 'scale(1.1)', // Example hover effect, can adjust as needed
};

  const toggleSideMenu = () => {
    setShowMenu(!showMenu);

};


    const renderMenu = () => {


        return (
            <div className="menu-container">
                <button
                    style={{
                        ...iconStyle,
                        ...(hoveredButton === 'Friends' ? hoverStyle : {}),
                    }}
                    onMouseEnter={() => setHoveredButton('Friends')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => setCurrentPage('Friends')}
                >
                    Friends
                </button>
                <button
                    style={{
                        ...iconStyle,
                        ...(hoveredButton === 'Preferences' ? hoverStyle : {}),
                    }}
                    onMouseEnter={() => setHoveredButton('Preferences')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => setCurrentPage('Preferences')}
                >
                    Preferences
                </button>
                <button
                    style={{
                        ...iconStyle,
                        ...(hoveredButton === 'EditSchedule' ? hoverStyle : {}),
                    }}
                    onMouseEnter={() => setHoveredButton('EditSchedule')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => setCurrentPage('EditSchedule')}
                >
                    Schedule
                </button>
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
            onClick={() => currentPage !== 'login' && toggleSideMenu()}
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
       
    {showMenu &&(
         <div className="side-menu">
                {renderMenu()}
        </div>
        
    )}
            
    </div>
    </div>
  );
}
