import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiCamera, FiHome, FiSettings, FiShoppingBag, FiUser, FiUsers } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiShoppingBag, label: 'Stores', path: '/stores' },
    { icon: FiShoppingBag, label: 'Shelves', path: '/shelves' },
    { icon: FiCamera, label: 'Cameras', path: '/cameras' },
    { icon: FiBarChart2, label: 'Analytics', path: '/analytics' },
    { icon: FiUsers, label: 'Users', path: '/users' },
    { icon: FiUser, label: 'Profile', path: '/profile' },
    { icon: FiSettings, label: 'Settings', path: '#' },
  ];

  const handleLogout = () => {
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('authUser');
    setUser(null);
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><h2>Retail AI</h2></div>
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className="sidebar-menu-item" onClick={() => item.path !== '#' && navigate(item.path)}>
              <span className="sidebar-icon"><Icon /></span><span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <button className="sidebar-logout" onClick={handleLogout}><span>Logout</span></button>
    </aside>
  );
}
