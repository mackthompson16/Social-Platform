
import { VscBell } from "react-icons/vsc";
import { useMemo } from 'react';
import { useUser } from './usercontext';

export default function Header() {
    const { state, dispatch } = useUser();

    function toggleMessages() {
        if (state.id) {
            const nextShow = !state.showMessages;
            dispatch({
                type: 'REPLACE_CONTEXT',
                payload: { showMessages: nextShow }
            });
            if (nextShow && (state.inbox || []).length > 0) {
                dispatch({ type: 'MARK_INBOX_READ' });
            }
        }
    }

    const unreadCount = useMemo(() => {
        return (state.inbox || []).filter((m) => m.status === 'unread').length;
    }, [state.inbox]);

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
                <VscBell />
                {unreadCount > 0 && (
                    <span className="badge">
                        {unreadCount}
                    </span>
                )}
            </button>
        </header>
    );
}
