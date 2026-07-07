import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCamera } from '../services/cameraService';

function AddCamera() {
  const navigate = useNavigate();
  const [cameraName, setCameraName] = useState('');
  const [ip, setIp] = useState('');
  const [location, setLocation] = useState('');
  const [storeId, setStoreId] = useState('');

  const saveCamera = async () => {
    await createCamera({
      camera_name: cameraName,
      ip_address: ip,
      location: location,
      store_id: Number(storeId)
    });
    alert('Camera Added Successfully');
    navigate('/cameras');
  };

  return (
    <div>
      <h2>Add Camera</h2>
      <input placeholder="Camera Name" onChange={(e) => setCameraName(e.target.value)} />
      <br />
      <br />
      <input placeholder="IP Address" onChange={(e) => setIp(e.target.value)} />
      <br />
      <br />
      <input placeholder="Location" onChange={(e) => setLocation(e.target.value)} />
      <br />
      <br />
      <input placeholder="Store ID" onChange={(e) => setStoreId(e.target.value)} />
      <br />
      <br />
      <button onClick={saveCamera}>Save Camera</button>
    </div>
  );
}

export default AddCamera;
