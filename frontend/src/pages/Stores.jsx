import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getStores, deleteStore } from '../services/storeService';

function Stores() {
  const [stores, setStores] = useState([]);

  const loadStores = async () => {
    const response = await getStores();
    setStores(response.data);
  };

  useEffect(() => {
    loadStores();
  }, []);

  const removeStore = async (id) => {
    await deleteStore(id);
    loadStores();
  };

  return (
    <DashboardLayout>
      <h1>Stores</h1>
      <Link to="/add-store">
        <button>Add Store</button>
      </Link>
      <br />
      <br />
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td>{store.id}</td>
              <td>{store.store_name}</td>
              <td>{store.location}</td>
              <td>
                <button onClick={() => removeStore(store.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default Stores;
