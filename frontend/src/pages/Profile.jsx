import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/roleUtils';
import '../styles/Dashboard.css';

export default function Profile() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const roleLabel = getRoleLabel(user?.role);
  const initials = (user?.name || user?.email || 'AD').split(/[\s@]/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <main style={{ padding: '24px', maxWidth: '800px' }}>
        <header className="dashboard-header">
          <div>
            <h1>User Profile</h1>
            <p>Manage your account parameters and role credentials.</p>
          </div>
        </header>

        <section className="dashboard-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              {initials}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', margin: 0 }}>{user?.name || 'User Account'}</h2>
              <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{user?.email || 'user@example.com'}</p>
              <span style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginTop: '6px' }}>
                Role: {roleLabel}
              </span>
            </div>
          </div>

          {saved && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              Profile details updated successfully!
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Full Name</label>
              <input type="text" defaultValue={user?.name || ''} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email Address</label>
              <input type="email" defaultValue={user?.email || ''} readOnly style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Assigned System Role</label>
              <input type="text" defaultValue={roleLabel} readOnly style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px' }} />
            </div>

            <button type="submit" style={{ width: 'fit-content', background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }}>
              Save Profile Changes
            </button>
          </form>
        </section>
      </main>
    </DashboardLayout>
  );
}
