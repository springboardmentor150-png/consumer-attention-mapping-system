import { useEffect, useState } from 'react';
import { getShelfRanking } from '../services/analyticsService';

export default function AnalyticsTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getShelfRanking().then((res) => setRows(res.data)).catch(() => setRows([]));
  }, []);

  return (
    <section className="panel-card analytics-table-card">
      <div className="panel-header">
        <h2>Analytics Table</h2>
      </div>
      <div className="table-scroll">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Shelf</th>
              <th>Attention</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.shelf}>
                <td>{row.shelf}</td>
                <td>{row.attention}</td>
                <td>{row.views ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
