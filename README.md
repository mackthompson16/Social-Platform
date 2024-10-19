
# Environment Guide for jfred

# 1. Updated to Node.js v20.18.0 (make sure you reset your environment).

# 2. npm install

# 3. Ensure all dependencies are installed:

    npm install bootstrap react react-bootstrap react-scripts react-dom cors sqlite3 webvitals

| Dependency         |Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| **bootstrap**      | A popular CSS framework for building responsive, mobile-first websites.     |
| **react**          | A JavaScript library for building user interfaces using components.         |
| **react-bootstrap**| Bootstrap components built as React components for seamless integration.    |
| **react-scripts**  | Scripts and configuration for Create React App, including build and test tools. |
| **react-dom**      | Provides DOM-specific methods for rendering React components to the DOM.    |
| **cors**           | Middleware to enable cross-origin requests between server and app.          |
| **sqlite3**        | Lightweight SQL database engine used for storing user data locally.         |
| **web-vitals**     | Reports essential web performance metrics like loading time, interactivity, and stability. |


# 4. Navigate to the src directory
cd my-app/src

# 5. Start the server
node server.js

# 6. In a separate terminal, start the React app
cd my-app
npm start

# Note: The server and the React app run on separate hosts (frontend and backend communication).


# Current to-do list (follow with frontend dev):
# 1. Create pages for friends, generate schedule, and set preferences.
# 2. Implement reset password email functionality.
# 3. Build header and footer for tabs & copyright.
# 4. Add Maps API interaction and schedule generator.
# 5. Set up the instance and find a domain name.
