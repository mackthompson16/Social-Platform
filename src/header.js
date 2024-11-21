
import { VscBell, VscBellDot } from "react-icons/vsc";
import {useState} from 'react';
import { useUser } from './usercontext';

export default function Header() {
    const { state,dispatch } = useUser();
    const newNotifications = useState(false);
   
    function toggleMessages(){
       if(state.id){
        dispatch({
            type:'REPLACE_CONTEXT',
            payload: {showMessages: !state.showMessages}
        })
    }
    }
   return (
         
    <div className='banner'>
    
        <div className='weCal'>
            <h3>WeCal</h3>
        </div>

        <button
                className='icon'
                style={{display:'flex', alignItems:'flex-end'}}
                onClick={() => toggleMessages()}
                aria-label="Toggle messages" 
        >
        {newNotifications? (<VscBellDot style={{color:'#FFFFFF'}}/>) : <VscBell style={{color:'#FFFFFF'}}/>}

        </button>
    
    </div>
  );
}
