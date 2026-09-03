import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { api } from '../../services/api';

export default function FarmerApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const data = await api.getFarmerApplications();
    setApps(data);
    setLoading(false);
  };

  return (
    <div className="farmer-applications-page">
      <div className="mb-4">
        <span className="eyebrow">APPLICATION TRACKER</span>
        <h2 className="fw-black mb-1">My Lease Applications</h2>
        <p className="text-muted small">Track status of your submitted farmland lease applications.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : apps.length === 0 ? (
        <EmptyState icon="bi-file-earmark-text" title="No Applications Submitted" description="You haven't applied for any land leases yet." actionText="Explore Lands" actionLink="/marketplace" />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Land Name</th>
                  <th>Location</th>
                  <th>Landowner</th>
                  <th>Proposed Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id}>
                    <td className="fw-bold">{app.land_name || 'Green Valley Farm'}</td>
                    <td>{app.location || 'Ongole'}</td>
                    <td>{app.owner_name || 'Venkatesh Rao'}</td>
                    <td className="fw-bold text-success">₹{Number(app.proposed_price || 40000).toLocaleString()}/yr</td>
                    <td>{app.proposed_duration_months || 12} Months</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td className="small text-muted">{app.created_at || '2026-08-25'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
