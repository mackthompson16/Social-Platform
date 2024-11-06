
# Environment Guide

1. Updated to Node.js v20.18.0 (make sure you reset your environment and reinstall Node.js).
```bash
https://nodejs.org/en/download/package-manager
```
```bash
npm install
```
2. Ensure all dependencies are installed:

```bash
npm install bootstrap react react-bootstrap react-scripts react-dom react-datepicker cors sqlite3 web-vitals react-time-picker react-icons
```
| Dependency         |Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| **bootstrap**      | A popular CSS framework for building responsive, mobile-first websites.     |
| **react**          | A JavaScript library for building user interfaces using components.         |
| **react-bootstrap**| Bootstrap components built as React components for seamless integration.    |
| **react-scripts**  | Scripts and configuration for Create React App, including build and test tools. |
| **react-dom**      | Provides DOM-specific methods for rendering React components to the DOM.    |
|**react-datepicker**| UI packagage for date selection in the schedule form. |
|**@fullcalendar/react @fullcalendar/daygrid**| UI package for rendering calendar. | 
|**react-icons**| React icons |
| **cors**           | Middleware to enable cross-origin requests between server and app.          |
| **sqlite3**        | Lightweight SQL database engine used for storing user data locally.         |
| **web-vitals**     | Reports essential web performance metrics like loading time, interactivity, and stability. |



4.  Start the server
```bash 
cd my-app/backend
```
```bash
node server.js
```
5. In a separate terminal, start the React app
```bash
cd my-app
```
```bash
npm start
```

Note: The server and the React app run on separate hosts (frontend and backend communication).


# To-do list:
1. Implement Add Friend, Schedule Meeting, View Friends Frontend
2. Fix CSS and variable viewport (mobile?)
3. Implement Email (password change, notifications)
4. Set up the instance and find a domain name.
