import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiTv,
  FiBriefcase,
  FiGrid,
  FiShoppingBag,
  FiLayers,
  FiVideo,
  FiTrendingUp,
  FiFileText,
  FiMapPin,
  FiZap,
  FiUser,
  FiLogOut,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, getDashboardPathForRole } from '../utils/roleUtils';
import '../styles/Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const role = normalizeRole(user?.role);
  const dashboardPath = getDashboardPathForRole(role);

  const initials = (user?.name || user?.email || 'U')
    .split(/[\s@]/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const roleDisplayName = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { icon: FiHome, label: 'Main Dashboard', path: dashboardPath },
        { icon: FiTv, label: 'Live CCTV Monitor', path: '/live-dashboard' },
        { icon: FiBriefcase, label: 'Manager Dashboard', path: '/manager-dashboard' },
        { icon: FiGrid, label: 'Analyst Dashboard', path: '/analyst-dashboard' },
      ]
    },
    {
      title: 'Management',
      items: [
        ...(role === 'admin' || role === 'manager'
          ? [
              { icon: FiShoppingBag, label: 'Stores', path: '/stores' },
              { icon: FiLayers, label: 'Shelves', path: '/shelves' },
              { icon: FiVideo, label: 'Cameras', path: '/cameras' },
            ]
          : [])
      ]
    },
    {
      title: 'Analytics & Insights',
      items: [
        { icon: FiTrendingUp, label: 'Analytics', path: '/analytics' },
        { icon: FiFileText, label: 'Reports', path: '/reports' },
        { icon: FiMapPin, label: 'Heatmap', path: '/heatmap' },
        { icon: FiZap, label: 'Recommendations', path: '/recommendations' },
      ]
    },

    {
      title: 'Account',
      items: [
        { icon: FiUser, label: 'Profile', path: '/profile' },
      ]
    }
  ].filter((section) => section.items.length > 0);

  const handleLogout = () => {
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('authUser');
    setUser(null);
    navigate('/');
  };

  const handleNavClick = (path) => {
    if (path !== '#') {
      navigate(path);
      if (onClose) onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <FiShoppingBag aria-hidden="true" />
            <h2>Retail AI</h2>
          </div>
          {onClose && (
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
              <FiX />
            </button>
          )}
        </div>

        <nav className="sidebar-menu">
          {menuSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && item.path !== dashboardPath && location.pathname.startsWith(item.path + '/'));
                return (
                  <button
                    key={item.label}
                    className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                  >
                    <span className="sidebar-icon">
                      <Icon />
                    </span>
                    <span className="sidebar-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              <span className="sidebar-user-role">{roleDisplayName}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <FiLogOut aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

