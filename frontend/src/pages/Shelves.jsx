import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getShelves, deleteShelf } from '../services/shelfService';

function Shelves() {
  const [shelves, setShelves] = useState([]);

  const loadShelves = async () => {
    const response = await getShelves();
    setShelves(response.data);
  };

  useEffect(() => {
    loadShelves();
  }, []);

  const removeShelf = async (id) => {
    await deleteShelf(id);
    loadShelves();
  };

  return (
    <DashboardLayout>
      <h1>Shelves</h1>
      <Link to="/add-shelf">
        <button>Add Shelf</button>
      </Link>
      <br />
      <br />
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Shelf</th>
            <th>Category</th>
            <th>Store</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {shelves.map((shelf) => (
            <tr key={shelf.id}>
              <td>{shelf.id}</td>
              <td>{shelf.shelf_name}</td>
              <td>{shelf.category}</td>
              <td>{shelf.store_id}</td>
              <td>
                <button onClick={() => removeShelf(shelf.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default Shelves;
