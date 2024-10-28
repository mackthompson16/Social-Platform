export default function Header({ setCurrentPage }) {
  const headerContainerStyle = {
      display: 'flex',
      justifyContent: 'center',
      padding: '10px',
      gap: '20px',
      marginTop: '20px',
      backgroundColor: '#000', // Black background for the header
  };

  const linkStyle = {
      color: '#fff', // White text
      fontSize: '18px',
      cursor: 'pointer',
      textDecoration: 'none',
      padding: '10px 15px',
      borderRadius: '5px',
      transition: 'color 0.3s ease, transform 0.2s ease',
  };

  const hoverStyle = {
      color: '#ddd', // Light gray on hover
      transform: 'scale(1.05)', // Slightly enlarge on hover
  };

  return (
      <div style={headerContainerStyle}>
          <span
              style={linkStyle}
              onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
              onMouseLeave={(e) => Object.assign(e.target.style, linkStyle)}
              onClick={() => setCurrentPage('Schedule')}
          >
              My Schedule
          </span>
          <span
              style={linkStyle}
              onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
              onMouseLeave={(e) => Object.assign(e.target.style, linkStyle)}
              onClick={() => setCurrentPage('Friends')}
          >
              Friends
          </span>
          <span
              style={linkStyle}
              onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
              onMouseLeave={(e) => Object.assign(e.target.style, linkStyle)}
              onClick={() => setCurrentPage('Preferences')}
          >
              Preferences
          </span>
      </div>
  );
}
