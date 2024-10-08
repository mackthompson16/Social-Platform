import React, {useState} from 'react';

let current_User = ''
const CreateAccount = () => {
  const [accInfo, setAccInfo] = useState({
    username: '',
    password: '',
    email: ''
  });

  const [showForm, setShowForm] = useState(false); // State to show/hide the form

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAccInfo({
      ...accInfo,
      [name]: value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Perform the account creation logic here (e.g., API call)
    const response = await fetch('http://localhost:5000/api/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accInfo),
    });

    const data = await response.json();

    if (data.success) {
      alert('Account created successfully!');
    } else {
      alert('Error creating account: ' + data.message);
    }

    // Reset the form after submission
    setAccInfo({
      username: '',
      password: '',
      email: ''
    });
    setShowForm(false); // Hide the form after successful account creation
  };

  const toggleForm = () => {
    setShowForm(!showForm); // Toggle the visibility of the form
  };

  return (
    <div>
      <button onClick={toggleForm}>
        {showForm ? 'Cancel' : 'Create Account'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Username:
              <input
                type="text"
                name="username"
                value={accInfo.username}
                onChange={handleChange}
                placeholder="Required Field"
                required
              />
            </label>
          </div>
          <div>
            <label>
              Password:
              <input
                type="password"
                name="password"
                value={accInfo.password}
                onChange={handleChange}
                placeholder="Required Field"
                required
              />
            </label>
          </div>
          <div>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={accInfo.email}
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
}


const Login = () => {
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

export default function Myapp(){
  return (
    <div>
      <h1>My Social Media</h1>
      <CreateAccount/>
      <Login/>
    </div>
  );
}

const user = {
  name: 'Username',
  profile_picture: 'Upload Image',
  image_size: 90
};

