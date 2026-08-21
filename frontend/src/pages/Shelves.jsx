import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import { SkeletonTable } from '../components/Skeleton';
import { getShelves, deleteShelf } from '../services/shelfService';
import { getStores } from '../services/storeService';
import '../styles/Shelves.css';

const PAGE_SIZE = 8;

function Shelves() {
  const [shelves, setShelves] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const loadShelves = async () => {
    try {
      const response = await getShelves();
      setShelves(response.data);
      setError('');
    } catch {
      setError('Unable to load shelves. Please make sure the FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelves();
    getStores().then((response) => setStores(response.data)).catch(() => setStores([]));
  }, []);

  const storeNames = useMemo(() => new Map(stores.map((store) => [store.id, store.store_name || store.name])), [stores]);
  const pageCount = Math.max(1, Math.ceil(shelves.length / PAGE_SIZE));
  const visibleShelves = shelves.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const removeShelf = async (id) => {
    try {
      await deleteShelf(id);
      const nextCount = shelves.length - 1;
      if (page > Math.max(1, Math.ceil(nextCount / PAGE_SIZE))) setPage(Math.max(1, Math.ceil(nextCount / PAGE_SIZE)));
      loadShelves();
    } catch {
      setError('Unable to delete this shelf. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <main className="shelves-page">
        <section className="shelves-panel" aria-labelledby="shelves-title">
          <header className="shelves-page-header">
            <div>
              <h1 id="shelves-title">Shelves</h1>
              <p>Manage shelves and their category/store details.</p>
            </div>
            <Link to="/add-shelf" className="add-shelf-button"><FiPlus aria-hidden="true" /><span>Add Shelf</span></Link>
          </header>

          {error && <p className="shelves-error" role="alert">{error}</p>}

          {loading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : (
            <>
              <section className="shelves-table-card" aria-label="Shelves list">
                <div className="shelves-table-scroll">
                  <table className="shelves-table">
                    <thead>
                      <tr><th>ID</th><th>Shelf Name</th><th>Category</th><th>Store</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {visibleShelves.length ? visibleShelves.map((shelf) => (
                        <tr key={shelf.id}>
                          <td>{shelf.id}</td>
                          <td className="shelf-name">{shelf.shelf_name}</td>
                          <td><span className="shelf-category">{shelf.category}</span></td>
                          <td><span className="shelf-store">{shelf.store_id} - {storeNames.get(shelf.store_id) || 'Store'}</span></td>
                          <td>
                            <div className="shelf-actions">
                              <button type="button" className="shelf-action-button edit" aria-label={`Edit ${shelf.shelf_name}`} title="Edit shelf"><FiEdit2 aria-hidden="true" /></button>
                              <button type="button" className="shelf-action-button delete" aria-label={`Delete ${shelf.shelf_name}`} title="Delete shelf" onClick={() => removeShelf(shelf.id)}><FiTrash2 aria-hidden="true" /></button>
                            </div>
                          </td>
                        </tr>
                      )) : <tr><td className="shelves-empty" colSpan="5">No shelves yet. Add your first shelf to get started.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>

              {shelves.length > PAGE_SIZE && (
                <nav className="shelves-pagination" aria-label="Shelves pages">
                  <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><FiChevronLeft aria-hidden="true" /></button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={page === pageNumber ? 'active' : ''} aria-current={page === pageNumber ? 'page' : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
                  <button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}><FiChevronRight aria-hidden="true" /></button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default Shelves;
