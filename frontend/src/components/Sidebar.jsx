import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '🏪', label: 'Stores', path: '/stores' },
    { icon: '📦', label: 'Shelves', path: '/shelves' },
    { icon: '📷', label: 'Cameras', path: '/cameras' },
    { icon: '👥', label: 'Users', path: '/users' },
    { icon: '👤', label: 'Profile', path: '/profile' },
    { icon: '⚙️', label: 'Settings', path: '#' },
  ];

  const handleLogout = () => {
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('authUser');
    setUser(null);
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Retail AI</h2>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className="sidebar-menu-item"
            onClick={() => item.path !== '#' && navigate(item.path)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span className="sidebar-icon">🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}
