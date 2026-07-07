import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getCameras, deleteCamera } from '../services/cameraService';

function Cameras() {
  const [cameras, setCameras] = useState([]);

  const loadCameras = async () => {
    const response = await getCameras();
    setCameras(response.data);
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const removeCamera = async (id) => {
    await deleteCamera(id);
    loadCameras();
  };

  return (
    <DashboardLayout>
      <h1>Cameras</h1>
      <Link to="/add-camera">
        <button>Add Camera</button>
      </Link>
      <br />
      <br />
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Camera</th>
            <th>IP</th>
            <th>Location</th>
            <th>Store</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {cameras.map((camera) => (
            <tr key={camera.id}>
              <td>{camera.id}</td>
              <td>{camera.camera_name}</td>
              <td>{camera.ip_address}</td>
              <td>{camera.location}</td>
              <td>{camera.store_id}</td>
              <td>
                <button onClick={() => removeCamera(camera.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default Cameras;
