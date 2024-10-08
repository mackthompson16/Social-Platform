import React, {useState} from 'react';
export default function Login() {
    const [AccInfo, setAccInfo] = useState({
      username: '',
      password: '',
    });
  
    const [showLoginForm, setShowLoginForm] = useState(false); // Initially false to hide the form
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  
    const handleChange = (event) => {
      const { name, value } = event.target;
      setAccInfo({
        ...AccInfo,
        [name]: value,
      });
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      // Sending a POST request to backend for login
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(AccInfo),
      });
  
      const data = await response.json();
  
      if (data.success) {
        setIsLoggedIn(true);
        alert('Login successful!');
      } else {
        if (data.error === 'username') {
          alert('Username does not exist');
        } else if (data.error === 'password') {
          alert('Incorrect password');
        }
      }
  
      // Reset the form
      setAccInfo({
        username: '',
        password: '',
      });
    };
  
    const toggleLoginForm = () => {
      setShowLoginForm(!showLoginForm); // Toggle the visibility of the login form
    };
  
    return (
      <div>
        {!isLoggedIn ? (
          <>
            <button onClick={toggleLoginForm}>
              {showLoginForm ? 'Cancel' : 'Login'}
            </button>
  
            {showLoginForm && (
              <form onSubmit={handleSubmit}>
                <div>
                  <label>
                    Username
                    <input
                      type="text"
                      name="username"
                      value={AccInfo.username}
                      onChange={handleChange}
                      placeholder="Required Field"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Password
                    <input
                      type="password"
                      name="password"
                      value={AccInfo.password}
                      onChange={handleChange}
                      placeholder="Required Field"
                      required
                    />
                  </label>
                </div>
                <button type="submit">Submit</button>
              </form>
            )}
          </>
        ) : (
          <p>Welcome, {AccInfo.username}!</p>
        )}
      </div>
    );
  };
  