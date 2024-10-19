Full stack social media repo using js react, want to turn it into some niche social platform. 

Environment Guide for jfred

1. Updated to node 20.18.0 (make sure you reset your environment, I uninstalled and reinstalled node completeley)
2. npm install
3. make sure you have dependencies:

 "dependencies": 
 {
    "bootstrap": "^5.3.3",
    "cors": "^2.8.5",
    "react": "^18.3.1",
    "react-bootstrap": "^2.10.5",
    "react-dom": "^18.3.1",
    "react-scripts": "^5.0.1",
    "sqlite3": "^5.1.7",
    "web-vitals": "^4.2.3"
  }

 4. cd my-app/src
5. node server.js
6. in a seperate terminal (cd my-app), npm start

Note that the server and the App run on seperate hosts. This can be thought of Frontend and Backend programs communicating with eachother


Current plan is a path generator based on courses using maps API. 
Users can view friend's paths and where they will be/walking at sometime of day. 


current to-do list (follow with frontend dev)

1. create pages for friends, generate schedule, prefrences
2. reset password email
3. header and footer for tabs & copyright
4. maps api interaction and schedule generator
5. set up instance and find domain name
   
