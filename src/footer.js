
export default function Footer() {
  const footerStyle = {
   
    backgroundColor: '#333',
    color: '#fff',
    padding: '20px',
    textAlign: 'center',
    width: '100%',
    
  };

  const linkStyle = {
    margin: '0 10px',
    color: '#fff',
    textDecoration: 'none',
  };

  const socialIconsStyle = {
    margin: '0 10px',
  };

  return (
    <div style={footerStyle}>
      <div>
        <a href="/about" style={linkStyle}>About</a>
        <a href="/contact" style={linkStyle}>Contact</a>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="https://github.com/mackthompson16/myMedia" target="_blank">
          <img src="/icons/github-mark.png" alt="GitHub" style={socialIconsStyle} width="30" />
        </a>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p>&copy; 2024 Thompson LLC. All rights reserved.</p>
      </div>
    </div>
  );
}
