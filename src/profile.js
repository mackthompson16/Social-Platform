import React, {useState} from "react"
import { useUser } from './usercontext';
import Login from "./auth";
import { API_BASE_URL } from './config';
export default function Profile(){

    function cancelForm() {
        
        dispatch({
            type:'REPLACE_CONTEXT',
            payload:{current_form: 'NONE'}
        })
    }

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
            const response = await fetch(`${API_BASE_URL}/api/users/${state.id}/update-account`, {
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
     
    };
    
        return(
  
            <div>
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

            <div className='action-buttons'>
                <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit()} 
                >
                    Save Changes
                </button>
               
            
            <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            cancelForm();
                        }}
                    >
                        cancel
                    </button>
            </div>
        </div>
       

        ) 

}
