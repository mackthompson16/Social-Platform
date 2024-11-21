import React, {useState} from "react"
import { useUser } from './usercontext';
import Login from "./auth";
export default function Profile(){
    const [showEditMenu, setShowEditMenu] = useState(false);
    const { state, dispatch } = useUser();
    const [accInfo, setAccInfo] = useState({
        username: '',
        password: '',
        email: ''
      });

      const handleChange = (event) => {
        const { name, value } = event.target;
        setAccInfo({
          ...accInfo,
          [name]: value
        });
      };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        const updatedAccInfo = {
            username: accInfo.username || state.username,
            password: accInfo.password || state.password,
            email: accInfo.email || state.email,
        };
    
        try {
            const response = await fetch(`http://localhost:5000/api/users/${state.id}/update-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedAccInfo),
            });
    
            const result = await response.json();
    
            if (result.success) {
                console.log('Account updated successfully');
    
                
                dispatch({ type: 'REPLACE_CONTEXT', payload: updatedAccInfo });
            } else {
                console.error('Error updating account:', result.message);
             
            }
        } catch (error) {
            console.error('Request failed:', error);
           
        }
        setShowEditMenu(false);
    };
    
        return(
            <div className = 'input-buttons'>
            <input
                type="text"
                id="username"
                name="username"
                value={accInfo.username}
                onChange={handleChange}
                placeholder={state.username}
                className="form-control"
            />

            <input
                type="password"
                id="password"
                name="password"
                value={accInfo.password}
                onChange={handleChange}
                placeholder={state.password}
                className="form-control"
            />

            <input
                type="email"
                id="email"
                name="email"
                value={accInfo.email}
                onChange={handleChange}
                placeholder={state.email}
                className="form-control"
            />

            <div className="button-container">
                <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit()} 
                >
                    Save Changes
                </button>
               
            </div>
        </div>

        ) 

}
