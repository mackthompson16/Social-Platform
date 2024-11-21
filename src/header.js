
import { VscBell, VscBellDot } from "react-icons/vsc";
import {useState} from 'react';
import { useUser } from './usercontext';

export default function Header() {
    const { state, dispatch } = useUser();
    const [newNotifications] = useState(false);

    function toggleMessages() {
        if (state.id) {
            dispatch({
                type: 'REPLACE_CONTEXT',
                payload: { showMessages: !state.showMessages }
            });
        }
    }

    return (
        <header className="header">
            <div className="header-title">
                <h3>WeCal</h3>
            </div>

            <button
                className="icon notification-icon"
                onClick={() => toggleMessages()}
                aria-label="Toggle messages"
            >
                {newNotifications ? (
                    <VscBellDot className="notification-active" />
                ) : (
                    <VscBell />
                )}
            </button>
        </header>
    );
}
