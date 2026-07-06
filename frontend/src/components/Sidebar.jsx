import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div
      style={{
        width: '250px',
        background: '#1f2937',
        color: 'white',
        minHeight: '100vh',
        padding: '20px'
      }}
    >
      <h2>Retail AI</h2>
      <hr />
      <p>
        <Link to="/dashboard">Dashboard</Link>
      </p>
      <p>
        <Link to="/stores">Stores</Link>
      </p>
      <p>
        <Link to="/shelves">Shelves</Link>
      </p>
      <p>
        <Link to="/cameras">Cameras</Link>
      </p>
      <p>
        <Link to="/profile">Profile</Link>
      </p>
    </div>
  );
}

export default Sidebar;
