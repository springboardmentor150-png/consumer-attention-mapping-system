import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStore } from '../services/storeService';

function AddStore() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async () => {
    await createStore({
      name: storeName,
      location: location
    });
    alert('Store Added Successfully');
    navigate('/stores');
  };

  return (
    <div>
      <h2>Add Store</h2>
      <input placeholder="Store Name" onChange={(e) => setStoreName(e.target.value)} />
      <br />
      <br />
      <input placeholder="Location" onChange={(e) => setLocation(e.target.value)} />
      <br />
      <br />
      <button onClick={handleSubmit}>Save Store</button>
    </div>
  );
}

export default AddStore;
