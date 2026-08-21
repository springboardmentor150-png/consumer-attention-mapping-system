import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import { SkeletonTable } from '../components/Skeleton';
import { getStores, deleteStore } from '../services/storeService';
import '../styles/Stores.css';

function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStores = async () => {
    try {
      const response = await getStores();
      setStores(response.data);
      setError('');
    } catch {
      setError('Unable to load stores. Please make sure the FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const removeStore = async (id) => {
    try {
      await deleteStore(id);
      loadStores();
    } catch {
      setError('Unable to delete this store. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <main className="stores-page">
        <section className="stores-page-header">
          <div>
            <h1>Stores</h1>
            <p>Manage all your stores from here.</p>
          </div>
          <Link to="/add-store" className="add-store-button">
            <FiPlus aria-hidden="true" />
            <span>Add Store</span>
          </Link>
        </section>

        {error && <p className="stores-error" role="alert">{error}</p>}

        {loading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : (
          <section className="stores-table-card" aria-label="Stores list">
            <div className="stores-table-scroll">
              <table className="stores-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Store Name</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length ? stores.map((store) => (
                    <tr key={store.id}>
                      <td>{store.id}</td>
                      <td className="store-name">{store.store_name || store.name}</td>
                      <td>
                        <span className="store-location"><FiMapPin aria-hidden="true" />{store.location}</span>
                      </td>
                      <td>
                        <div className="store-actions">
                          <button type="button" className="store-action-button edit" aria-label={`Edit ${store.store_name || store.name}`} title="Edit store">
                            <FiEdit2 aria-hidden="true" />
                          </button>
                          <button type="button" className="store-action-button delete" aria-label={`Delete ${store.store_name || store.name}`} title="Delete store" onClick={() => removeStore(store.id)}>
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td className="stores-empty" colSpan="4">No stores yet. Add your first store to get started.</td></tr>
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

export default Stores;
