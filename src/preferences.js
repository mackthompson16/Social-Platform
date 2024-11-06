import React, {useState} from "react"
import { useUser } from './UserContext';
import Login from "./login";
export default function Preferences(){
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

    const Logout = () =>{

        dispatch({
            type: 'LOGOUT_USER',
          });

        return (<Login/>)
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        const updatedAccInfo = {
            username: accInfo.username || state.username,
            password: accInfo.password || state.password,
            email: accInfo.email || state.email,
        };
    
        try {
            const response = await fetch('http://localhost:5000/api/users/${state.id}/update-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedAccInfo),
            });
    
            const result = await response.json();
    
            if (result.success) {
                console.log('Account updated successfully');
    
                // Dispatch the context update with the new account info
                dispatch({ type: 'UPDATE_DATA', payload: updatedAccInfo });
            } else {
                console.error('Error updating account:', result.message);
                // Handle error (e.g., show an error message)
            }
        } catch (error) {
            console.error('Request failed:', error);
            // Handle fetch error
        }
        setShowEditMenu(false);
    };
    
    


    const editAccount= () =>{
        return(
        <form onSubmit={handleSubmit}>
        <div className="form">
          
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
          <button type="submit" className="btn btn-primary">Submit</button>
          <button onClick={() => setShowEditMenu(false)} className="btn btn-secondary">Cancel</button>
          </div>
          </div>


        </form>
        )

    }
    
    
    return(
        <div>
        <div className="menu-container">
                <button className="btn btn-primary"
                    onClick={()=>setShowEditMenu(true) }
                >
                  Edit Account

                </button>
                <button className="btn btn-primary"
                    onClick={()=>Logout() }
                >
                  Logout
                </button>
        </div>

        {showEditMenu && editAccount()}

        </div>
    )
}
