import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCamera, FiPlus, FiTrash2, FiVideo } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import { SkeletonTable } from '../components/Skeleton';
import { getCameras, deleteCamera } from '../services/cameraService';
import '../styles/Stores.css';

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCameras = async () => {
    try {
      const response = await getCameras();
      setCameras(response.data);
      setError('');
    } catch {
      setError('Unable to load cameras. Please make sure the FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const removeCamera = async (id) => {
    try {
      await deleteCamera(id);
      loadCameras();
    } catch {
      setError('Unable to delete camera. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <main className="stores-page">
        <section className="stores-page-header">
          <div>
            <h1>Cameras</h1>
            <p>Monitor live vision feeds, camera RTSP streams, and location mapping.</p>
          </div>
          <Link to="/add-camera" className="add-store-button">
            <FiPlus aria-hidden="true" />
            <span>Add Camera</span>
          </Link>
        </section>

        {error && <p className="stores-error" role="alert">{error}</p>}

        {loading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : (
          <section className="stores-table-card" aria-label="Cameras list">
            <div className="stores-table-scroll">
              <table className="stores-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Camera Name</th>
                    <th>Source RTSP / Stream</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cameras.length ? cameras.map((camera) => (
                    <tr key={camera.id}>
                      <td>{camera.id}</td>
                      <td className="store-name">
                        <span className="store-location"><FiVideo aria-hidden="true" />{camera.camera_name || camera.name || `Camera #${camera.id}`}</span>
                      </td>
                      <td>{camera.rtsp_url || camera.stream_url || 'Live Stream Feed'}</td>
                      <td>
                        <div className="store-actions">
                          <button type="button" className="store-action-button delete" aria-label="Delete camera" title="Delete camera" onClick={() => removeCamera(camera.id)}>
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td className="stores-empty" colSpan="4">No cameras configured. Click Add Camera to configure your first feed.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}
