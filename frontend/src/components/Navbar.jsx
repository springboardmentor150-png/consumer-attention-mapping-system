import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div
      style={{
        background: '#2563eb',
        color: 'white',
        padding: '15px',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <h2>Consumer Attention Mapping</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Navbar;
