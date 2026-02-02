
import { useUser } from './usercontext';
import { FiMessageCircle, FiMenu } from 'react-icons/fi';
import { FaCalendarAlt } from 'react-icons/fa';

export default function Footer({ activeTab = 'calendar', onTabChange }) {
  const { state } = useUser();
  const unreadCount = (state.inbox || []).filter(
    (message) => message.status === 'unread' && Number(message.recipient_id) === Number(state.id)
  ).length;

  return (
    <div className="footer">
      <div className="icon footer-github">
        <a href="https://github.com/mackthompson16/myMedia" target="_blank" rel="noreferrer">
          <img src="/icons/github-mark.png" alt="GitHub" className="icon" width="30" />
        </a>
      </div>
      {state.id && (
        <div className="mobile-footer-nav">
          <button
            type="button"
            className={`mobile-nav-button ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('menu')}
          >
            <FiMenu />
          </button>
          <button
            type="button"
            className={`mobile-nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('calendar')}
          >
            <FaCalendarAlt />
          </button>
          <button
            type="button"
            className={`mobile-nav-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange('chat')}
          >
            <FiMessageCircle />
            {unreadCount > 0 && <span className="mobile-nav-badge">{unreadCount}</span>}
          </button>
        </div>
      )}
    </div>
  );
}
