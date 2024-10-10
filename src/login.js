import React, {useState} from 'react';

export default function Login({ setCurrentPage, setCurrentUser }) {
    const [AccInfo, setAccInfo] = useState({
      username: '',
      password: '',
    });
  
    const [showLoginForm, setShowLoginForm] = useState(false); // Initially false to hide the form
  
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
        setCurrentUser(data.user);  // Update the user state
        setCurrentPage('Home');     // Navigate to the home page
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
      setShowLoginForm(!showLoginForm);
    };
  
    return (
      <div>
            <button onClick={toggleLoginForm}>
              {showLoginForm ? 'Cancel' : 'Login'}
            </button>
            {!showLoginForm && (
              <div>
                <h3>Don't have an account yet?</h3>
                <button onClick={() => setCurrentPage('CreateAccount')}>Create Account</button>
              </div>
            )}

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

      </div>
    );
  };
  