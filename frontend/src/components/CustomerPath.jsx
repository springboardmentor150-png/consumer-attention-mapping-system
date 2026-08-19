import { useEffect, useState } from 'react';
import { getCustomerPath } from '../services/analyticsService';

export default function CustomerPath() {
  const [path, setPath] = useState([]);

  useEffect(() => {
    getCustomerPath(1).then((res) => setPath(res.data)).catch(() => setPath([]));
  }, []);

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2>Customer Path</h2>
      </div>
      <pre className="path-preview">{JSON.stringify(path, null, 2)}</pre>
    </section>
  );
}
