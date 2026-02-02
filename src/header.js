
import { useUser } from './usercontext';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header({ onToggleMenu, menuOpen = false }) {
    const { state } = useUser();

    return (
        <header className="header">
            <div className="header-left">
                {state.id ? (
                    <button className="header-menu-toggle" type="button" onClick={onToggleMenu}>
                        {menuOpen ? <FiX /> : <FiMenu />}
                    </button>
                ) : null}
                <div className="header-title">
                    <h3>WeCal</h3>
                </div>
            </div>
            {state.id ? <div className="header-status">{state.username || 'Account'}</div> : null}
        </header>
    );
}
