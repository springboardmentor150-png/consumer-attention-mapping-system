import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createShelf } from '../services/shelfService';

function AddShelf() {
  const navigate = useNavigate();
  const [shelfName, setShelfName] = useState('');
  const [category, setCategory] = useState('');
  const [storeId, setStoreId] = useState('');

  const saveShelf = async () => {
    await createShelf({
      shelf_name: shelfName,
      category: category,
      store_id: Number(storeId),
    });
    alert('Shelf Added Successfully');
    navigate('/shelves');
  };

  return (
    <div>
      <h2>Add Shelf</h2>
      <input placeholder="Shelf Name" onChange={(e) => setShelfName(e.target.value)} />
      <br />
      <br />
      <input placeholder="Category" onChange={(e) => setCategory(e.target.value)} />
      <br />
      <br />
      <input placeholder="Store ID" onChange={(e) => setStoreId(e.target.value)} />
      <br />
      <br />
      <button onClick={saveShelf}>Save Shelf</button>
    </div>
  );
}

export default AddShelf;
