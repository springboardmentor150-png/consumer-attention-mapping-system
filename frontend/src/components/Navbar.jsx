import { FiBell, FiChevronDown, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const initials = (user?.name || user?.email || 'AD').split(/[\s@]/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-heading">
          <button className="navbar-menu-button" type="button" aria-label="Toggle navigation" onClick={onToggleSidebar}>
            <FiMenu aria-hidden="true" />
          </button>
          <h1 className="navbar-title">Consumer Attention Mapping</h1>
        </div>
        <div className="navbar-actions">
          <button className="navbar-icon-button" type="button" aria-label="Notifications"><FiBell aria-hidden="true" /></button>
          <button className="navbar-profile" type="button" aria-label="Open profile menu"><span>{initials}</span><FiChevronDown aria-hidden="true" /></button>
        </div>
      </div>
    </nav>
  );
}
