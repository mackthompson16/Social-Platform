import { Button } from 'react-bootstrap';
export default function Header({setCurrentPage}) { 

        const buttonContainerStyle = {
            display: 'flex',
            justifyContent: 'center',
            padding: '10px',
            gap: '10px',
            marginTop: '20px',
          };
        
          const buttonStyle = {
            flex: 1,
            maxWidth: '200px',
          };
        
          return (
            <div>
              <div style={buttonContainerStyle}>
                <Button style={buttonStyle} variant="outline-primary" onClick={() => setCurrentPage('Schedule')}>
                  My Schedule
                </Button>
                <Button style={buttonStyle} variant="outline-primary" onClick={() => setCurrentPage('Friends')}>
                  Friends
                </Button>
                <Button style={buttonStyle} variant="outline-primary" onClick={() => setCurrentPage('Preferences')}>
                  Preferences
                </Button>
              </div>
            </div>
          );
}